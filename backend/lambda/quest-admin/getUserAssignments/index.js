// C:\sayme\dev\backend\lambda\quest-admin\getUserAssignments\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const userId = event.pathParameters?.userId;

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

      // 콘텐츠 정보를 매핑
      const contentMap = {};
      contents.forEach(content => {
        contentMap[content.contentId] = content;
      });

      // 할당에 원본 콘텐츠 정보 추가
      const enrichedAssignments = assignments.map(assignment => ({
        ...assignment,
        sourceContent: contentMap[assignment.sourceContentId]
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