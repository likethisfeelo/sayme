/**
 * File: backend/lambda/prequest-user/getActivePrequests/index.js
 * Description: User - 활성 사전질문 + 내 응답 병합 조회
 * Runtime: Node.js 18.x
 * Table: Prequest_ActiveConfig, Prequest_ContentLibrary, Prequest_UserResponse
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
 
const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);
 
// 활성화된 사전질문 2개를 가져오고, 로그인 유저의 경우 응답 상태도 포함
exports.handler = async (event) => {
  try {
    // 활성 설정 가져오기
    const configResult = await docClient.send(new GetCommand({
      TableName: 'Prequest_ActiveConfig',
      Key: { configId: 'active_prequest' }
    }));
 
    const config = configResult.Item;
    if (!config || !config.contents || config.contents.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ prequests: [], count: 0 })
      };
    }
 
    // 로그인 유저의 응답 상태 확인 (토큰이 있는 경우)
    let userId = null;
    if (event.requestContext?.authorizer?.claims?.sub) {
      userId = event.requestContext.authorizer.claims.sub;
    } else if (event.requestContext?.authorizer?.sub) {
      userId = event.requestContext.authorizer.sub;
    }
 
    let responses = {};
    if (userId) {
      const responsePromises = config.contentIds.map(contentId =>
        docClient.send(new GetCommand({
          TableName: 'Prequest_UserResponse',
          Key: { userId, contentId }
        }))
      );
      const responseResults = await Promise.all(responsePromises);
      responseResults.forEach((result, index) => {
        if (result.Item) {
          responses[config.contentIds[index]] = result.Item;
        }
      });
    }
 
    const prequests = config.contents.map((content, index) => ({
      ...content,
      orderIndex: index,
      userResponse: responses[content.contentId] || null
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
        prequests,
        count: prequests.length
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      body: JSON.stringify({ error: 'Failed to get active prequests', details: error.message })
    };
  }
};