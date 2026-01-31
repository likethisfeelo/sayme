const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

// 활성 사전질문 2개를 설정하는 API
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { contentIds } = body; // 최대 2개의 contentId 배열

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        body: JSON.stringify({ error: 'contentIds array is required (max 2)' })
      };
    }

    if (contentIds.length > 2) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        body: JSON.stringify({ error: '최대 2개까지만 선택할 수 있습니다' })
      };
    }

    // 선택된 콘텐츠가 실제로 존재하는지 확인
    const batchResult = await docClient.send(new BatchGetCommand({
      RequestItems: {
        'Prequest_ContentLibrary': {
          Keys: contentIds.map(id => ({ contentId: id }))
        }
      }
    }));

    const foundContents = batchResult.Responses?.Prequest_ContentLibrary || [];
    if (foundContents.length !== contentIds.length) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        body: JSON.stringify({ error: '일부 콘텐츠를 찾을 수 없습니다' })
      };
    }

    // 활성 설정 저장 (고정 configId로 항상 덮어쓰기)
    const config = {
      configId: 'active_prequest',
      contentIds,
      contents: foundContents.map(c => ({
        contentId: c.contentId,
        title: c.title,
        description: c.description,
        contentItems: c.contentItems
      })),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: 'Prequest_ActiveConfig',
      Item: config
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
        message: '활성 사전질문이 설정되었습니다',
        config
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      body: JSON.stringify({ error: 'Failed to set active questions', details: error.message })
    };
  }
};
