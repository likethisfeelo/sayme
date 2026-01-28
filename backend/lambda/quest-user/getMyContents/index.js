// C:\sayme\dev\backend\lambda\quest-user\getMyContents\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Cognito authorizer에서 userId 추출
    const userId = event.requestContext?.authorizer?.claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // 사용자 할당 조회
    const assignmentCommand = new QueryCommand({
      TableName: 'Quest_UserAssignment',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':status': 'active'
      }
    });

    const assignmentResult = await docClient.send(assignmentCommand);
    const assignments = assignmentResult.Items || [];

    if (assignments.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({
          contents: [],
          count: 0
        })
      };
    }

    // 원본 콘텐츠 정보 가져오기
    const sourceContentIds = [...new Set(assignments.map(a => a.sourceContentId))];
    
    const batchGetCommand = new BatchGetCommand({
      RequestItems: {
        'Quest_ContentLibrary': {
          Keys: sourceContentIds.map(id => ({ contentId: id }))
        }
      }
    });

    const contentResult = await docClient.send(batchGetCommand);
    const contents = contentResult.Responses?.Quest_ContentLibrary || [];

    const contentMap = {};
    contents.forEach(content => {
      contentMap[content.contentId] = content;
    });

    // 사용자 응답 조회
    const responsePromises = assignments.map(assignment =>
      docClient.send(new QueryCommand({
        TableName: 'Quest_UserResponse',
        KeyConditionExpression: 'userId = :userId AND contentId = :contentId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':contentId': assignment.contentId
        }
      }))
    );

    const responseResults = await Promise.all(responsePromises);
    const responses = {};
    
    responseResults.forEach((result, index) => {
      if (result.Items && result.Items.length > 0) {
        responses[assignments[index].contentId] = result.Items[0];
      }
    });

    // 콘텐츠 병합 (원본 + 커스터마이징 + 진행상태)
    const enrichedContents = assignments.map(assignment => {
      const sourceContent = contentMap[assignment.sourceContentId];
      const userResponse = responses[assignment.contentId];

      // 커스터마이징 적용
      let finalContent = { ...sourceContent };
      
      if (assignment.isCustomized && assignment.customizations) {
        if (assignment.customizations.title) {
          finalContent.title = assignment.customizations.title;
        }
        if (assignment.customizations.description) {
          finalContent.description = assignment.customizations.description;
        }
        if (assignment.customizations.contentItems) {
          // contentItems 커스터마이징 적용
          finalContent.contentItems = finalContent.contentItems.map((item, idx) => {
            const customItem = assignment.customizations.contentItems.find(
              c => c.itemIndex === idx
            );
            return customItem ? { ...item, ...customItem } : item;
          });
        }
      }

      return {
        assignmentId: assignment.contentId,
        sourceContentId: assignment.sourceContentId,
        orderIndex: assignment.orderIndex,
        isCustomized: assignment.isCustomized,
        content: finalContent,
        progress: {
          status: userResponse?.status || 'not_started',
          completedAt: userResponse?.completedAt,
          currentStep: userResponse?.responses?.length || 0,
          totalSteps: finalContent.contentItems?.length || 0
        }
      };
    });

    // orderIndex로 정렬
    enrichedContents.sort((a, b) => a.orderIndex - b.orderIndex);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        contents: enrichedContents,
        count: enrichedContents.length
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
        error: 'Failed to get my contents',
        details: error.message
      })
    };
  }
};