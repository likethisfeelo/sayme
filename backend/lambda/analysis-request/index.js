/**
 * Lambda: sayme-analysis-request
 *
 * 분석 리포트 신청 서비스 (단일 Lambda + 내부 라우팅)
 * API Gateway: /analysis-request/{proxy+}  ANY  → Lambda 프록시 통합
 *
 * [사용자]
 *   POST   /analysis-request                     입력 제출 (→ Slack 알림)
 *   GET    /analysis-request/mine                내 신청 목록 (상태 포함)
 *   GET    /analysis-request/{id}                내 신청 상세 (전송 완료 시 보고서 HTML 포함)
 *   GET    /analysis-request/{id}/report?token=  이메일 링크용 보고서 조회 (토큰 인증, 로그인 불필요)
 *   GET    /analysis-request/draft               내 임시저장 (없으면 draft: null)
 *   PUT    /analysis-request/draft               임시저장 저장/갱신 { answers, contact?, progress? }
 *   DELETE /analysis-request/draft               임시저장 삭제
 *
 * [관리자] (cognito:groups 에 Admins)
 *   GET    /analysis-request/admin?status=       전체 목록
 *   GET    /analysis-request/admin/export        CSV 다운로드
 *   GET    /analysis-request/admin/{id}          상세
 *   PUT    /analysis-request/admin/{id}/status   상태 변경 { status, adminNote? }
 *   PUT    /analysis-request/admin/{id}/report   보고서(HTML) 저장 { reportTitle, reportHtml }
 *   POST   /analysis-request/admin/{id}/send     보고서 전송 (상태 sent + 이메일 발송)
 *   DELETE /analysis-request/admin/{id}          삭제
 *
 * 테이블: sayme-analysis-requests (PK requestId, GSI userId-createdAt-index)
 */
const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

const { authenticate } = require('./lib/auth');
const { STATUS, STATUS_ORDER, STATUS_LABEL, isValidStatus } = require('./lib/constants');
const { notifySlackNewSubmission, sendReportEmail } = require('./lib/notify');
const { requestsToCsv } = require('./lib/csv');
const { sanitizeReportHtml } = require('./lib/sanitize');

const TABLE_NAME = process.env.ANALYSIS_REQUESTS_TABLE || 'sayme-analysis-requests';
const USER_INDEX = process.env.ANALYSIS_REQUESTS_USER_INDEX || 'userId-createdAt-index';
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'sayme-users';
const ROUTE_PREFIX = '/analysis-request';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

let defaultDocClient = null;
function getDocClient() {
  if (!defaultDocClient) {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
    defaultDocClient = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });
  }
  return defaultDocClient;
}

// ---------- 공통 유틸 ----------

class HttpError extends Error {
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.statusCode = statusCode;
    this.extra = extra;
  }
}

const respond = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { ...JSON_HEADERS, ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const ok = (body) => respond(200, { success: true, ...body });

function getMethod(event) {
  return (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();
}

/**
 * 스테이지/프리픽스를 제거한 서브 경로 반환. 예) /dev/analysis-request/admin/x → /admin/x
 */
function getSubPath(event) {
  let path = event.path || event.rawPath || '/';
  if (event.pathParameters?.proxy !== undefined) {
    path = `/${event.pathParameters.proxy}`;
  } else {
    const idx = path.indexOf(ROUTE_PREFIX);
    path = idx >= 0 ? path.slice(idx + ROUTE_PREFIX.length) : path;
  }
  path = path.replace(/\/+$/, '');
  return path === '' ? '/' : path;
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body;
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, '요청 본문(JSON) 형식이 올바르지 않습니다.');
  }
}

const nowIso = () => new Date().toISOString();

const cleanString = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : v == null ? '' : String(v).slice(0, max));

/**
 * answers 정리: 문자열/숫자/불리언, 배열, 중첩 객체(깊이 6까지) 허용
 * - 문자열 5000자, 배열 50개, 객체 키 100개 제한
 */
