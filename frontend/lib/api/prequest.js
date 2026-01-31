// Prequest API
const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const getAuthHeaders = () => {
  const idToken = localStorage.getItem('idToken');
  return {
    'Content-Type': 'application/json',
    ...(idToken && { 'Authorization': idToken })
  };
};

// Admin API
export const prequestAdminApi = {
  createContent: async (data) => {
    const response = await fetch(`${API_BASE_URL}/prequest/admin/contents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  listContents: async () => {
    const response = await fetch(`${API_BASE_URL}/prequest/admin/contents`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getContent: async (contentId) => {
    const response = await fetch(`${API_BASE_URL}/prequest/admin/contents/${contentId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateContent: async (contentId, data) => {
    const response = await fetch(`${API_BASE_URL}/prequest/admin/contents/${contentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteContent: async (contentId) => {
    const response = await fetch(`${API_BASE_URL}/prequest/admin/contents/${contentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  setActiveQuestions: async (contentIds) => {
    const response = await fetch(`${API_BASE_URL}/prequest/admin/active`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contentIds }),
    });
    return response.json();
  },

  getActiveQuestions: async () => {
    const response = await fetch(`${API_BASE_URL}/prequest/admin/active`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
};

// User API
export const prequestUserApi = {
  getActivePrequests: async (token) => {
    const headers = token ? { 'Authorization': token } : {};
    const response = await fetch(`${API_BASE_URL}/prequest/user/active`, {
      headers
    });
    return response.json();
  },

  saveResponse: async (data, token) => {
    const response = await fetch(`${API_BASE_URL}/prequest/user/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getMyResponses: async (token) => {
    const response = await fetch(`${API_BASE_URL}/prequest/user/responses`, {
      headers: { 'Authorization': token },
    });
    return response.json();
  },
};
