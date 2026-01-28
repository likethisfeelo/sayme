// C:\sayme\dev\backend\lambda\quest-admin\getContentStats\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const contentId = event.pathParameters?.contentId;

    if (!contentId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'contentId is required' })
      };
    }

    // 콘텐츠 정보 조회
    const contentCommand = new GetCommand({
      TableName: 'Quest_ContentLibrary',
      Key: { contentId }
    });

    const contentResult = await docClient.send(contentCommand);

    if (!contentResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'Content not found' })
      };
    }

    // 이 콘텐츠가 할당된 모든 경우 찾기
    const assignmentCommand = new ScanCommand({
      TableName: 'Quest_UserAssignment',
      FilterExpression: 'sourceContentId = :contentId',
      ExpressionAttributeValues: {
        ':contentId': contentId
      }
    });

    const assignmentResult = await docClient.send(assignmentCommand);
    const assignments = assignmentResult.Items || [];

    // 각 할당에 대한 응답 조회
    const responsePromises = assignments.map(assignment =>
      docClient.send(new GetCommand({
        TableName: 'Quest_UserResponse',
        Key: {
          userId: assignment.userId,
          contentId: assignment.contentId
        }
      }))
    );

    const responseResults = await Promise.all(responsePromises);
    const responses = responseResults
      .map(r => r.Item)
      .filter(item => item !== undefined);

    // 통계 계산
    const stats = {
      totalAssigned: assignments.length,
      completed: responses.filter(r => r.status === 'completed').length,
      inProgress: responses.filter(r => r.status === 'in_progress').length,
      skipped: responses.filter(r => r.status === 'skipped').length,
      savedForLater: responses.filter(r => r.status === 'saved_for_later').length,
      notStarted: assignments.length - responses.length
    };

    // 만족도 분포
    const satisfactionDistribution = {};
    const reactionDistribution = {};
    let totalTimeSpent = 0;
    let timeSpentCount = 0;

    responses.forEach(response => {
      if (response.feedback?.satisfaction) {
        satisfactionDistribution[response.feedback.satisfaction] = 
          (satisfactionDistribution[response.feedback.satisfaction] || 0) + 1;
      }
      if (response.feedback?.reaction) {
        reactionDistribution[response.feedback.reaction] = 
          (reactionDistribution[response.feedback.reaction] || 0) + 1;
      }
      if (response.timeSpent) {
        totalTimeSpent += response.timeSpent;
        timeSpentCount++;
      }
    });

    const avgTimeSpent = timeSpentCount > 0 
      ? Math.round(totalTimeSpent / timeSpentCount) 
      : 0;

    // 주의 필요 사용자 (상담 요청 등)
    const needsAttention = responses.filter(r => 
      r.feedback?.needsFollowUp || 
      r.feedback?.satisfaction === '상담 시 더 이야기하고 싶어요' ||
      r.feedback?.satisfaction === '생각은 많은데 쓰기가 힘들어요'
    ).map(r => ({
      userId: r.userId,
      feedback: r.feedback,
      completedAt: r.completedAt
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        content: contentResult.Item,
        stats,
        satisfactionDistribution,
        reactionDistribution,
        avgTimeSpent,
        needsAttention,
        recentComments: responses
          .filter(r => r.feedback?.comment)
          .slice(0, 20)
          .map(r => ({
            userId: r.userId,
            comment: r.feedback.comment,
            completedAt: r.completedAt
          }))
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
        error: 'Failed to get content stats',
        details: error.message
      })
    };
  }
};