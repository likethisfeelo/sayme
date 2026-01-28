// C:\sayme\dev\backend\lambda\quest-user\getContentDetail\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

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

    // 할당 정보 조회
    const assignmentCommand = new GetCommand({
      TableName: 'Quest_UserAssignment',
      Key: {
        userId,
        contentId: assignmentId
      }
    });

    const assignmentResult = await docClient.send(assignmentCommand);

    if (!assignmentResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'Content not found or not assigned to you' })
      };
    }

    const assignment = assignmentResult.Item;

    // 원본 콘텐츠 조회
    const contentCommand = new GetCommand({
      TableName: 'Quest_ContentLibrary',
      Key: {
        contentId: assignment.sourceContentId
      }
    });

    const contentResult = await docClient.send(contentCommand);

    if (!contentResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'Source content not found' })
      };
    }

    let finalContent = { ...contentResult.Item };

    // 커스터마이징 적용
    if (assignment.isCustomized && assignment.customizations) {
      if (assignment.customizations.title) {
        finalContent.title = assignment.customizations.title;
      }
      if (assignment.customizations.description) {
        finalContent.description = assignment.customizations.description;
      }
      if (assignment.customizations.contentItems) {
        finalContent.contentItems = finalContent.contentItems.map((item, idx) => {
          const customItem = assignment.customizations.contentItems.find(
            c => c.itemIndex === idx
          );
          return customItem ? { ...item, ...customItem } : item;
        });
      }
    }

    // 사용자 응답 조회
    const responseCommand = new GetCommand({
      TableName: 'Quest_UserResponse',
      Key: {
        userId,
        contentId: assignmentId
      }
    });

    const responseResult = await docClient.send(responseCommand);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        assignment: {
          assignmentId: assignment.contentId,
          sourceContentId: assignment.sourceContentId,
          isCustomized: assignment.isCustomized,
          orderIndex: assignment.orderIndex
        },
        content: finalContent,
        userResponse: responseResult.Item || null
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
        error: 'Failed to get content detail',
        details: error.message
      })
    };
  }
};