/**
 * File: backend/lambda/prequest-admin/getContent/index.js
 * Description: Admin - 사전질문 콘텐츠 단일 조회
 * Runtime: Node.js 18.x
 * Table: Prequest_ContentLibrary
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
 
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
 
    const result = await docClient.send(new GetCommand({
      TableName: 'Prequest_ContentLibrary',
      Key: { contentId }
    }));
 
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        body: JSON.stringify({ error: 'Content not found' })
      };
    }
 
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ content: result.Item })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      body: JSON.stringify({ error: 'Failed to get content', details: error.message })
    };
  }
};