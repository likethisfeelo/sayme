// C:\sayme\dev\backend\lambda\quest-admin\unassignContent\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const body = JSON.parse(event.body);
    const { userId, contentId } = body;

    if (!userId || !contentId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'userId and contentId are required' })
      };
    }

    const command = new DeleteCommand({
      TableName: 'Quest_UserAssignment',
      Key: { userId, contentId }
    });

    await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Content unassigned successfully',
        userId,
        contentId
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
        error: 'Failed to unassign content',
        details: error.message
      })
    };
  }
};