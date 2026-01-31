/**
 * File: backend/lambda/prequest-admin/updateContent/index.js
 * Description: Admin - 사전질문 콘텐츠 수정
 * Runtime: Node.js 18.x
 * Table: Prequest_ContentLibrary
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
 
const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);
 
exports.handler = async (event) => {
  try {
    const contentId = event.pathParameters?.contentId;
    const body = JSON.parse(event.body);
 
    const existing = await docClient.send(new GetCommand({
      TableName: 'Prequest_ContentLibrary',
      Key: { contentId }
    }));
 
    if (!existing.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        body: JSON.stringify({ error: 'Content not found' })
      };
    }
 
    const updated = {
      ...existing.Item,
      title: body.title ?? existing.Item.title,
      description: body.description ?? existing.Item.description,
      contentItems: body.contentItems ?? existing.Item.contentItems,
      metadata: body.metadata ?? existing.Item.metadata,
      updatedAt: new Date().toISOString()
    };
 
    await docClient.send(new PutCommand({
      TableName: 'Prequest_ContentLibrary',
      Item: updated
    }));
 
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS'
      },
      body: JSON.stringify({ message: 'Updated successfully', content: updated })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      body: JSON.stringify({ error: 'Failed to update', details: error.message })
    };
  }
};