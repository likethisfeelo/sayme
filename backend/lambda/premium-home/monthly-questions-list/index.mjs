// premium-home-monthly-questions-list/index.mjs
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Unauthorized' }),
      };
    }

    // 현재 월
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Quest 시스템의 월별 질문 조회
    const command = new QueryCommand({
      TableName: 'sayme-quest-assignments',
      KeyConditionExpression: 'userId = :userId AND begins_with(questId, :month)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':month': currentMonth,
      },
    });

    const response = await docClient.send(command);

    // 질문 데이터 변환
    const questions = (response.Items || []).map((item, index) => ({
      id: item.questId,
      number: `Q${index + 1}`,
      title: item.title || item.question,
      status: item.status || 'waiting', // completed, progress, waiting
      hasFeedback: item.adminFeedback ? true : false,
      answer: item.answer || '',
      createdAt: item.createdAt,
    }));

    // 샘플 데이터 (실제 데이터가 없을 경우)
    if (questions.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          questions: [
            {
              id: 1,
              number: 'Q1',
              title: '지금 내가 지키고 싶은 '기준'은 무엇인가?',
              status: 'completed',
              hasFeedback: true,
            },
            {
              id: 2,
              number: 'Q2',
              title: '내가 계속 미루는 결정은 무엇이고, 왜 미루는가?',
              status: 'progress',
              hasFeedback: false,
            },
            {
              id: 3,
              number: 'Q3',
              title: '이번 달, 나에게 가장 필요한 '경계선'은 어디인가?',
              status: 'waiting',
              hasFeedback: false,
            },
          ],
          month: currentMonth,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        questions: questions,
        month: currentMonth,
      }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
};