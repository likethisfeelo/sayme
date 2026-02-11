const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const raw = await response.text();

  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { raw };
  }

  return { response, data };
}

export async function saveRetrospective({ userId, sessionId, answers, token, currentStep, status = 'in_progress' }) {
  const payload = {
    ...(userId ? { userId } : {}),
    ...(sessionId ? { sessionId } : {}),
    answers,
    currentStep,
    status,
  };

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    // 우선 JWT 기반 최신 계약(PUT) 시도
    let result = await requestJson(`${API_URL}/retrospective/save`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    // 기존 계약(POST) 호환 fallback
    if (!result.response.ok && [400, 403, 404, 405].includes(result.response.status)) {
      result = await requestJson(`${API_URL}/retrospective/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }

    if (!result.response.ok) {
      throw new Error(`saveRetrospective failed: ${result.response.status} ${JSON.stringify(result.data)}`);
    }

    return result.data;
  } catch (error) {
    console.error('Failed to save retrospective:', error);
    throw error;
  }
}

export async function getRetrospective(userId, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    // 토큰 기반 최신 계약 우선
    let result = await requestJson(`${API_URL}/retrospective/current`, {
      method: 'GET',
      headers,
    });

    // 기존 쿼리 계약 fallback
    if (!result.response.ok && userId) {
      result = await requestJson(`${API_URL}/retrospective/current?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers,
      });
    }

    if (!result.response.ok) {
      throw new Error(`getRetrospective failed: ${result.response.status} ${JSON.stringify(result.data)}`);
    }

    return result.data;
  } catch (error) {
    console.error('Failed to get retrospective:', error);
    throw error;
  }
}
