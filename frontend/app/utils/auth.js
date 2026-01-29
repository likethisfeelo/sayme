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
  localStorage.setItem('refreshToken', tokens.refreshToken);
  
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `accessToken=${tokens.accessToken}; expires=${expires}; path=/; SameSite=Strict`;
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  
  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

export const fetchWithAuth = async (url, options = {}) => {
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
