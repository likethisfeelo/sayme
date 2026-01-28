const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // 전체 이벤트 로그
  console.log('=== FULL EVENT ===');
  console.log(JSON.stringify(event, null, 2));
  
  try {
    // 1. userId 추출
    let userId = null;
    
    if (event.requestContext?.authorizer?.claims?.sub) {
      userId = event.requestContext.authorizer.claims.sub;
      console.log('[SUCCESS] Found userId in claims.sub:', userId);
    } else if (event.requestContext?.authorizer?.sub) {
      userId = event.requestContext.authorizer.sub;
      console.log('[SUCCESS] Found userId in authorizer.sub:', userId);
    } else if (event.requestContext?.authorizer?.principalId) {
      userId = event.requestContext.authorizer.principalId;
      console.log('[SUCCESS] Found userId in principalId:', userId);
    } else if (event.requestContext?.authorizer?.jwt?.claims?.sub) {
      userId = event.requestContext.authorizer.jwt.claims.sub;
      console.log('[SUCCESS] Found userId in jwt.claims.sub:', userId);
    }

    if (!userId) {
      console.error('[ERROR] No userId found in authorizer context');
      console.error('Authorizer object:', JSON.stringify(event.requestContext?.authorizer, null, 2));
      
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: 'User ID not found in request context'
        })
      };
    }

    // 2. Body 파싱
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('[SUCCESS] Parsed body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[ERROR] Failed to parse body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid request body',
          details: parseError.message 
        })
      };
    }

    const {
      assignmentId,
      responses,
      feedback,
      status,
      timeSpent
    } = body;

    // 3. Validation
    if (!assignmentId) {
      console.error('[ERROR] Missing assignmentId');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'assignmentId is required' })
      };
    }

    console.log(`[INFO] Processing save for userId: ${userId}, assignmentId: ${assignmentId}`);

    // 4. 할당 확인
    let assignmentCheck;
    try {
      assignmentCheck = await docClient.send(new GetCommand({
        TableName: 'Quest_UserAssignment',
        Key: { userId, contentId: assignmentId }
      }));
      console.log('[SUCCESS] Assignment check completed:', assignmentCheck.Item ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('[ERROR] Failed to check assignment:', dbError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ 
          error: 'Database error while checking assignment',
          details: dbError.message 
        })
      };
    }

    if (!assignmentCheck.Item) {
      console.error('[ERROR] Content not assigned to user');
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ error: 'Content not assigned to you' })
      };
    }

    // 5. 기존 응답 조회
    let existingResponse;
    try {
      const existingResponseResult = await docClient.send(new GetCommand({
        TableName: 'Quest_UserResponse',
        Key: { userId, contentId: assignmentId }
      }));
      existingResponse = existingResponseResult.Item;
      console.log('[SUCCESS] Existing response check:', existingResponse ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('[ERROR] Failed to get existing response:', dbError);
      // 기존 응답 조회 실패해도 계속 진행 (새로 생성)
      existingResponse = null;
    }

    const now = new Date().toISOString();

    // 6. 응답 데이터 구성
    const userResponse = {
      userId,  // ✅ userId 명시적 포함
      contentId: assignmentId,
      responses: responses || existingResponse?.responses || [],
      feedback: feedback || existingResponse?.feedback || {},
      status: status || existingResponse?.status || 'in_progress',
      timeSpent: timeSpent || existingResponse?.timeSpent || 0,
      startedAt: existingResponse?.startedAt || now,
      updatedAt: now,
      createdAt: existingResponse?.createdAt || now
    };

    // 완료 처리
    if (status === 'completed' && !existingResponse?.completedAt) {
      userResponse.completedAt = now;
      console.log('[INFO] Marking as completed');
    } else if (existingResponse?.completedAt) {
      userResponse.completedAt = existingResponse.completedAt;
    }

    console.log('[INFO] Saving response to DB:', JSON.stringify(userResponse, null, 2));

    // 7. DB 저장
    try {
      const command = new PutCommand({
        TableName: 'Quest_UserResponse',
        Item: userResponse
      });

      await docClient.send(command);
      console.log('[SUCCESS] Response saved successfully');
    } catch (dbError) {
      console.error('[ERROR] Failed to save response to DB:', dbError);
      console.error('Error details:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
        statusCode: dbError.$metadata?.httpStatusCode
      });
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify({ 
          error: 'Failed to save response to database',
          details: dbError.message,
          errorCode: dbError.code
        })
      };
    }

    // 8. 성공 응답
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Response saved successfully',
        response: userResponse
      })
    };

  } catch (error) {
    // 최상위 에러 핸들러
    console.error('[CRITICAL ERROR] Unexpected error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        type: error.name
      })
    };
  }
};