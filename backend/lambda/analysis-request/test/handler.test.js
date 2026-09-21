const test = require('node:test');
const assert = require('node:assert/strict');

process.env.APP_BASE_URL = 'https://app.example.com';
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/x';
process.env.SES_FROM_EMAIL = 'noreply@example.com';

const { createHandler } = require('../index');
const { createFakeDb } = require('./fakeDb');
const { requestsToCsv } = require('../lib/csv');
const { sanitizeReportHtml } = require('../lib/sanitize');
const { notifySlackNewSubmission, buildReportEmail } = require('../lib/notify');

const USER = { sub: 'user-1', email: 'user@example.com', 'cognito:username': 'user1' };
const ADMIN = { sub: 'admin-1', email: 'admin@example.com', 'cognito:groups': ['Admins'] };

const tokenFor = (claims) => `tok:${JSON.stringify(claims)}`;
const verifyToken = async (token) => {
  if (!token.startsWith('tok:')) throw new Error('bad token');
  return JSON.parse(token.slice(4));
};

function makeEvent({ method = 'GET', path = '/', claims, body, query } = {}) {
  return {
    httpMethod: method,
    path: `/dev/analysis-request${path === '/' ? '' : path}`,
    headers: claims ? { Authorization: `Bearer ${tokenFor(claims)}` } : {},
    body: body ? JSON.stringify(body) : null,
    queryStringParameters: query || null,
  };
}

function setup() {
  const db = createFakeDb({ 'sayme-users': [{ userId: 'user-1', email: 'from-table@example.com' }] });
  const slackCalls = [];
  const emailCalls = [];
  const handler = createHandler({
    docClient: db,
    verifyToken,
    notifySlack: async (item) => { slackCalls.push(item); return { sent: true }; },
    sendEmail: async (args) => { emailCalls.push(args); return { sent: true, messageId: 'm-1' }; },
  });
  const call = async (opts) => {
    const res = await handler(makeEvent(opts));
    let json = null;
    try { json = JSON.parse(res.body); } catch { /* csv 등 */ }
    return { res, json };
  };
  return { db, handler, call, slackCalls, emailCalls };
}

const SUBMIT_BODY = {
  name: '홍길동', phone: '010-1234-5678', consent: true,
  answers: { 생년월일: '1990-01-01', 고민: '진로가 고민입니다', 관심분야: ['커리어', '관계'] },
};

