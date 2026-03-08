// C:\sayme\dev\backend\lambda\quest-admin\getUserAssignments\index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

const toLowerSafe = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const collectIdentityKeys = (value) => {
  const normalized = toLowerSafe(value);
  if (!normalized) return [];
  return [normalized, normalized.replace(/^bearer\s+/, '')];
};

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

const queryResponsesByUserId = async (userId) => {
  if (!userId) return [];

  const command = new QueryCommand({
    TableName: 'Quest_UserResponse',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  });

  const result = await docClient.send(command);
  return result.Items || [];
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const requestedUserId = event.pathParameters?.userId;
    const includeResponses = event.queryStringParameters?.includeResponses === 'true';
    const alternateUserId = event.queryStringParameters?.altUserId;
    const requestedAssignmentId = event.queryStringParameters?.assignmentId;
    const extraUserIds = (event.queryStringParameters?.extraUserIds || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

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

    if (requestedAssignmentId) {
      assignments = assignments.filter((assignment) =>
        assignment.contentId === requestedAssignmentId || assignment.sourceContentId === requestedAssignmentId
      );
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
      // 응답은 키 추정(BatchGet)보다 사용자 파티션 Query가 누락 가능성이 낮아 우선 사용
      if (includeResponses) {
        // no-op: responses are fetched below via Query by userId
      }

      let contents = [];
      let responses = [];

      if (Object.keys(requestItems).length > 0) {
        const batchGetCommand = new BatchGetCommand({ RequestItems: requestItems });
        const batchResult = await docClient.send(batchGetCommand);
        contents = batchResult.Responses?.Quest_ContentLibrary || [];
      }

      if (includeResponses) {
        const candidateUserIds = [...new Set([
          resolvedAssignmentUserId,
          requestedUserId,
          alternateUserId,
          ...extraUserIds
        ].filter(Boolean))];

        const queriedResponses = await Promise.all(
          candidateUserIds.map((candidateUserId) => queryResponsesByUserId(candidateUserId))
        );

        responses = queriedResponses.flat();
      }

      // 콘텐츠 정보를 매핑
      const contentMap = {};
      contents.forEach((content) => {
        contentMap[content.contentId] = content;
      });

      // 응답 정보를 contentId + userId 단위로 매핑
      const responseMap = {};
      const responseByContentId = {};
      responses.forEach((response) => {
        if (!response.userId) return;

        const responseContentIdCandidates = [
          response.contentId,
          response.assignmentId,
          response.sourceContentId
        ].filter(Boolean);

        responseContentIdCandidates.forEach((candidateContentId) => {
          responseMap[`${candidateContentId}::${response.userId}`] = response;

          if (!responseByContentId[candidateContentId]) {
            responseByContentId[candidateContentId] = [];
          }

          responseByContentId[candidateContentId].push(response);
        });
      });

      const responseUserPriority = [
        resolvedAssignmentUserId,
        requestedUserId,
        alternateUserId,
        ...extraUserIds
      ].filter(Boolean);

      const responseIdentityKeySet = new Set(
        responseUserPriority.flatMap((value) => collectIdentityKeys(value))
      );

      const diagnostics = {
        responseCount: responses.length,
        unmatchedAssignmentCount: 0,
      };

      // 할당에 원본 콘텐츠 정보 추가
      const enrichedAssignments = assignments.map((assignment) => {
        const candidateContentIds = [assignment.contentId, assignment.sourceContentId].filter(Boolean);
        let matchedResponse = null;

        for (const candidateUserId of responseUserPriority) {
          matchedResponse = candidateContentIds
            .map((candidateContentId) => responseMap[`${candidateContentId}::${candidateUserId}`])
            .find(Boolean);

          if (matchedResponse) break;
        }

        if (!matchedResponse) {
          // userId 축이 완전히 다르더라도 contentId 축으로 fallback 매칭
          for (const candidateContentId of candidateContentIds) {
            const contentResponses = responseByContentId[candidateContentId] || [];
            if (!contentResponses.length) continue;

            matchedResponse = contentResponses.find((response) => {
              const candidateKeys = [
                response?.userId,
                response?.username,
                response?.email,
              ].flatMap((value) => collectIdentityKeys(value));

              if (!candidateKeys.length) return true;
              return candidateKeys.some((key) => responseIdentityKeySet.has(key));
            }) || contentResponses[0];

            if (matchedResponse) break;
          }
        }

        if (!matchedResponse) {
          diagnostics.unmatchedAssignmentCount += 1;
        }

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
          requestedAssignmentId: requestedAssignmentId || null,
          candidateUserIds: includeResponses ? [...new Set(responseUserPriority)] : [],
          diagnostics,
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
        requestedAssignmentId: requestedAssignmentId || null,
        candidateUserIds: [],
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
