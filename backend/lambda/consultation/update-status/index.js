/**
 * 상담 요청 상태 변경 Lambda (관리자 전용)
 *
 * 기능: 상담 요청의 상태를 변경 (pending → confirmed → completed | cancelled)
 * 메서드: PUT /consultation/admin/{requestId}/status
 * 인증: Cognito Authorizer (Admins 그룹 필수)
 * 테이블: sayme-consultation-requests
 *
 * 요청 Body:
 *   - status: confirmed | completed | cancelled (필수)
 *
 * 응답: 변경된 상담 요청 정보
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-consultation-requests';

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
      : groups === 'Admins';

    if (!isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, message: 'Admin access required' }),
      };
    }

    const requestId = event.pathParameters?.requestId;
    if (!requestId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'requestId is required' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
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

    const currentStatus = current.Item.status;
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

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { requestId },
        UpdateExpression: 'SET #status = :status, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': newStatus,
          ':now': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `상태가 '${newStatus}'(으)로 변경되었습니다`,
        request: result.Attributes,
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
