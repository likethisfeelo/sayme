/**
 * 티켓 부여 Lambda (관리자 전용)
 *
 * 기능: 관리자가 특정 사용자에게 티켓을 부여
 * 메서드: POST /ticket/assign
 * 인증: Cognito Authorizer (Admins 그룹 필수)
 * 테이블: sayme-user-tickets
 *
 * 요청 Body:
 *   - targetUserId: 대상 사용자 ID (Cognito sub)
 *   - ticketType: tarot | fortune | universe | consultation
 *   - count: 부여할 수량 (0이면 제거)
 *
 * 만료: 발행된 월의 마지막 날 23:59:59
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sayme-user-tickets';

// Valid ticket types
const VALID_TICKET_TYPES = ['tarot', 'fortune', 'universe', 'consultation'];

// Calculate expiration date (end of current month)
const getExpirationDate = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return lastDay.toISOString();
};

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check if user is admin
    const groups = event.requestContext?.authorizer?.claims?.['cognito:groups'];
    const isAdmin = groups?.includes('Admins') || groups === 'Admins';

    if (!isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, message: 'Admin access required' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { targetUserId, ticketType, count } = body;

    // Validation
    if (!targetUserId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'targetUserId is required' }),
      };
    }

    if (!ticketType || !VALID_TICKET_TYPES.includes(ticketType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: `Invalid ticketType. Valid types: ${VALID_TICKET_TYPES.join(', ')}`
        }),
      };
    }

    if (typeof count !== 'number' || count < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'count must be a non-negative number' }),
      };
    }

    const now = new Date().toISOString();
    const expiresAt = getExpirationDate();

    // Get existing ticket to preserve issuedAt if exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userId: targetUserId,
        ticketType,
      },
    });

    const existing = await docClient.send(getCommand);
    const issuedAt = existing.Item?.issuedAt || now;

    // Update or create ticket
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId: targetUserId,
        ticketType,
        count,
        issuedAt,
        expiresAt,
        updatedAt: now,
        updatedBy: event.requestContext?.authorizer?.claims?.sub,
      },
    });

    await docClient.send(putCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Ticket assigned: ${ticketType} x ${count} to user ${targetUserId}`,
        ticket: {
          userId: targetUserId,
          ticketType,
          count,
          expiresAt,
        },
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