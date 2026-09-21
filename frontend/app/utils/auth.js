export const getCookie = (name) => {
  if (typeof window === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  
  let token = localStorage.getItem('accessToken');
  
  if (!token) {
    token = getCookie('accessToken');
    if (token) {
      localStorage.setItem('accessToken', token);
    }
  }
  
  return token;
};

export const getIdTokenPayload = () => {
  if (typeof window === 'undefined') return null;

  const idToken = localStorage.getItem('idToken');
  if (!idToken) return null;

  try {
    return JSON.parse(atob(idToken.split('.')[1] || ''));
  } catch (error) {
    console.error('Failed to parse idToken payload:', error);
    return null;
  }
};

export const saveTokens = (tokens) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('idToken', tokens.idToken);
  if (tokens.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken);

  // 세션 연장(SECRET_HASH)에 필요한 Cognito username 보관
  try {
    const payload = JSON.parse(atob(tokens.idToken.split('.')[1] || ''));
    const username = payload['cognito:username'] || payload.username || payload.email;
    if (username) localStorage.setItem('cognitoUsername', username);
  } catch {
    /* ignore */
  }
  
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `accessToken=${tokens.accessToken}; expires=${expires}; path=/; SameSite=Strict`;
};

// ---------- 세션 연장 (리프레시 토큰) ----------
const API_BASE_FOR_AUTH = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';
const REFRESH_AHEAD_MS = 10 * 60 * 1000; // 만료 10분 전부터 갱신

export const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload?.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

/** id/access 토큰이 만료됐거나 곧 만료되는지 */
export const isSessionStale = () => {
  if (typeof window === 'undefined') return false;
  const idToken = localStorage.getItem('idToken');
  const accessToken = localStorage.getItem('accessToken');
  const exps = [idToken, accessToken].filter(Boolean).map(getTokenExpiry).filter(Boolean);
  if (!exps.length) return false;
  return Math.min(...exps) - Date.now() < REFRESH_AHEAD_MS;
};

let refreshPromise = null;

/**
 * 리프레시 토큰으로 새 토큰 발급. 성공 시 true.
 * 동시에 여러 곳에서 호출해도 한 번만 요청한다.
 */
export const refreshSession = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  const username = localStorage.getItem('cognitoUsername') || localStorage.getItem('userEmail');
  if (!refreshToken || !username) return Promise.resolve(false);

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_FOR_AUTH}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, username }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.tokens?.idToken) {
        saveTokens({ ...data.tokens, refreshToken: data.tokens.refreshToken || refreshToken });
        return true;
      }
      if (res.status === 401) {
        // 리프레시 토큰까지 만료 → 세션 정리 (다음 API 호출에서 로그인으로 이동)
        clearTokens();
      }
      return false;
    } catch (error) {
      console.warn('session refresh failed:', error);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

/** 필요할 때만 갱신. API 호출 직전에 await 해서 사용 */
export const ensureFreshSession = async () => {
  if (typeof window === 'undefined') return false;
  if (!getAccessToken()) return false;
  if (!isSessionStale()) return true;
  return refreshSession();
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('cognitoUsername');
  
  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

export const fetchWithAuth = async (url, options = {}) => {
  await ensureFreshSession();
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No access token');
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
