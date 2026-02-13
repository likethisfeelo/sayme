/**
 * 프리미엄 등록 신청 목록 조회 Lambda (관리자 전용)
 * 메서드: GET /premium-registration/admin
 * 테이블: sayme-users
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'sayme-users';

function extractTokenPayload(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (claims?.sub) return claims;

  const authHeader = event.headers?.Authorization || event.headers?.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) return null;

  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  } catch (error) {
    console.error('JWT parse failed:', error.message);
    return null;
  }
}

async function scanAll(params) {
  let items = [];
  let lastKey;

  do {
    const result = await docClient.send(new ScanCommand({
      ...params,
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    }));

    items = items.concat(result.Items || []);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
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

    const users = await scanAll({
      TableName: USERS_TABLE,
      FilterExpression: 'consultationStatus = :status',
      ExpressionAttributeValues: {
        ':status': 'requested',
      },
    });

    const requests = users
      .map((item) => ({
        userId: item.userId,
        email: item.email || '',
        name: item.name || item.nickname || '',
        nickname: item.nickname || '',
        phoneNumber: item.phoneNumber || '',
        gender: item.gender || '',
        birthDate: item.birthDate || '',
        birthTime: item.birthTime || null,
        birthTimeCertainty: item.birthTimeCertainty || '',
        birthCity: item.birthCity || '',
        marketingConsent: !!item.marketingConsent,
        consultationStatus: item.consultationStatus,
        premiumRequestedAt: item.premiumRequestedAt || item.updatedAt || item.createdAt,
        premiumRequestSource: item.premiumRequestSource || 'unknown',
      }))
      .sort((a, b) => new Date(b.premiumRequestedAt || 0) - new Date(a.premiumRequestedAt || 0));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, requests, count: requests.length }),
    };
  } catch (error) {
    console.error('premium-registration admin list error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Internal server error' }),
    };
  }
};
