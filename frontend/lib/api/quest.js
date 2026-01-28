// API 기본 URL
const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

// 토큰 가져오기 헬퍼
const getAuthHeaders = () => {
  const idToken = localStorage.getItem('idToken');
  return {
    'Content-Type': 'application/json',
    ...(idToken && { 'Authorization': idToken })
  };
};

// Admin API 함수들
export const questAdminApi = {
  // 콘텐츠 관리
  createContent: async (data) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  listContents: async () => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getContent: async (contentId) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents/${contentId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateContent: async (contentId, data) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents/${contentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contentId, ...data }),
    });
    return response.json();
  },

  deleteContent: async (contentId) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents/${contentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getContentStats: async (contentId) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents/${contentId}/stats`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // 할당 관리
  assignContent: async (data) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  unassignContent: async (userId, contentId) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/assignments`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, contentId }),
    });
    return response.json();
  },

  getUserAssignments: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/assignments/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
};

// User API 함수들
export const questUserApi = {
  getMyContents: async (token) => {
    const response = await fetch(`${API_BASE_URL}/quest/user/my-contents`, {
      headers: { 'Authorization': token },
    });
    return response.json();
  },

  getContentDetail: async (assignmentId, token) => {
    const response = await fetch(`${API_BASE_URL}/quest/user/my-contents/${assignmentId}`, {
      headers: { 'Authorization': token },
    });
    return response.json();
  },

  saveResponse: async (assignmentId, data, token) => {
    const response = await fetch(`${API_BASE_URL}/quest/user/my-contents/${assignmentId}/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getMyResponse: async (assignmentId, token) => {
    const response = await fetch(`${API_BASE_URL}/quest/user/my-contents/${assignmentId}/response`, {
      headers: { 'Authorization': token },
    });
    return response.json();
  },
};