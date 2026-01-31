/**
 * File: backend/lambda/prequest-admin/createContent/index.js
 * Description: Admin - 콘텐츠 생성 Lambda
 * Runtime: Node.js 18.x
 */
 
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
 
const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);
 
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
 
  try {
    const body = JSON.parse(event.body);
    const { title, description, contentItems, metadata } = body;
 
    const contentId = `prequest_${Date.now()}`;
 
    const item = {
      contentId,
      title,
      description,
      contentItems: contentItems || [],
      metadata: metadata || {
        estimatedTime: '5분',
        tags: []
      },
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
 
    await docClient.send(new PutCommand({
      TableName: 'Prequest_ContentLibrary',
      Item: item
    }));
 
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Prequest content created successfully',
        contentId: item.contentId,
        content: item
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({
        error: 'Failed to create prequest content',
        details: error.message
      })
    };
  }
};
 