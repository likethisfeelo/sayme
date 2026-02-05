// ticket-assign/index.mjs (Admin: Assign tickets to user)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

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

export const handler = async (event) => {
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
