// C:\sayme\dev\backend\lambda\quest-admin\getUserAssignments\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const queryAssignmentsByUserId = async (userId) => {
  if (!userId) return [];

  const assignmentCommand = new QueryCommand({
    TableName: 'Quest_UserAssignment',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  });

  const assignmentResult = await docClient.send(assignmentCommand);
  return assignmentResult.Items || [];
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const requestedUserId = event.pathParameters?.userId;
    const includeResponses = event.queryStringParameters?.includeResponses === 'true';
    const alternateUserId = event.queryStringParameters?.altUserId;

    if (!requestedUserId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // 1차: path userId로 조회, 2차: altUserId가 있고 결과가 없으면 fallback 조회
    let assignments = await queryAssignmentsByUserId(requestedUserId);
    let resolvedAssignmentUserId = requestedUserId;

    if (assignments.length === 0 && alternateUserId && alternateUserId !== requestedUserId) {
      const fallbackAssignments = await queryAssignmentsByUserId(alternateUserId);
      if (fallbackAssignments.length > 0) {
        assignments = fallbackAssignments;
        resolvedAssignmentUserId = alternateUserId;
      }
    }

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
          const candidateUserIds = [...new Set([
            resolvedAssignmentUserId,
            requestedUserId,
            alternateUserId
          ].filter(Boolean))];

          const responseKeys = [];
          candidateUserIds.forEach((candidateUserId) => {
            assignmentContentIds.forEach((contentId) => {
              responseKeys.push({ userId: candidateUserId, contentId });
            });
          });

          requestItems.Quest_UserResponse = {
            Keys: responseKeys
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

      // 응답 정보를 contentId + userId 단위로 매핑
      const responseMap = {};
      responses.forEach((response) => {
        if (!response.contentId || !response.userId) return;
        responseMap[`${response.contentId}::${response.userId}`] = response;
      });

      const responseUserPriority = [resolvedAssignmentUserId, requestedUserId, alternateUserId].filter(Boolean);

      // 할당에 원본 콘텐츠 정보 추가
      const enrichedAssignments = assignments.map((assignment) => {
        const matchedResponse = responseUserPriority
          .map((candidateUserId) => responseMap[`${assignment.contentId}::${candidateUserId}`])
          .find(Boolean);

        return {
          ...assignment,
          sourceContent: contentMap[assignment.sourceContentId],
          userResponse: matchedResponse || null
        };
      });

      // orderIndex로 정렬
      enrichedAssignments.sort((a, b) => (a.orderIndex || 999) - (b.orderIndex || 999));

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({
          requestedUserId,
          resolvedAssignmentUserId,
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
        requestedUserId,
        resolvedAssignmentUserId,
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
