/**
 * 상담 요청 상태 변경 Lambda (관리자 전용)
 *
 * 기능: 상담 요청의 상태를 변경 (pending → confirmed → completed | cancelled)
 * 메서드: PUT /consultation/admin/{requestId}/status
 * 인증: Cognito Authorizer (Admins 그룹 필수)
 * 테이블: sayme-consultation-requests, sayme-user-tickets
 *
 * 요청 Body:
 *   - status: confirmed | completed | cancelled (필수)
 *
 * 티켓 소진 로직:
 *   - pending → confirmed 전환 시, ticketType이 'urgent'가 아닌 경우 티켓 1장 차감
 *   - 티켓 잔여가 부족하면 확정 거부
 *   - 이미 ticketConsumed가 true면 중복 차감하지 않음
 *
 * 응답: 변경된 상담 요청 정보
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'sayme-consultation-requests';
const TICKETS_TABLE = process.env.TICKETS_TABLE || 'sayme-user-tickets';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['pending'],
};

function extractTokenPayload(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (claims?.sub) return claims;

  const authHeader =
    event.headers?.Authorization ||
    event.headers?.authorization ||
    '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      return JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
      );
    } catch (e) {
      console.error('Failed to parse JWT:', e.message);
    }
  }
  return null;
}

/**
 * 티켓 1장 차감
 * - 잔여 확인 후 count - 1로 업데이트
 * - 만료된 티켓이면 차감 불가
 * @returns {{ success: boolean, message?: string }}
 */
async function consumeTicket(userId, ticketType) {
  const ticket = await docClient.send(
    new GetCommand({
      TableName: TICKETS_TABLE,
      Key: { userId, ticketType },
    })
  );

  if (!ticket.Item) {
    return { success: false, message: `보유한 '${ticketType}' 티켓이 없습니다` };
  }

  // 만료 확인
  if (ticket.Item.expiresAt && new Date(ticket.Item.expiresAt) < new Date()) {
    return { success: false, message: `'${ticketType}' 티켓이 만료되었습니다` };
  }

  if (ticket.Item.count < 1) {
    return { success: false, message: `'${ticketType}' 티켓 잔여가 없습니다 (현재 0장)` };
  }

  // count - 1 차감 (조건부: count >= 1일 때만)
  await docClient.send(
    new UpdateCommand({
      TableName: TICKETS_TABLE,
      Key: { userId, ticketType },
      UpdateExpression: 'SET #count = #count - :one, updatedAt = :now',
      ConditionExpression: '#count >= :one',
      ExpressionAttributeNames: { '#count': 'count' },
      ExpressionAttributeValues: {
        ':one': 1,
        ':now': new Date().toISOString(),
      },
    })
  );

  return { success: true };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Admin check
    const tokenPayload = extractTokenPayload(event);
    const groups = tokenPayload?.['cognito:groups'];
    const isAdmin = Array.isArray(groups)
      ? groups.includes('Admins')
      : typeof groups === 'string' && groups.includes('Admins');

    if (!isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, message: 'Admin access required' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const requestId = event.pathParameters?.requestId || body.requestId;
    if (!requestId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'requestId is required' }),
      };
    }

    const { status: newStatus } = body;

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: `유효하지 않은 상태입니다. 가능한 값: ${VALID_STATUSES.join(', ')}`,
        }),
      };
    }

    // 현재 상태 조회
    const current = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { requestId } })
    );

    if (!current.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: '상담 요청을 찾을 수 없습니다' }),
      };
    }

    const consultation = current.Item;
    const currentStatus = consultation.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: `'${currentStatus}' → '${newStatus}' 전환은 허용되지 않습니다. 가능한 전환: ${allowed.join(', ') || '없음'}`,
        }),
      };
    }

    const now = new Date().toISOString();
    let ticketConsumed = consultation.ticketConsumed || false;

    // 확정(confirmed) 전환 시 티켓 소진 처리
    // - urgent(긴급신청)는 티켓 소진 제외
    // - 이미 소진된 경우 중복 차감하지 않음
    if (newStatus === 'confirmed' && consultation.ticketType !== 'urgent' && !ticketConsumed) {
      const consumeResult = await consumeTicket(consultation.userId, consultation.ticketType);

      if (!consumeResult.success) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: `티켓 소진 실패: ${consumeResult.message}`,
          }),
        };
      }

      ticketConsumed = true;
    }

    // 상태 + ticketConsumed 업데이트
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { requestId },
        UpdateExpression: 'SET #status = :status, updatedAt = :now, ticketConsumed = :consumed',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': newStatus,
          ':now': now,
          ':consumed': ticketConsumed,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    const messages = [`상태가 '${newStatus}'(으)로 변경되었습니다`];
    if (newStatus === 'confirmed' && ticketConsumed && !consultation.ticketConsumed) {
      messages.push(`'${consultation.ticketType}' 티켓 1장이 소진되었습니다`);
    }
    if (newStatus === 'confirmed' && consultation.ticketType === 'urgent') {
      messages.push('긴급 신청이므로 티켓 소진 없이 확정되었습니다');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: messages.join('. '),
        request: result.Attributes,
      }),
    };

  } catch (error) {
    console.error('Error:', error);

    // ConditionExpression 실패 (동시 차감 방지)
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: '티켓 소진에 실패했습니다. 잔여 티켓을 확인해주세요.',
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Internal server error' }),
    };
  }
};