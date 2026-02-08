/**
 * 상담 요청 생성 Lambda
 *
 * 기능: 사용자가 1:1 상담을 요청
 * 메서드: POST /consultation
 * 인증: Cognito Authorizer 또는 Authorization 헤더에서 JWT 파싱
 * 테이블: sayme-consultation-requests
 *
 * 요청 Body:
 *   - preferredDate1: 1순위 희망 날짜 (필수)
 *   - preferredTime1: 1순위 희망 시간 (필수)
 *   - preferredDate2: 2순위 희망 날짜 (필수)
 *   - preferredTime2: 2순위 희망 시간 (필수)
 *   - ticketType: 사용 티켓 종류 (필수, 'urgent'=긴급신청)
 *   - isUrgent: 긴급 신청 여부
 *   - urgentPaidOk: 긴급 신청 시 유료 동의 여부 (true/false/null)
 *   - isPaidOk: 유료 상담 동의 여부
 *   - memo: 추가 메모
 *
 * 상태: pending → confirmed → completed | cancelled
 * 참고: 티켓 실소진은 관리자가 상담 확정 시 처리
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-consultation-requests';

/**
 * Authorization 헤더 또는 Cognito authorizer에서 userId(sub) 추출
 */
function extractUserId(event) {
  // 1) Cognito authorizer claims (proxy integration)
  const sub = event.requestContext?.authorizer?.claims?.sub;
  if (sub) return sub;

  // 2) Authorization 헤더에서 JWT 직접 파싱 (non-proxy 또는 authorizer 미설정 시)
  const authHeader =
    event.headers?.Authorization ||
    event.headers?.authorization ||
    '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
      );
      if (payload.sub) return payload.sub;
    } catch (e) {
      console.error('Failed to parse JWT:', e.message);
    }
  }

  return null;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userId = extractUserId(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const {
      preferredDate1,
      preferredTime1,
      preferredDate2,
      preferredTime2,
      ticketType,
      isUrgent,
      urgentPaidOk,
      isPaidOk,
      memo
    } = body;

    // Validation
    if (!preferredDate1 || !preferredTime1 || !preferredDate2 || !preferredTime2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: '희망 날짜와 시간 2개를 모두 입력해주세요'
        }),
      };
    }

    if (!ticketType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: '사용할 티켓을 선택해주세요'
        }),
      };
    }

    const requestId = randomUUID();
    const now = new Date().toISOString();

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        requestId,
        userId,
        preferredDate1,
        preferredTime1,
        preferredDate2,
        preferredTime2,
        ticketType: ticketType || null,
        isUrgent: Boolean(isUrgent),
        urgentPaidOk: isUrgent ? Boolean(urgentPaidOk) : null,
        isPaidOk: Boolean(isPaidOk),
        memo: memo || '',
        ticketConsumed: false,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      },
    });

    await docClient.send(putCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '상담 요청이 접수되었습니다',
        request: {
          requestId,
          preferredDate1,
          preferredTime1,
          preferredDate2,
          preferredTime2,
          ticketType,
          isUrgent: Boolean(isUrgent),
          urgentPaidOk: isUrgent ? Boolean(urgentPaidOk) : null,
          isPaidOk: Boolean(isPaidOk),
          status: 'pending',
          createdAt: now,
        },
      }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Internal server error' }),
    };
  }
};