/**
 * 메모 삭제 Lambda
 *
 * 기능: 사용자 메모 삭제
 * 메서드: DELETE /memo/{memoId}
 * 인증: Cognito Authorizer
 * 테이블: sayme-memos (PK: userId, SK: memoId)
 *
 * Path 파라미터:
 *   - memoId: 삭제할 메모 ID (필수)
 *
 * 응답: { success, message }
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-memos';

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    // memoId 확인
    const memoId = event.pathParameters?.memoId;
    if (!memoId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'memoId is required' }),
      };
    }

    // 메모 삭제
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        memoId,
      },
    });

    await docClient.send(deleteCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Memo deleted' }),
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
