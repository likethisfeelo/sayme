// C:\sayme\dev\backend\lambda\quest-admin\assignContent\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const body = JSON.parse(event.body);
    const {
      userId,
      sourceContentId,
      orderIndex,
      customizations,
      isCustomized = false
    } = body;

    if (!userId || !sourceContentId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'userId and sourceContentId are required' })
      };
    }

    // 원본 콘텐츠 확인
    const sourceContent = await docClient.send(new GetCommand({
      TableName: 'Quest_ContentLibrary',
      Key: { contentId: sourceContentId }
    }));

    if (!sourceContent.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'Source content not found' })
      };
    }

    // 할당 contentId 생성
    const assignedContentId = `assigned_${userId}_${Date.now()}`;

    const assignment = {
      userId,
      contentId: assignedContentId,
      sourceContentId,
      isCustomized,
      customizations: customizations || {},
      orderIndex: orderIndex || 999,
      status: 'active',
      assignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: 'Quest_UserAssignment',
      Item: assignment
    });

    await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Content assigned successfully',
        assignment
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
        error: 'Failed to assign content',
        details: error.message
      })
    };
  }
};