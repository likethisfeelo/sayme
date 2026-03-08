// C:\sayme\dev\backend\lambda\quest-user\getMyResponse\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const assignmentId = event.pathParameters?.assignmentId;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    if (!assignmentId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'assignmentId is required' })
      };
    }

    const command = new GetCommand({
      TableName: 'Quest_UserResponse',
      Key: {
        userId,
        contentId: assignmentId
      }
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      // 과거/예외 데이터 호환: userId 파티션 전체에서 assignment/source 키로 fallback 매칭
      const [assignmentResult, userResponsesResult] = await Promise.all([
        docClient.send(new GetCommand({
          TableName: 'Quest_UserAssignment',
          Key: { userId, contentId: assignmentId }
        })),
        docClient.send(new QueryCommand({
          TableName: 'Quest_UserResponse',
          ConsistentRead: true,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId }
        }))
      ]);

      const sourceContentId = assignmentResult.Item?.sourceContentId;
      const fallback = (userResponsesResult.Items || []).find((item) => {
        const keys = [item.contentId, item.assignmentId, item.sourceContentId].filter(Boolean);
        return keys.includes(assignmentId) || (sourceContentId && keys.includes(sourceContentId));
      });

      if (fallback) {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS'
          },
          body: JSON.stringify({
            response: fallback
          })
        };
      }

      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ 
          error: 'Response not found',
          message: 'You have not started this content yet'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        response: result.Item
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({
        error: 'Failed to get response',
        details: error.message
      })
    };
  }
};
