/**
 * Cognito JWT 검증 유틸
 *
 * - API Gateway Cognito Authorizer 가 붙어 있으면 requestContext.authorizer.claims 를 우선 사용
 * - 아니면 Authorization 헤더의 JWT(id / access 토큰 모두 허용)를 aws-jwt-verify 로 검증
 * - 관리자 판정: cognito:groups 에 'Admins' 포함 (환경변수 ADMIN_GROUP 으로 변경 가능)
 */
const { CognitoJwtVerifier } = require('aws-jwt-verify');

let verifier = null;

function getVerifier() {
  if (verifier) return verifier;
  verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: null, // id / access 토큰 모두 허용
    clientId: process.env.COGNITO_CLIENT_ID,
  });
  return verifier;
}

function getAuthHeader(event) {
  const headers = event.headers || {};
  return headers.Authorization || headers.authorization || '';
}

function extractGroups(claims) {
  const groups = claims?.['cognito:groups'];
  if (Array.isArray(groups)) return groups;
  if (typeof groups === 'string') {
    // "[Admins premium]" 또는 "Admins,premium" 형태 대응
    return groups.replace(/[[\]]/g, '').split(/[\s,]+/).filter(Boolean);
  }
  return [];
}

/**
 * @returns {Promise<{userId, email, username, groups, isAdmin, claims} | null>}
 */
async function authenticate(event, deps = {}) {
  const verify = deps.verifyToken || ((token) => getVerifier().verify(token));

  let claims = event.requestContext?.authorizer?.claims;

  if (!claims?.sub) {
    const token = getAuthHeader(event).replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;
    claims = await verify(token); // 실패 시 throw → 401 처리
  }

  const groups = extractGroups(claims);
  const adminGroup = process.env.ADMIN_GROUP || 'Admins';

  return {
    userId: claims.sub,
    email: claims.email || null,
    username: claims['cognito:username'] || claims.username || null,
    groups,
    isAdmin: groups.includes(adminGroup),
    claims,
  };
}

module.exports = { authenticate, extractGroups };
