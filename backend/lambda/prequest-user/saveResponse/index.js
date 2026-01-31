const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('=== PREQUEST SAVE RESPONSE ===');
  console.log(JSON.stringify(event, null, 2));

  try {
    // userId 추출
    let userId = null;
    if (event.requestContext?.authorizer?.claims?.sub) {
      userId = event.requestContext.authorizer.claims.sub;
    } else if (event.requestContext?.authorizer?.sub) {
      userId = event.requestContext.authorizer.sub;
    } else if (event.requestContext?.authorizer?.principalId) {
      userId = event.requestContext.authorizer.principalId;
    } else if (event.requestContext?.authorizer?.jwt?.claims?.sub) {
      userId = event.requestContext.authorizer.jwt.claims.sub;
    }

    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        body: JSON.stringify({ error: 'Unauthorized', message: 'User ID not found' })
      };
    }

    const body = JSON.parse(event.body);
    const { contentId, responses, status, timeSpent } = body;

    if (!contentId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
        body: JSON.stringify({ error: 'contentId is required' })
      };
    }

    // 기존 응답 조회
    let existingResponse = null;
    try {
      const existing = await docClient.send(new GetCommand({
        TableName: 'Prequest_UserResponse',
        Key: { userId, contentId }
      }));
      existingResponse = existing.Item;
    } catch (e) {
      existingResponse = null;
    }

    const now = new Date().toISOString();

    const userResponse = {
      userId,
      contentId,
      responses: responses || existingResponse?.responses || [],
      status: status || existingResponse?.status || 'in_progress',
      timeSpent: timeSpent || existingResponse?.timeSpent || 0,
      startedAt: existingResponse?.startedAt || now,
      updatedAt: now,
      createdAt: existingResponse?.createdAt || now
    };

    if (status === 'completed' && !existingResponse?.completedAt) {
      userResponse.completedAt = now;
    } else if (existingResponse?.completedAt) {
      userResponse.completedAt = existingResponse.completedAt;
    }

    await docClient.send(new PutCommand({
      TableName: 'Prequest_UserResponse',
      Item: userResponse
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Response saved successfully',
        response: userResponse
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
