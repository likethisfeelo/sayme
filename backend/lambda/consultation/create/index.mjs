// consultation-create/index.mjs
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-consultation-requests';

export const handler = async (event) => {
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
    const userId = event.requestContext?.authorizer?.claims?.sub;
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
      isPaidOk,
      memo
    } = body;

    // Validation
    if (!preferredDate1 || !preferredTime1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'At least one preferred date and time is required'
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
        preferredDate2: preferredDate2 || null,
        preferredTime2: preferredTime2 || null,
        isPaidOk: Boolean(isPaidOk),
        memo: memo || '',
        status: 'pending', // pending, confirmed, completed, cancelled
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
