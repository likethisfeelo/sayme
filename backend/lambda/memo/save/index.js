/**
 * 메모 저장 Lambda
 *
 * 기능: 사용자 메모 생성
 * 메서드: POST /memo
 * 인증: Cognito Authorizer
 * 테이블: sayme-memos (PK: userId, SK: memoId)
 *
 * 제한:
 *   - 메모 최대 1000자
 *   - 하루 최대 30개
 *
 * 요청 Body:
 *   - content: 메모 내용 (필수)
 *
 * 응답: { success, memo: { memoId, content, createdAt } }
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-memos';
const MAX_CONTENT_LENGTH = 1000;
const MAX_MEMOS_PER_DAY = 30;

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
    // 인증 확인
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { content } = body;

    // 유효성 검사
    if (!content || typeof content !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Content is required' }),
      };
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: `Content exceeds ${MAX_CONTENT_LENGTH} characters`
        }),
      };
    }

    // 오늘 메모 개수 확인
    const today = new Date().toISOString().split('T')[0];
    const countQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'begins_with(createdAt, :today)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':today': today,
      },
      Select: 'COUNT',
    });

    const countResult = await docClient.send(countQuery);
    if (countResult.Count >= MAX_MEMOS_PER_DAY) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: `Maximum ${MAX_MEMOS_PER_DAY} memos per day`
        }),
      };
    }

    // 메모 저장
    const memoId = randomUUID();
    const now = new Date().toISOString();

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        memoId,
        content,
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
        memo: { memoId, content, createdAt: now },
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
