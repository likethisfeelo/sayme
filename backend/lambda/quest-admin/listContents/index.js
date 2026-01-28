// C:\sayme\dev\backend\lambda\quest-admin\listContents\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const queryParams = event.queryStringParameters || {};
    const type = queryParams.type; // 'template' or 'draft'

    let filterExpression;
    let expressionAttributeValues;

    if (type) {
      filterExpression = '#type = :type';
      expressionAttributeValues = { ':type': type };
    }

    const command = new ScanCommand({
      TableName: 'Quest_ContentLibrary',
      FilterExpression: filterExpression,
      ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
      ExpressionAttributeValues: expressionAttributeValues
    });

    const result = await docClient.send(command);

    // 정렬: updatedAt 기준 내림차순
    const sortedItems = (result.Items || []).sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        contents: sortedItems,
        count: sortedItems.length
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
        error: 'Failed to list contents',
        details: error.message
      })
    };
  }
};