// premium-home-events-list/index.mjs
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

    // DynamoDB에서 사용자 이벤트 조회
    const command = new QueryCommand({
      TableName: 'sayme-events',
      IndexName: 'userId-createdAt-index', // GSI 필요
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // 최신순
      Limit: 10,
    });

    const response = await docClient.send(command);

    const events = (response.Items || []).map(item => ({
      eventId: item.eventId,
      title: item.title,
      description: item.description,
      eventUrl: item.eventUrl || '/events/default',
      isNew: item.isNew || false,
      createdAt: item.createdAt,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        events: events,
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
```

**API Gateway 설정**:
- Method: `GET`
- Path: `/premium-home/events`
- Authorization: AWS_IAM (Cognito User Pool)
- CORS: Enabled

---

## 📋 DynamoDB 테이블 생성

### 1) sayme-user-goals
```
Primary Key:
  - Partition Key: userId (String)
  - Sort Key: month (String) // Format: YYYY-MM

Attributes:
  - keyword (String)
  - direction (String)
  - sentence3 (String)
  - createdAt (String)
  - updatedAt (String)
```

### 2) sayme-monthly-reports
```
Primary Key:
  - Partition Key: userId (String)
  - Sort Key: month (String) // Format: YYYY-MM

Attributes:
  - reportUrl (String) // S3 URL
  - status (String) // uploaded, processing, ready
  - uploadedAt (String)
```

### 3) sayme-events
```
Primary Key:
  - Partition Key: eventId (String)
  - Sort Key: userId (String)

GSI: userId-createdAt-index
  - Partition Key: userId
  - Sort Key: createdAt

Attributes:
  - eventType (String)
  - title (String)
  - description (String)
  - eventUrl (String)
  - isNew (Boolean)
  - createdAt (String)