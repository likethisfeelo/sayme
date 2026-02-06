/**
 * 상담 요청 목록 조회 Lambda (사용자용)
 *
 * 기능: 로그인한 사용자의 상담 요청 내역 조회
 * 메서드: GET /consultation
 * 인증: Cognito Authorizer (일반 사용자)
 * 테이블: sayme-consultation-requests
 * GSI: userId-createdAt-index
 *
 * 응답: 사용자의 상담 요청 목록 (최신순)
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-consultation-requests';

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
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      };
    }

    // Query using GSI on userId
    const query = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Most recent first
      Limit: 50,
    });

    const result = await docClient.send(query);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        requests: result.Items || [],
        count: result.Count || 0,
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
