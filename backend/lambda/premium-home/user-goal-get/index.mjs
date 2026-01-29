// premium-home-user-goal-get/index.mjs
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  // CORS Headers
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Authorization 헤더에서 userId 추출
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing',
        }),
      };
    }

    // JWT 토큰에서 userId 추출 (Cognito)
    // 실제로는 JWT 검증 필요 - 여기서는 간단히 구현
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid token',
        }),
      };
    }

    // 현재 월 계산
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // DynamoDB에서 사용자 목표 조회
    const command = new GetCommand({
      TableName: 'sayme-user-goals',
      Key: {
        userId: userId,
        month: currentMonth,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      // 기본값 반환
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          goal: {
            keyword: '명료함',
            direction: '흐트러진 생각을 정리하는',
            sentence3: '차분하게 선택하는',
          },
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        goal: {
          keyword: response.Item.keyword,
          direction: response.Item.direction,
          sentence3: response.Item.sentence3 || '',
        },
      }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
};