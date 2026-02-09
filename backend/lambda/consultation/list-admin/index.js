/**
 * 상담 요청 전체 목록 조회 Lambda (관리자 전용)
 *
 * 기능: 모든 사용자의 상담 요청 내역 조회 + 사용자 정보(이름/이메일) 포함
 * 메서드: GET /consultation/admin
 * 인증: Cognito Authorizer (Admins 그룹 필수)
 * 테이블: sayme-consultation-requests, sayme-users
 *
 * 쿼리 파라미터:
 *   - status: pending | confirmed | completed | cancelled (선택, 필터링용)
 *
 * 응답: 전체 상담 요청 목록 (최신순) + 사용자 정보
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-consultation-requests';
const USERS_TABLE = 'sayme-users';

/**
 * Authorization 헤더 또는 Cognito authorizer에서 JWT 파싱
 */
function extractTokenPayload(event) {
  // 1) Cognito authorizer claims
  const claims = event.requestContext?.authorizer?.claims;
  if (claims?.sub) return claims;

  // 2) Authorization 헤더에서 JWT 직접 파싱
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
 * 전체 Scan (페이지네이션 처리)
 */
async function scanAll(params) {
  let items = [];
  let lastKey = undefined;

  do {
    const scanParams = { ...params };
    if (lastKey) scanParams.ExclusiveStartKey = lastKey;

    const result = await docClient.send(new ScanCommand(scanParams));
    items = items.concat(result.Items || []);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

/**
 * userId 목록으로 사용자 정보 일괄 조회 (BatchGetItem, 25건씩)
 */
async function getUserInfoMap(userIds) {
  const unique = [...new Set(userIds)];
  const userMap = {};

  // BatchGetItem은 최대 100건이지만 25건씩 나눠서 안전하게 처리
  for (let i = 0; i < unique.length; i += 25) {
    const chunk = unique.slice(i, i + 25);
    const keys = chunk.map((id) => ({ userId: id }));

    try {
      const result = await docClient.send(
        new BatchGetCommand({
          RequestItems: {
            [USERS_TABLE]: { Keys: keys },
          },
        })
      );

      const users = result.Responses?.[USERS_TABLE] || [];
      for (const user of users) {
        userMap[user.userId] = {
          email: user.email || '',
          name: user.name || user.nickname || '',
          nickname: user.nickname || '',
        };
      }
    } catch (e) {
      console.error('Failed to batch get users:', e.message);
    }
  }

  return userMap;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check if user is admin
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

    // Optional status filter
    const status = event.queryStringParameters?.status;

    let scanParams = {
      TableName: TABLE_NAME,
    };

    if (status) {
      scanParams.FilterExpression = '#status = :status';
      scanParams.ExpressionAttributeNames = { '#status': 'status' };
      scanParams.ExpressionAttributeValues = { ':status': status };
    }

    // 전체 Scan (페이지네이션 처리)
    const items = await scanAll(scanParams);

    // Sort by createdAt descending
    const sorted = items.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // 사용자 정보 일괄 조회
    const userIds = sorted.map((r) => r.userId).filter(Boolean);
    const userMap = await getUserInfoMap(userIds);

    // 사용자 정보 병합
    const enriched = sorted.map((req) => ({
      ...req,
      userName: userMap[req.userId]?.name || '',
      userEmail: userMap[req.userId]?.email || '',
      userNickname: userMap[req.userId]?.nickname || '',
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        requests: enriched,
        count: enriched.length,
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
