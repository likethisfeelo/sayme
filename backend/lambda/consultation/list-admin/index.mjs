// consultation-list-admin/index.mjs (Admin: All requests)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-consultation-requests';

export const handler = async (event) => {
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
    const groups = event.requestContext?.authorizer?.claims?.['cognito:groups'];
    const isAdmin = groups?.includes('Admins') || groups === 'Admins';

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
      Limit: 100,
    };

    if (status) {
      scanParams.FilterExpression = '#status = :status';
      scanParams.ExpressionAttributeNames = { '#status': 'status' };
      scanParams.ExpressionAttributeValues = { ':status': status };
    }

    const scan = new ScanCommand(scanParams);
    const result = await docClient.send(scan);

    // Sort by createdAt descending
    const sorted = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        requests: sorted,
        count: sorted.length,
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
