// C:\sayme\dev\backend\lambda\quest-admin\createContent\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const body = JSON.parse(event.body);
    const {
      title,
      description,
      contentItems,
      metadata,
      feedbackOptions,
      isPublic = true,
      type = 'template'
    } = body;

    // contentId 생성
    const contentId = type === 'template' 
      ? `template_${Date.now()}` 
      : `draft_${Date.now()}`;

    const item = {
      contentId,
      type,
      title,
      description,
      contentItems: contentItems || [],
      metadata: metadata || {
        estimatedTime: '10분',
        difficulty: 'medium',
        tags: []
      },
      feedbackOptions: feedbackOptions || {
        enableReaction: true,
        enableComment: true,
        enableSatisfaction: true
      },
      usage: {
        userCount: 0,
        avgSatisfaction: 0
      },
      isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: 'Quest_ContentLibrary',
      Item: item
    });

    await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',  // ✅ 추가
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Content created successfully',
        contentId: item.contentId,
        content: item
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',  // ✅ 추가
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({
        error: 'Failed to create content',
        details: error.message
      })
    };
  }
};