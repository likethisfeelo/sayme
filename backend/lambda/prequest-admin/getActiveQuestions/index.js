/**
 * File: backend/lambda/prequest-admin/getActiveQuestions/index.js
 * Description: Admin - 현재 활성 사전질문 설정 조회
 * Runtime: Node.js 18.x
 * Table: Prequest_ActiveConfig
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
 
const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);
 
exports.handler = async (event) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: 'Prequest_ActiveConfig',
      Key: { configId: 'active_prequest' }
    }));
 
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        config: result.Item || null
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      body: JSON.stringify({ error: 'Failed to get active questions', details: error.message })
    };
  }
};