// C:\sayme\dev\backend\lambda\quest-admin\getUserAssignments\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.pathParameters?.userId;
    const includeResponses = event.queryStringParameters?.includeResponses === 'true';

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // 사용자 할당 조회
    const assignmentCommand = new QueryCommand({
      TableName: 'Quest_UserAssignment',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const assignmentResult = await docClient.send(assignmentCommand);
    const assignments = assignmentResult.Items || [];

    // 원본 콘텐츠 정보 가져오기
    if (assignments.length > 0) {
      const sourceContentIds = [...new Set(assignments.map((assignment) => assignment.sourceContentId).filter(Boolean))];
      
      const requestItems = {};
      if (sourceContentIds.length > 0) {
        requestItems.Quest_ContentLibrary = {
          Keys: sourceContentIds.map((contentId) => ({ contentId }))
        };
      }

      // includeResponses=true 인 경우 사용자 응답도 함께 조회
      if (includeResponses) {
        const assignmentContentIds = [...new Set(assignments.map((assignment) => assignment.contentId).filter(Boolean))];

        if (assignmentContentIds.length > 0) {
          requestItems.Quest_UserResponse = {
            Keys: assignmentContentIds.map((contentId) => ({ userId, contentId }))
          };
        }
      }

      let contents = [];
      let responses = [];

      if (Object.keys(requestItems).length > 0) {
        const batchGetCommand = new BatchGetCommand({ RequestItems: requestItems });
        const batchResult = await docClient.send(batchGetCommand);
        contents = batchResult.Responses?.Quest_ContentLibrary || [];
        responses = batchResult.Responses?.Quest_UserResponse || [];
      }

      // 콘텐츠 정보를 매핑
      const contentMap = {};
      contents.forEach((content) => {
        contentMap[content.contentId] = content;
      });

      const responseMap = {};
      responses.forEach((response) => {
        responseMap[response.contentId] = response;
      });

      // 할당에 원본 콘텐츠 정보 추가
      const enrichedAssignments = assignments.map((assignment) => ({
        ...assignment,
        sourceContent: contentMap[assignment.sourceContentId],
        userResponse: responseMap[assignment.contentId]
      }));

      // orderIndex로 정렬
      enrichedAssignments.sort((a, b) => a.orderIndex - b.orderIndex);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({
          userId,
          assignments: enrichedAssignments,
          count: enrichedAssignments.length
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        userId,
        assignments: [],
        count: 0
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
        error: 'Failed to get user assignments',
        details: error.message
      })
    };
  }
};
