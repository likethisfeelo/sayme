// sayme-retrospective-2025-complete (JWT 인증 + 동적 CORS)
// 2025 회고 완료 처리 - 토큰에서 userId 추출

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-retrospective-2025';
const USERS_TABLE = 'sayme-users';

// Cognito JWT Verifier 설정
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'ap-northeast-2_egqvLgHX0',
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID || '4e5k8vs12cuudmka7m4mnjdkum'
});

// CORS 헤더 - 동적으로 Origin 처리
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'https://app.spirit-lab.me',
    'https://spirit-lab.me',
    'http://localhost:3000'
  ];

  const allowOrigin = allowedOrigins.includes(origin) ? origin : '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };
}

// JWT 토큰에서 userId 추출
async function getUserIdFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization 헤더가 없거나 형식이 잘못되었습니다.');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = await verifier.verify(token);
    console.log('✅ 토큰 검증 성공:', payload.sub);
    return payload.sub;
  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error);
    throw new Error('유효하지 않은 토큰입니다.');
  }
}

exports.handler = async (event) => {
  console.log('📥 Event:', JSON.stringify(event, null, 2));

  const origin = event.headers?.origin || event.headers?.Origin || '';
  const headers = getCorsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const userId = await getUserIdFromToken(authHeader);

    console.log('🔐 인증된 userId:', userId);

    const body = JSON.parse(event.body);
    const { sessionId, answers } = body;

    console.log('🎉 완료 처리:', { userId, sessionId });

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'sessionId는 필수입니다.'
        })
      };
    }

    const completedAt = new Date().toISOString();

    // retrospective-2025 테이블에 완료 상태 저장
    const retrospectiveParams = {
      TableName: TABLE_NAME,
      Item: {
        userId,
        sessionId,
        answers: answers || {},
        status: 'completed',
        completedAt,
        updatedAt: completedAt
      }
    };

    await dynamodb.send(new PutCommand(retrospectiveParams));
    console.log('✅ Retrospective 2025 완료 저장 성공');

    // Users 테이블에 완료 플래그 업데이트
    const userParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET retrospective2025Completed = :completed, retrospective2025CompletedAt = :completedAt',
      ExpressionAttributeValues: {
        ':completed': true,
        ':completedAt': completedAt
      }
    };

    await dynamodb.send(new UpdateCommand(userParams));
    console.log('✅ Users 테이블 업데이트 성공');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '2025년 회고를 완료했습니다! 🎉',
        data: { userId, sessionId, completedAt }
      })
    };

  } catch (error) {
    console.error('❌ 오류 발생:', error);

    if (error.message.includes('토큰') || error.message.includes('Authorization')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: '인증이 필요합니다.',
          error: error.message
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: '완료 처리 중 오류가 발생했습니다.',
        error: error.message
      })
    };
  }
};
