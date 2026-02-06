/**
 * 메모 목록 조회 Lambda
 *
 * 기능: 사용자 메모 목록 조회
 * 메서드: GET /memo
 * 인증: Cognito Authorizer
 * 테이블: sayme-memos (PK: userId, SK: memoId)
 *
 * 쿼리 파라미터:
 *   - date: YYYY-MM-DD (선택, 특정 날짜 필터링)
 *
 * 응답: { success, memos: [...], count }
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-memos';

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
    // 인증 확인
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      };
    }

    // 날짜 필터 (선택)
    const date = event.queryStringParameters?.date;

    let queryParams = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // 최신순 정렬
      Limit: 100,
    };

    // 날짜 필터 적용
    if (date) {
      queryParams.FilterExpression = 'begins_with(createdAt, :date)';
      queryParams.ExpressionAttributeValues[':date'] = date;
    }

    const query = new QueryCommand(queryParams);
    const result = await docClient.send(query);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        memos: result.Items || [],
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