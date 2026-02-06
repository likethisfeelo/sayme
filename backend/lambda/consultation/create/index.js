/**
 * 상담 요청 생성 Lambda
 *
 * 기능: 사용자가 1:1 상담을 요청
 * 메서드: POST /consultation
 * 인증: Cognito Authorizer (일반 사용자)
 * 테이블: sayme-consultation-requests
 *
 * 요청 Body:
 *   - preferredDate1: 1순위 희망 날짜 (필수)
 *   - preferredTime1: 1순위 희망 시간 (필수)
 *   - preferredDate2: 2순위 희망 날짜 (선택)
 *   - preferredTime2: 2순위 희망 시간 (선택)
 *   - isPaidOk: 유료 상담 동의 여부
 *   - memo: 추가 메모
 *
 * 상태: pending → confirmed → completed | cancelled
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-consultation-requests';

exports.handler = async (event) => {
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