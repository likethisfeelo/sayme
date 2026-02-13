// Lambda: sayme-premium-registration
// 프리미엄 서비스 신청 (사용자 정보 업데이트)
 
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { CognitoJwtVerifier } = require("aws-jwt-verify");
 
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
 
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});
 
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
 
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
 
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '로그인이 필요합니다.' })
      };
    }
 
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifier.verify(token);
    const userId = payload.sub;
 
    const body = JSON.parse(event.body || '{}');
 
    const { phoneNumber, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, birthTimeCertainty, birthCity, marketingConsent, requestSource } = body;
 
    // 필수값 검증
    if (!phoneNumber || !gender || !birthYear || !birthMonth || !birthDay || !birthTimeCertainty) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '필수 정보를 모두 입력해주세요. (태어난 시간 정보 포함)' })
      };
    }
 
    const now = new Date().toISOString();
    const birthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    const birthTime = birthTimeCertainty === 'unknown'
      ? null
      : (birthHour !== undefined && birthHour !== null && birthHour !== ''
      ? `${String(birthHour).padStart(2, '0')}:${String(birthMinute || 0).padStart(2, '0')}`
      : null);
 
    const updateExpression = [
      'phoneNumber = :phone',
      'gender = :gender',
      'birthDate = :birthDate',
      'birthTime = :birthTime',
      'birthTimeCertainty = :birthTimeCertainty',
      'birthCity = :birthCity',
      'marketingConsent = :marketing',
      'consultationStatus = :consultation',
      'premiumRequestedAt = :requestedAt',
      'premiumRequestSource = :requestSource',
      'updatedAt = :now',
    ];
 
    const expressionValues = {
      ':phone': phoneNumber,
      ':gender': gender,
      ':birthDate': birthDate,
      ':birthTime': birthTime,
      ':birthTimeCertainty': birthTimeCertainty,
      ':birthCity': birthCity || null,
      ':marketing': !!marketingConsent,
      ':consultation': 'requested',
      ':requestedAt': now,
      ':requestSource': requestSource || 'unknown',
      ':now': now,
    };
 
    const command = new UpdateCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'sayme-users',
      Key: { userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    });
 
    const result = await docClient.send(command);
 
    console.log('Premium registration submitted:', userId);
 
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '프리미엄 서비스 신청이 완료되었습니다.',
        consultationStatus: 'requested',
      })
    };
 
  } catch (error) {
    console.error('Premium registration error:', error);
 
    if (error.name === 'JwtExpiredError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '로그인이 만료되었습니다. 다시 로그인해주세요.' })
      };
    }
 
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
    };
  }
};