function normalizeValue(value, depth = 0) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value.trim().slice(0, 5000);
  if (depth >= 6) return JSON.stringify(value).slice(0, 5000);
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => normalizeValue(v, depth + 1) ?? '');
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value).slice(0, 100)) {
      const nv = normalizeValue(v, depth + 1);
      if (nv !== undefined) out[String(k).slice(0, 100)] = nv;
    }
    return out;
  }
  return String(value).slice(0, 5000);
}

function normalizeAnswers(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return normalizeValue(input, 0) || {};
}

function publicView(item, { includeReport = false, includeToken = false } = {}) {
  if (!item) return null;
  const base = {
    requestId: item.requestId,
    userId: item.userId,
    status: item.status,
    statusLabel: STATUS_LABEL[item.status] || item.status,
    statusHistory: item.statusHistory || [],
    name: item.name,
    email: item.email,
    phone: item.phone,
    answers: item.answers || {},
    chapter: item.chapter || 'all',
    chapterTitle: item.chapterTitle || null,
    reportTitle: item.reportTitle || null,
    hasReport: !!item.reportHtml,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    sentAt: item.sentAt || null,
    emailSentAt: item.emailSentAt || null,
    source: item.source || null,
  };
  if (includeReport) base.reportHtml = item.reportHtml || '';
  if (includeToken) {
    base.adminNote = item.adminNote || '';
    base.emailError = item.emailError || null;
    base.reportUpdatedAt = item.reportUpdatedAt || null;
    base.viewToken = item.viewToken || null;
  }
  return base;
}

function buildViewUrl(item) {
  const base = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
  return `${base}/mandalart/report/?id=${encodeURIComponent(item.requestId)}&token=${encodeURIComponent(item.viewToken)}`;
}

// ---------- 핸들러 팩토리 (테스트를 위해 의존성 주입 가능) ----------

