// Lambda: sayme-auth-refresh
// 리프레시 토큰으로 access/id 토큰 재발급 (POST /auth/refresh)
//
// 요청: { refreshToken, username }  (username = idToken 의 cognito:username, 없으면 email)
// 응답: { success, tokens: { accessToken, idToken, refreshToken(기존 유지), expiresIn } }
//
// 환경변수: COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET (login 함수와 동일)

const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const crypto = require('crypto');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

function calculateSecretHash(username, clientId, clientSecret) {
  return crypto.createHmac('SHA256', clientSecret).update(username + clientId).digest('base64');
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const body = JSON.parse(event.body || '{}');
    const { refreshToken, username } = body;
    if (!refreshToken || !username) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'refreshToken 과 username 이 필요합니다.' }) };
    }

    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    };
    if (process.env.COGNITO_CLIENT_SECRET) {
      params.AuthParameters.SECRET_HASH = calculateSecretHash(username, process.env.COGNITO_CLIENT_ID, process.env.COGNITO_CLIENT_SECRET);
    }

    const response = await client.send(new InitiateAuthCommand(params));
    const result = response.AuthenticationResult || {};
    if (!result.AccessToken || !result.IdToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: '토큰 재발급에 실패했습니다.' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tokens: {
          accessToken: result.AccessToken,
          idToken: result.IdToken,
          refreshToken: result.RefreshToken || refreshToken, // 회전 설정이 아니면 기존 리프레시 토큰 유지
          expiresIn: result.ExpiresIn,
        },
      }),
    };
  } catch (error) {
    console.error('refresh error:', error.name, error.message);
    const expired = error.name === 'NotAuthorizedException';
    return {
      statusCode: expired ? 401 : 500,
      headers,
      body: JSON.stringify({ success: false, error: expired ? '세션이 만료되었습니다. 다시 로그인해 주세요.' : '토큰 재발급 중 오류가 발생했습니다.', code: error.name }),
    };
  }
};