test('OPTIONS returns CORS 200', async () => {
  const { call } = setup();
  const { res } = await call({ method: 'OPTIONS' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
});

test('unauthenticated requests are rejected', async () => {
  const { call } = setup();
  const { res: a } = await call({ method: 'POST', body: SUBMIT_BODY });
  assert.equal(a.statusCode, 401);
  const { res: b } = await call({ path: '/mine', claims: undefined });
  assert.equal(b.statusCode, 401);
  const { res: c } = await call({ path: '/mine', claims: null, });
  assert.equal(c.statusCode, 401);
});

test('submit validates required fields', async () => {
  const { call } = setup();
  const { res, json } = await call({ method: 'POST', claims: USER, body: { ...SUBMIT_BODY, name: '' } });
  assert.equal(res.statusCode, 400);
  assert.match(json.error, /이름/);
  const { res: r2 } = await call({ method: 'POST', claims: USER, body: { ...SUBMIT_BODY, consent: false } });
  assert.equal(r2.statusCode, 400);
});

test('submit stores item, uses token email, and sends Slack notification', async () => {
  const { call, slackCalls, db } = setup();
  const { res, json } = await call({ method: 'POST', claims: USER, body: SUBMIT_BODY });
  assert.equal(res.statusCode, 200);
  assert.equal(json.success, true);
  assert.equal(json.request.status, 'submitted');
  assert.equal(json.request.statusLabel, '접수 완료');
  assert.equal(json.request.email, 'user@example.com');
  assert.equal(json.notifications.slack, true);
  assert.equal(slackCalls.length, 1);
  assert.equal(slackCalls[0].name, '홍길동');
  assert.deepEqual(slackCalls[0].answers.관심분야, ['커리어', '관계']);
  // viewToken 은 사용자 응답에 노출되지 않는다
  assert.equal(json.request.viewToken, undefined);
  const stored = db.tables['sayme-analysis-requests'].get(json.request.requestId);
  assert.ok(stored.viewToken.length >= 32);
});

test('submit falls back to users table email when token has none', async () => {
  const { call } = setup();
  const { json } = await call({ method: 'POST', claims: { sub: 'user-1' }, body: SUBMIT_BODY });
  assert.equal(json.request.email, 'from-table@example.com');
});

test('user can list and view own requests but not others', async () => {
  const { call } = setup();
  const { json: created } = await call({ method: 'POST', claims: USER, body: SUBMIT_BODY });
  const id = created.request.requestId;

  const { json: mine } = await call({ path: '/mine', claims: USER });
  assert.equal(mine.count, 1);
  assert.equal(mine.requests[0].requestId, id);

  const { res: detail, json: dj } = await call({ path: `/${id}`, claims: USER });
  assert.equal(detail.statusCode, 200);
  assert.equal(dj.request.reportHtml, undefined, '전송 전에는 보고서가 노출되지 않는다');

  const { res: other } = await call({ path: `/${id}`, claims: { sub: 'user-2' } });
  assert.equal(other.statusCode, 403);

  const { res: missing } = await call({ path: '/nope', claims: USER });
  assert.equal(missing.statusCode, 404);
});

test('admin routes require Admins group', async () => {
  const { call } = setup();
  const { res } = await call({ path: '/admin', claims: USER });
  assert.equal(res.statusCode, 403);
  const { res: str } = await call({ path: '/admin', claims: { sub: 'a', 'cognito:groups': '[Admins premium]' } });
  assert.equal(str.statusCode, 200, '문자열 형태 groups 도 인식');
});

test('full admin flow: confirm → write → send (email) → user sees report; token link works', async () => {
  const { call, emailCalls } = setup();
  const { json: created } = await call({ method: 'POST', claims: USER, body: SUBMIT_BODY });
  const id = created.request.requestId;

  // 목록 + 카운트
  const { json: list } = await call({ path: '/admin', claims: ADMIN });
  assert.equal(list.count, 1);
  assert.equal(list.counts.submitted, 1);
  assert.ok(list.requests[0].viewToken, '관리자에게는 토큰 노출');

  // 상태 필터
  const { json: filtered } = await call({ path: '/admin', claims: ADMIN, query: { status: 'sent' } });
  assert.equal(filtered.count, 0);

  // 관리자 확인
  const { json: confirmed } = await call({ method: 'PUT', path: `/admin/${id}/status`, claims: ADMIN, body: { status: 'confirmed', adminNote: '확인함' } });
  assert.equal(confirmed.request.status, 'confirmed');
  assert.equal(confirmed.request.adminNote, '확인함');
  assert.equal(confirmed.request.statusHistory.length, 2);

  // 잘못된 상태
  const { res: bad } = await call({ method: 'PUT', path: `/admin/${id}/status`, claims: ADMIN, body: { status: 'weird' } });
  assert.equal(bad.statusCode, 400);
  const { res: viaStatus } = await call({ method: 'PUT', path: `/admin/${id}/status`, claims: ADMIN, body: { status: 'sent' } });
  assert.equal(viaStatus.statusCode, 400, 'sent 는 status 엔드포인트로 불가');

  // 보고서 없이 전송 시도 → 400
  const { res: noReport } = await call({ method: 'POST', path: `/admin/${id}/send`, claims: ADMIN, body: {} });
  assert.equal(noReport.statusCode, 400);

  // 보고서 저장 → 자동으로 writing
  const html = '<h1>결과</h1><script>alert(1)</script><p onclick="x()">본문</p>';
  const { json: saved } = await call({ method: 'PUT', path: `/admin/${id}/report`, claims: ADMIN, body: { reportTitle: '2026 분석', reportHtml: html } });
  assert.equal(saved.request.status, 'writing');
  assert.equal(saved.request.reportHtml, '<h1>결과</h1><p>본문</p>');
  assert.equal(saved.request.hasReport, true);

  // 사용자 상태 확인 (아직 보고서 미노출)
  const { json: userView } = await call({ path: `/${id}`, claims: USER });
  assert.equal(userView.request.status, 'writing');
  assert.equal(userView.request.statusLabel, '보고서 작성 중');
  assert.equal(userView.request.reportHtml, undefined);

  // 토큰 링크는 전송 전에는 409
  const { res: early } = await call({ path: `/${id}/report`, query: { token: saved.request.viewToken } });
  assert.equal(early.statusCode, 409);

  // 전송
  const { res: sendRes, json: sent } = await call({ method: 'POST', path: `/admin/${id}/send`, claims: ADMIN, body: {} });
  assert.equal(sendRes.statusCode, 200);
  assert.equal(sent.request.status, 'sent');
  assert.equal(sent.email.sent, true);
  assert.equal(emailCalls.length, 1);
  assert.equal(emailCalls[0].to, 'user@example.com');
  assert.equal(emailCalls[0].reportTitle, '2026 분석');
  assert.equal(emailCalls[0].viewUrl, `https://app.example.com/report/view/?id=${id}&token=${saved.request.viewToken}`);
  assert.equal(sent.request.emailSentAt !== null, true);

  // 사용자에게 보고서 노출
  const { json: after } = await call({ path: `/${id}`, claims: USER });
  assert.equal(after.request.reportHtml, '<h1>결과</h1><p>본문</p>');

  // 토큰 링크 (로그인 없음)
  const { res: pub, json: pj } = await call({ path: `/${id}/report`, query: { token: saved.request.viewToken } });
  assert.equal(pub.statusCode, 200);
  assert.equal(pj.report.reportTitle, '2026 분석');
  const { res: badTok } = await call({ path: `/${id}/report`, query: { token: 'x'.repeat(48) } });
  assert.equal(badTok.statusCode, 403);

  // 저장 후 상태는 sent 유지
  const { json: resaved } = await call({ method: 'PUT', path: `/admin/${id}/report`, claims: ADMIN, body: { reportHtml: '<p>v2</p>' } });
  assert.equal(resaved.request.status, 'sent');

  // CSV export
  const { res: csv } = await call({ path: '/admin/export', claims: ADMIN });
  assert.equal(csv.statusCode, 200);
  assert.match(csv.headers['Content-Type'], /text\/csv/);
  assert.ok(csv.body.startsWith('﻿'));
  assert.match(csv.body, /요청ID,상태코드,상태,이름/);
  assert.match(csv.body, /답변:고민/);
  assert.match(csv.body, /홍길동/);
  assert.match(csv.body, /커리어 \| 관계/);

  // 삭제
  const { res: del } = await call({ method: 'DELETE', path: `/admin/${id}`, claims: ADMIN });
  assert.equal(del.statusCode, 200);
  const { res: gone } = await call({ path: `/admin/${id}`, claims: ADMIN });
  assert.equal(gone.statusCode, 404);
});

test('send reports email failure but still marks sent', async () => {
  const db = createFakeDb();
  const handler = createHandler({
    docClient: db, verifyToken,
    notifySlack: async () => ({ sent: false, error: 'no webhook' }),
    sendEmail: async () => ({ sent: false, error: 'MessageRejected' }),
  });
  const created = JSON.parse((await handler(makeEvent({ method: 'POST', claims: USER, body: SUBMIT_BODY }))).body);
  assert.equal(created.notifications.slack, false);
  const id = created.request.requestId;
  const sent = JSON.parse((await handler(makeEvent({ method: 'POST', path: `/admin/${id}/send`, claims: ADMIN, body: { reportHtml: '<p>r</p>' } }))).body);
  assert.equal(sent.request.status, 'sent');
  assert.equal(sent.email.sent, false);
  assert.equal(sent.request.emailError, 'MessageRejected');
});

test('csv escapes quotes, newlines and formula injection', () => {
  const csv = requestsToCsv([{ requestId: 'r', status: 'submitted', name: 'a"b', answers: { memo: 'line1\nline2', f: '=SUM(1)' }, createdAt: 'x' }]);
  assert.match(csv, /"a""b"/);
  assert.match(csv, /"line1\nline2"/);
  assert.match(csv, /'=SUM\(1\)/);
});

test('sanitizeReportHtml strips dangerous content', () => {
  const out = sanitizeReportHtml('<a href="javascript:alert(1)">x</a><iframe src="e"></iframe><img src=x onerror="y"><style>.a{}</style>');
  assert.equal(out.includes('javascript:'), false);
  assert.equal(out.includes('iframe'), false);
  assert.equal(out.includes('onerror'), false);
  assert.ok(out.includes('<style>'), '스타일은 유지');
});

test('slack notification posts blocks and handles webhook failure', async () => {
  const calls = [];
  const item = { requestId: 'r1', name: '김', email: 'k@e.com', phone: '010', createdAt: 'now', answers: { q: 'a' } };
  const r = await notifySlackNewSubmission(item, { fetch: async (url, opts) => { calls.push({ url, body: JSON.parse(opts.body) }); return { ok: true }; } });
  assert.equal(r.sent, true);
  assert.equal(calls[0].url, process.env.SLACK_WEBHOOK_URL);
  assert.match(calls[0].body.text, /새 분석 리포트 신청/);
  assert.ok(calls[0].body.blocks.some((b) => b.type === 'actions'), '어드민 링크 버튼 포함');
  const bad = await notifySlackNewSubmission(item, { fetch: async () => ({ ok: false, status: 500, text: async () => 'err' }) });
  assert.equal(bad.sent, false);
});

test('report email escapes html and includes link', () => {
  const m = buildReportEmail({ name: '<b>x</b>', reportTitle: 'T', viewUrl: 'https://a/b?x=1&y=2' });
  assert.ok(m.html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(m.html.includes('https://a/b?x=1&amp;y=2'));
  assert.ok(m.text.includes('https://a/b?x=1&y=2'));
  assert.match(m.subject, /도착했습니다/);
});
