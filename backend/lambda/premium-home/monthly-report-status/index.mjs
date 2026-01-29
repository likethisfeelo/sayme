// premium-home-monthly-report-status/index.mjs
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

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
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      };
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // DynamoDB에서 리포트 상태 조회
    const command = new GetCommand({
      TableName: 'sayme-monthly-reports',
      Key: {
        userId: userId,
        month: currentMonth,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          report: {
            available: false,
            month: currentMonth,
          },
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        report: {
          available: response.Item.status === 'uploaded',
          month: currentMonth,
          url: response.Item.reportUrl || '',
          uploadedAt: response.Item.uploadedAt || '',
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