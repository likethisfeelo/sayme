// Premium Registration API
const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';
 
export const premiumRegistrationApi = {
  async submit(token, data) {
    const response = await fetch(`${API_BASE_URL}/premium-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
 
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || '신청 중 오류가 발생했습니다.');
    }
 
    return response.json();
  },
};