function createHandler(deps = {}) {
  const docClient = deps.docClient || null;
  const db = () => docClient || getDocClient();
  const notify = {
    slack: deps.notifySlack || notifySlackNewSubmission,
    email: deps.sendEmail || sendReportEmail,
  };
  const authDeps = deps.verifyToken ? { verifyToken: deps.verifyToken } : {};

  async function getItem(requestId) {
    const res = await db().send(new GetCommand({ TableName: TABLE_NAME, Key: { requestId } }));
    return res.Item || null;
  }

  async function requireItem(requestId) {
    const item = await getItem(requestId);
    if (!item) throw new HttpError(404, '신청 내역을 찾을 수 없습니다.');
    return item;
  }

  async function lookupUserEmail(userId) {
    try {
      const res = await db().send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }));
      return res.Item || null;
    } catch (error) {
      console.warn('users table lookup failed:', error.message);
      return null;
    }
  }

  async function scanAll(params) {
    let items = [];
    let lastKey;
    do {
      const res = await db().send(new ScanCommand({ ...params, ...(lastKey ? { ExclusiveStartKey: lastKey } : {}) }));
      items = items.concat(res.Items || []);
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return items;
  }

  async function listByUser(userId) {
    try {
      let items = [];
      let lastKey;
      do {
        const res = await db().send(new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: USER_INDEX,
          KeyConditionExpression: 'userId = :u',
          ExpressionAttributeValues: { ':u': userId },
          ScanIndexForward: false,
          ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
        }));
        items = items.concat(res.Items || []);
        lastKey = res.LastEvaluatedKey;
      } while (lastKey);
      return items;
    } catch (error) {
      // GSI 미생성 등 예외 시 Scan 으로 폴백
      console.warn('user index query failed, falling back to scan:', error.message);
      const items = await scanAll({
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': userId },
      });
      return items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
  }

  async function appendStatus(item, status, by, extraSet = {}, extraValues = {}) {
    const at = nowIso();
    const entry = { status, at, by };
    const names = { '#status': 'status', '#history': 'statusHistory', '#updatedAt': 'updatedAt' };
    const values = {
      ':status': status,
      ':entry': [entry],
      ':empty': [],
      ':now': at,
      ...extraValues,
    };
    const sets = ['#status = :status', '#history = list_append(if_not_exists(#history, :empty), :entry)', '#updatedAt = :now'];
    for (const expr of Object.keys(extraSet)) sets.push(expr);

    const res = await db().send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { requestId: item.requestId },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));
    return res.Attributes;
  }

  // ----- 사용자 라우트 -----

  async function submit(event, auth) {
    const body = parseBody(event);
    const name = cleanString(body.name, 100);
    const phone = cleanString(body.phone, 50);
    const answers = normalizeAnswers(body.answers);

    if (!name) throw new HttpError(400, '이름을 입력해 주세요.');
    if (!phone) throw new HttpError(400, '연락처를 입력해 주세요.');
    if (body.consent !== true) throw new HttpError(400, '개인정보 수집·이용에 동의해 주세요.');

    let email = cleanString(body.email, 200) || auth.email;
    if (!email) {
      const user = await lookupUserEmail(auth.userId);
      email = user?.email || '';
    }
    if (!email) throw new HttpError(400, '이메일 정보를 확인할 수 없습니다. 이메일을 입력해 주세요.');

    // 챕터 단위 제출: answers 에 포함된 워크시트 키 (예: complete / torment). 없으면 전체
    const chapter = cleanString(body.chapter, 50) || (Object.keys(answers).length === 1 ? Object.keys(answers)[0] : 'all');
    const chapterTitle = cleanString(body.chapterTitle, 100) || answers?.[chapter]?.title || null;

    const createdAt = nowIso();
    const item = {
      requestId: `ar_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: auth.userId,
      username: auth.username || null,
      name,
      email,
      phone,
      chapter,
      chapterTitle,
      answers,
      consent: true,
      source: cleanString(body.source, 50) || 'web',
      status: STATUS.SUBMITTED,
      statusHistory: [{ status: STATUS.SUBMITTED, at: createdAt, by: 'user' }],
      viewToken: crypto.randomBytes(24).toString('hex'),
      createdAt,
      updatedAt: createdAt,
    };

    await db().send(new PutCommand({ TableName: TABLE_NAME, Item: item, ConditionExpression: 'attribute_not_exists(requestId)' }));

    // 임시저장은 제출 후에도 유지 (사용자가 최종 화면을 계속 볼 수 있고, 수정 후 재제출 가능)
    try {
      await db().send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { requestId: draftId(auth.userId) },
        ConditionExpression: 'attribute_exists(requestId)',
        UpdateExpression: 'SET lastSubmittedRequestId = :r, lastSubmittedAt = :t',
        ExpressionAttributeValues: { ':r': item.requestId, ':t': createdAt },
      }));
    } catch (error) {
      if (error.name !== 'ConditionalCheckFailedException') console.warn('draft mark failed:', error.message);
    }

    const slack = await notify.slack(item);
    if (!slack.sent) console.warn('Slack notification skipped/failed:', slack.error);

    return ok({ message: '신청이 접수되었습니다.', request: publicView(item), notifications: { slack: slack.sent } });
  }

  // ----- 임시저장 (사용자당 1건, status 'draft' - 관리자 목록/알림 제외) -----
  const draftId = (userId) => `draft_${userId}`;

  function draftView(item) {
    if (!item) return null;
    return {
      answers: item.answers || {},
      contact: item.contact || {},
      progress: item.progress || {},
      updatedAt: item.updatedAt,
      lastSubmittedRequestId: item.lastSubmittedRequestId || null,
      lastSubmittedAt: item.lastSubmittedAt || null,
    };
  }

  async function getDraft(auth) {
    const item = await getItem(draftId(auth.userId));
    return ok({ draft: draftView(item) });
  }

  async function saveDraft(event, auth) {
    const body = parseBody(event);
    const now = nowIso();
    const contact = body.contact && typeof body.contact === 'object' ? {
      name: cleanString(body.contact.name, 100),
      phone: cleanString(body.contact.phone, 50),
      email: cleanString(body.contact.email, 200),
    } : {};
    const item = {
      requestId: draftId(auth.userId),
      userId: auth.userId,
      status: 'draft',
      answers: normalizeAnswers(body.answers),
      contact,
      progress: normalizeValue(body.progress, 1) || {},
      updatedAt: now,
    };
    const existing = await getItem(item.requestId);
    item.createdAt = existing?.createdAt || now;
    await db().send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return ok({ draft: draftView(item) });
  }

  async function deleteDraft(auth) {
    await db().send(new DeleteCommand({ TableName: TABLE_NAME, Key: { requestId: draftId(auth.userId) } }));
    return ok({ deleted: true });
  }

  async function listMine(auth) {
    const items = (await listByUser(auth.userId)).filter((i) => i.status !== 'draft');
    return ok({ requests: items.map((i) => publicView(i)), count: items.length });
  }

  async function getMine(auth, requestId) {
    const item = await requireItem(requestId);
    if (item.userId !== auth.userId && !auth.isAdmin) throw new HttpError(403, '본인의 신청만 조회할 수 있습니다.');
    const includeReport = item.status === STATUS.SENT || auth.isAdmin;
    return ok({ request: publicView(item, { includeReport, includeToken: auth.isAdmin }) });
  }

  async function getReportByToken(event, requestId) {
    const token = event.queryStringParameters?.token || '';
    const item = await requireItem(requestId);
    if (!token || !item.viewToken || token.length !== item.viewToken.length ||
        !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(item.viewToken))) {
      throw new HttpError(403, '유효하지 않은 링크입니다.');
    }
    if (item.status !== STATUS.SENT || !item.reportHtml) {
      throw new HttpError(409, '아직 보고서가 전송되지 않았습니다.', { status: item.status, statusLabel: STATUS_LABEL[item.status] });
    }
    return ok({
      report: {
        requestId: item.requestId,
        name: item.name,
        reportTitle: item.reportTitle || '분석 보고서',
        reportHtml: item.reportHtml,
        sentAt: item.sentAt,
      },
    });
  }

  // ----- 관리자 라우트 -----

  async function adminList(event) {
    const status = event.queryStringParameters?.status;
    const params = { TableName: TABLE_NAME };
    if (status && isValidStatus(status)) {
      params.FilterExpression = '#s = :s';
      params.ExpressionAttributeNames = { '#s': 'status' };
      params.ExpressionAttributeValues = { ':s': status };
    }
    const items = (await scanAll(params)).filter((i) => i.status !== 'draft');
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
    for (const i of items) counts[i.status] = (counts[i.status] || 0) + 1;

    return ok({ requests: items.map((i) => publicView(i, { includeToken: true })), count: items.length, counts });
  }

  async function adminExport(event) {
    const status = event.queryStringParameters?.status;
    const items = (await scanAll({ TableName: TABLE_NAME })).filter((i) => i.status !== 'draft');
    const filtered = status && isValidStatus(status) ? items.filter((i) => i.status === status) : items;
    filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const csv = requestsToCsv(filtered);
    const filename = `analysis-requests-${nowIso().slice(0, 10)}.csv`;
    return respond(200, csv, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });
  }

  async function adminGet(requestId) {
    const item = await requireItem(requestId);
    if (item.status === 'draft') throw new HttpError(404, '신청 내역을 찾을 수 없습니다.');
    return ok({ request: publicView(item, { includeReport: true, includeToken: true }) });
  }

  async function adminUpdateStatus(event, auth, requestId) {
    const body = parseBody(event);
    const { status } = body;
    const noteOnly = status === undefined || status === null || status === '';
    if (!noteOnly && !isValidStatus(status)) throw new HttpError(400, `status 는 ${STATUS_ORDER.join(', ')} 중 하나여야 합니다.`);
    if (status === STATUS.SENT) throw new HttpError(400, '보고서 전송은 /send 엔드포인트를 사용해 주세요.');

    const item = await requireItem(requestId);
    const extraSet = {};
    const extraValues = {};
    if (body.adminNote !== undefined) {
      extraSet['adminNote = :note'] = true;
      extraValues[':note'] = cleanString(body.adminNote, 5000);
    }

    // status 없이 호출하면 메모만 저장 (상태/이력 변경 없음)
    if (noteOnly) {
      if (body.adminNote === undefined) throw new HttpError(400, 'status 또는 adminNote 가 필요합니다.');
      const res = await db().send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { requestId },
        UpdateExpression: 'SET adminNote = :note, updatedAt = :now',
        ExpressionAttributeValues: { ':note': extraValues[':note'], ':now': nowIso() },
        ReturnValues: 'ALL_NEW',
      }));
      return ok({ request: publicView(res.Attributes, { includeReport: true, includeToken: true }) });
    }

    const updated = await appendStatus(item, status, auth.email || auth.userId, extraSet, extraValues);
    return ok({ request: publicView(updated, { includeReport: true, includeToken: true }) });
  }

  async function adminSaveReport(event, auth, requestId) {
    const body = parseBody(event);
    const item = await requireItem(requestId);
    const reportHtml = sanitizeReportHtml(typeof body.reportHtml === 'string' ? body.reportHtml : '');
    const reportTitle = cleanString(body.reportTitle, 200) || item.reportTitle || '분석 보고서';
    const at = nowIso();

    // 보고서를 작성하기 시작하면 상태를 '작성 중'으로 올림 (이미 전송된 건은 유지)
    const shouldAdvance = item.status === STATUS.SUBMITTED || item.status === STATUS.CONFIRMED;

    let updated;
    if (shouldAdvance) {
      updated = await appendStatus(
        item,
        STATUS.WRITING,
        auth.email || auth.userId,
        { 'reportHtml = :html': true, 'reportTitle = :title': true, 'reportUpdatedAt = :rat': true },
        { ':html': reportHtml, ':title': reportTitle, ':rat': at }
      );
    } else {
      const res = await db().send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { requestId },
        UpdateExpression: 'SET reportHtml = :html, reportTitle = :title, reportUpdatedAt = :rat, updatedAt = :rat',
        ExpressionAttributeValues: { ':html': reportHtml, ':title': reportTitle, ':rat': at },
        ReturnValues: 'ALL_NEW',
      }));
      updated = res.Attributes;
    }
    return ok({ request: publicView(updated, { includeReport: true, includeToken: true }) });
  }

  async function adminSend(event, auth, requestId) {
    const body = parseBody(event);
    let item = await requireItem(requestId);

    // 전송 시 함께 보고서 내용을 넘긴 경우 저장
    if (typeof body.reportHtml === 'string' && body.reportHtml.trim()) {
      const at = nowIso();
      const res = await db().send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { requestId },
        UpdateExpression: 'SET reportHtml = :html, reportTitle = :title, reportUpdatedAt = :rat, updatedAt = :rat',
        ExpressionAttributeValues: {
          ':html': sanitizeReportHtml(body.reportHtml),
          ':title': cleanString(body.reportTitle, 200) || item.reportTitle || '분석 보고서',
          ':rat': at,
        },
        ReturnValues: 'ALL_NEW',
      }));
      item = res.Attributes;
    }

    if (!item.reportHtml || !item.reportHtml.trim()) throw new HttpError(400, '보고서 내용이 비어 있습니다. 먼저 보고서를 작성해 주세요.');

    // 토큰이 없는 과거 데이터 대비
    if (!item.viewToken) {
      const res = await db().send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { requestId },
        UpdateExpression: 'SET viewToken = :t',
        ExpressionAttributeValues: { ':t': crypto.randomBytes(24).toString('hex') },
        ReturnValues: 'ALL_NEW',
      }));
      item = res.Attributes;
    }

    const to = cleanString(body.email, 200) || item.email;
    const viewUrl = buildViewUrl(item);
    const emailResult = await notify.email({ to, name: item.name, reportTitle: item.reportTitle || '분석 보고서', viewUrl });

    const sentAt = nowIso();
    const updated = await appendStatus(
      item,
      STATUS.SENT,
      auth.email || auth.userId,
      {
        'sentAt = :sentAt': true,
        'emailSentAt = :emailSentAt': true,
        'emailError = :emailError': true,
        'emailTo = :emailTo': true,
      },
      {
        ':sentAt': sentAt,
        ':emailSentAt': emailResult.sent ? sentAt : null,
        ':emailError': emailResult.sent ? null : emailResult.error || 'unknown',
        ':emailTo': to,
      }
    );

    return ok({
      message: emailResult.sent ? '보고서를 전송하고 이메일 알림을 발송했습니다.' : '보고서 상태는 전송 완료로 변경되었지만 이메일 발송에 실패했습니다.',
      email: emailResult,
      viewUrl,
      request: publicView(updated, { includeReport: true, includeToken: true }),
    });
  }

  async function adminDelete(requestId) {
    await requireItem(requestId);
    await db().send(new DeleteCommand({ TableName: TABLE_NAME, Key: { requestId } }));
    return ok({ message: '삭제되었습니다.', requestId });
  }

  // ----- 라우터 -----

  return async function handler(event) {
    const method = getMethod(event);
    if (method === 'OPTIONS') return respond(200, '');

    const path = getSubPath(event);
    const segments = path.split('/').filter(Boolean);

    try {
      // 이메일 링크: 로그인 없이 토큰으로 조회
      if (method === 'GET' && segments.length === 2 && segments[1] === 'report' && segments[0] !== 'admin') {
        return await getReportByToken(event, segments[0]);
      }

      let auth;
      try {
        auth = await authenticate(event, authDeps);
      } catch (error) {
        console.warn('auth failed:', error.message);
        throw new HttpError(401, '로그인이 만료되었습니다. 다시 로그인해 주세요.');
      }
      if (!auth) throw new HttpError(401, '로그인이 필요합니다.');

      if (segments[0] === 'admin') {
        if (!auth.isAdmin) throw new HttpError(403, '관리자 권한이 필요합니다.');
        const [, second, third] = segments;

        if (segments.length === 1 && method === 'GET') return await adminList(event);
        if (second === 'export' && method === 'GET') return await adminExport(event);
        if (segments.length === 2 && method === 'GET') return await adminGet(second);
        if (segments.length === 2 && method === 'DELETE') return await adminDelete(second);
        if (third === 'status' && method === 'PUT') return await adminUpdateStatus(event, auth, second);
        if (third === 'report' && method === 'PUT') return await adminSaveReport(event, auth, second);
        if (third === 'send' && method === 'POST') return await adminSend(event, auth, second);
        throw new HttpError(404, `Not found: ${method} ${path}`);
      }

      if (segments.length === 0 && method === 'POST') return await submit(event, auth);
      if (segments[0] === 'draft' && segments.length === 1) {
        if (method === 'GET') return await getDraft(auth);
        if (method === 'PUT') return await saveDraft(event, auth);
        if (method === 'DELETE') return await deleteDraft(auth);
      }
      if (segments[0] === 'mine' && method === 'GET') return await listMine(auth);
      if (segments.length === 1 && method === 'GET') return await getMine(auth, segments[0]);

      throw new HttpError(404, `Not found: ${method} ${path}`);
    } catch (error) {
      if (error instanceof HttpError) {
        return respond(error.statusCode, { success: false, error: error.message, message: error.message, ...error.extra });
      }
      console.error('Unhandled error:', error);
      return respond(500, { success: false, error: '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    }
  };
}

exports.createHandler = createHandler;
exports.handler = createHandler();
exports.TABLE_NAME = TABLE_NAME;
