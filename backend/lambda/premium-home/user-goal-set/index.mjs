// premium-home-user-goal-set/index.mjs
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

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
    // Admin 권한 확인
    const groups = event.requestContext?.authorizer?.claims['cognito:groups'];
    const isAdmin = groups && groups.includes('Admins');
    
    if (!isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Admin access required',
        }),
      };
    }

    // 요청 본문 파싱
    const body = JSON.parse(event.body || '{}');
    const { userId, month, keyword, direction, sentence3 } = body;

    if (!userId || !month || !keyword || !direction) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: userId, month, keyword, direction',
        }),
      };
    }

    // DynamoDB에 저장
    const command = new PutCommand({
      TableName: 'sayme-user-goals',
      Item: {
        userId: userId,
        month: month,
        keyword: keyword,
        direction: direction,
        sentence3: sentence3 || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User goal saved successfully',
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