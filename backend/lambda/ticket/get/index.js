/**
 * 티켓 조회 Lambda
 *
 * 기능: 로그인한 사용자의 보유 티켓 목록을 조회
 * 메서드: GET /ticket
 * 인증: Cognito Authorizer (일반 사용자)
 * 테이블: sayme-user-tickets
 *
 * 응답: 티켓 종류별 보유 수량, 만료일 정보
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-user-tickets';

// Ticket types
const TICKET_TYPES = {
  tarot: { name: '타로', icon: '🎴' },
  fortune: { name: '사주체크', icon: '🔮' },
  universe: { name: '우주흐름체크', icon: '🌌' },
  consultation: { name: '1:1 추가 상담', icon: '💬' },
};

exports.handler = async (event) => {
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

    // Get user's tickets
    const query = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const result = await docClient.send(query);

    // Filter expired tickets and format response
    const now = new Date();
    const tickets = (result.Items || [])
      .filter(ticket => new Date(ticket.expiresAt) > now && ticket.count > 0)
      .map(ticket => ({
        ticketType: ticket.ticketType,
        name: TICKET_TYPES[ticket.ticketType]?.name || ticket.ticketType,
        icon: TICKET_TYPES[ticket.ticketType]?.icon || '🎫',
        count: ticket.count,
        issuedAt: ticket.issuedAt,
        expiresAt: ticket.expiresAt,
      }));

    // Build summary with all ticket types (0 for missing)
    const ticketSummary = Object.entries(TICKET_TYPES).map(([type, info]) => {
      const userTicket = tickets.find(t => t.ticketType === type);
      return {
        ticketType: type,
        name: info.name,
        icon: info.icon,
        count: userTicket?.count || 0,
        issuedAt: userTicket?.issuedAt || null,
        expiresAt: userTicket?.expiresAt || null,
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tickets: ticketSummary,
        activeCount: tickets.reduce((sum, t) => sum + t.count, 0),
      }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Internal server error' }),
    };
  }
};
