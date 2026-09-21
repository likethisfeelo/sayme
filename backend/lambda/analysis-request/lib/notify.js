/**
 * 알림 유틸
 *  - Slack Incoming Webhook : 신규 입력 접수 알림
 *  - AWS SES               : 보고서 전송 이메일 알림
 *
 * 두 기능 모두 실패해도 본 요청을 실패시키지 않는다 (결과만 반환).
 */
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

let sesClient = null;
function getSesClient() {
  if (!sesClient) {
    sesClient = new SESClient({ region: process.env.SES_REGION || process.env.AWS_REGION || 'ap-northeast-2' });
  }
  return sesClient;
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const truncate = (text, max = 300) => {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max)}…` : s;
};

/**
 * 워크시트 형태({title, subLabels, items:[{text, subs}]}) 판별
 */
const isWorksheet = (v) => v && typeof v === 'object' && Array.isArray(v.items) && typeof v.title === 'string';

/**
 * 답변 객체를 Slack 표시용 텍스트로 변환
 * - 만다라트 워크시트는 "제목: 1. a / 2. b ..." 형태로 요약
 * - 그 외 값은 key: value 나열
 */
function formatAnswersForSlack(answers = {}) {
  const lines = [];
  for (const [k, v] of Object.entries(answers)) {
    if (v === undefined || v === null || v === '') continue;
    if (isWorksheet(v)) {
      const items = v.items.map((it, i) => `${i + 1}. ${truncate((it && it.text) || '-', 40)}`).join('  ');
      lines.push(`• *${v.title}*\n  ${items}`);
    } else if (Array.isArray(v)) {
      lines.push(`• *${k}*: ${truncate(v.join(', '), 200)}`);
    } else if (typeof v === 'object') {
      lines.push(`• *${k}*: ${truncate(JSON.stringify(v), 200)}`);
    } else {
      lines.push(`• *${k}*: ${truncate(v, 200)}`);
    }
  }
  return lines.join('\n');
}

/**
 * 신규 입력 접수 Slack 알림
 * @returns {Promise<{sent: boolean, error?: string}>}
 */
async function notifySlackNewSubmission(item, deps = {}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return { sent: false, error: 'SLACK_WEBHOOK_URL not configured' };
  }

  const doFetch = deps.fetch || globalThis.fetch;
  const adminBase = process.env.ADMIN_BASE_URL || process.env.APP_BASE_URL || '';
  const adminLink = adminBase ? `${adminBase.replace(/\/$/, '')}/admin/mandalart/detail/?id=${encodeURIComponent(item.requestId)}` : '';

  const headline = `📝 새 분석 리포트 신청이 접수되었습니다`;
  const summaryLines = [
    `*이름*: ${item.name || '-'}`,
    `*이메일*: ${item.email || '-'}`,
    `*연락처*: ${item.phone || '-'}`,
    `*접수시각*: ${item.createdAt}`,
    `*요청 ID*: ${item.requestId}`,
  ];

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: '새 분석 리포트 신청', emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', text: summaryLines.join('\n') } },
  ];

  const answerText = formatAnswersForSlack(item.answers);
  if (answerText) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: truncate(answerText, 2800) } });
  }
  if (adminLink) {
    blocks.push({
      type: 'actions',
      elements: [
        { type: 'button', text: { type: 'plain_text', text: '어드민에서 확인', emoji: true }, url: adminLink, style: 'primary' },
      ],
    });
  }

  const payload = {
    text: `${headline} — ${item.name || item.email || item.requestId}`,
    blocks,
  };

  try {
    const res = await doFetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { sent: false, error: `Slack webhook ${res.status}: ${body}` };
    }
    return { sent: true };
  } catch (error) {
    console.error('Slack notify failed:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * 보고서 전송 이메일 본문 생성
 */
function buildReportEmail({ name, reportTitle, viewUrl, serviceName }) {
  const brand = serviceName || process.env.SERVICE_NAME || 'Sayme';
  const safeName = escapeHtml(name || '');
  const safeTitle = escapeHtml(reportTitle || '분석 보고서');
  const subject = `[${brand}] ${safeName ? `${name}님의 ` : ''}${reportTitle || '분석 보고서'}가 도착했습니다`;

  const text = [
    `${name ? `${name}님, ` : ''}안녕하세요. ${brand}입니다.`,
    '',
    `요청하신 "${reportTitle || '분석 보고서'}" 작성이 완료되어 전달드립니다.`,
    '아래 링크에서 보고서를 확인하실 수 있습니다.',
    '',
    viewUrl,
    '',
    '감사합니다.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="ko">
<body style="margin:0;padding:0;background:#F5F1ED;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Pretendard','Noto Sans KR',sans-serif;color:#2A2725;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F1ED;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #E6E0DA;border-radius:18px;overflow:hidden;">
        <tr><td style="padding:28px 28px 8px;">
          <div style="font-size:13px;font-weight:700;color:#BFA7FF;letter-spacing:.2px;">${escapeHtml(brand)}</div>
          <h1 style="margin:12px 0 0;font-size:20px;line-height:1.4;">${safeTitle}가 도착했습니다</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 20px;font-size:15px;line-height:1.7;color:#3A3A3A;">
          ${safeName ? `<p style="margin:0 0 12px;"><strong>${safeName}</strong>님, 안녕하세요.</p>` : ''}
          <p style="margin:0 0 12px;">요청하신 보고서 작성이 완료되어 전달드립니다.<br/>아래 버튼을 눌러 보고서를 확인해 주세요.</p>
        </td></tr>
        <tr><td align="center" style="padding:0 28px 28px;">
          <a href="${escapeHtml(viewUrl)}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(90deg,#BFA7FF,#7BCBFF);color:#1f1f1f;font-weight:700;font-size:15px;text-decoration:none;">보고서 보기</a>
          <p style="margin:16px 0 0;font-size:12px;color:#6B6662;word-break:break-all;">버튼이 열리지 않으면 아래 주소를 브라우저에 붙여넣어 주세요.<br/><a href="${escapeHtml(viewUrl)}" style="color:#6B6662;">${escapeHtml(viewUrl)}</a></p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#F9F6F3;font-size:11px;color:#8B8580;line-height:1.6;">
          본 메일은 ${escapeHtml(brand)} 분석 리포트 신청 결과 안내 메일입니다.<br/>본인이 신청하지 않았다면 이 메일을 무시해 주세요.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

/**
 * 보고서 전송 이메일 발송 (SES)
 * @returns {Promise<{sent: boolean, messageId?: string, error?: string}>}
 */
async function sendReportEmail({ to, name, reportTitle, viewUrl }, deps = {}) {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) return { sent: false, error: 'SES_FROM_EMAIL not configured' };
  if (!to) return { sent: false, error: 'recipient email missing' };

  const { subject, text, html } = buildReportEmail({ name, reportTitle, viewUrl });
  const sendEmail = deps.sendEmail || ((params) => getSesClient().send(new SendEmailCommand(params)));

  const params = {
    Source: from,
    Destination: { ToAddresses: [to] },
    ...(process.env.SES_REPLY_TO ? { ReplyToAddresses: [process.env.SES_REPLY_TO] } : {}),
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Text: { Data: text, Charset: 'UTF-8' },
        Html: { Data: html, Charset: 'UTF-8' },
      },
    },
  };

  try {
    const result = await sendEmail(params);
    return { sent: true, messageId: result?.MessageId };
  } catch (error) {
    console.error('SES send failed:', error);
    return { sent: false, error: error.message };
  }
}

module.exports = { notifySlackNewSubmission, sendReportEmail, buildReportEmail, escapeHtml };
