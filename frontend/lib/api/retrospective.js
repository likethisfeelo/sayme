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

  if (!response.ok) {
    throw new Error(`${options.method} ${url} failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export async function saveRetrospective({ userId, sessionId, answers, token, currentStep, status = 'in_progress' }) {
  const payload = {
    userId,
    sessionId,
    answers,
    currentStep,
    status,
  };

  return requestJson(`${API_URL}/retrospective/save`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export async function completeRetrospective({ userId, sessionId, answers, token }) {
  const payload = {
    userId,
    sessionId,
    answers,
  };

  return requestJson(`${API_URL}/retrospective/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export async function getRetrospective(userId, token) {
  return requestJson(`${API_URL}/retrospective/current?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}