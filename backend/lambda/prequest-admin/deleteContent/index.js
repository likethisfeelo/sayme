/**
 * File: backend/lambda/prequest-admin/deleteContent/index.js
 * Description: Admin - 사전질문 콘텐츠 삭제
 * Runtime: Node.js 18.x
 * Table: Prequest_ContentLibrary
 */


const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
 
const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);
 
exports.handler = async (event) => {
  try {
    const contentId = event.pathParameters?.contentId;
 
    if (!contentId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        body: JSON.stringify({ error: 'contentId is required' })
      };
    }
 
    await docClient.send(new DeleteCommand({
      TableName: 'Prequest_ContentLibrary',
      Key: { contentId }
    }));
 
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
      },
      body: JSON.stringify({ message: 'Deleted successfully', contentId })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      body: JSON.stringify({ error: 'Failed to delete', details: error.message })
    };
  }
};