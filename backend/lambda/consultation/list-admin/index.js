/**
 * 상담 요청 전체 목록 조회 Lambda (관리자 전용)
 *
 * 기능: 모든 사용자의 상담 요청 내역 조회
 * 메서드: GET /consultation/admin
 * 인증: Cognito Authorizer (Admins 그룹 필수)
 * 테이블: sayme-consultation-requests
 *
 * 쿼리 파라미터:
 *   - status: pending | confirmed | completed | cancelled (선택, 필터링용)
 *
 * 응답: 전체 상담 요청 목록 (최신순, 최대 100건)
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

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