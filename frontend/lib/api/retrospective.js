const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

export async function saveRetrospective({ userId, answers, token, currentStep, status = 'in_progress' }) {
  try {
    const response = await fetch(`${API_URL}/retrospective/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId,
        answers,
        currentStep,
        status,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save retrospective:', error);
    throw error;
  }
}

export async function getRetrospective(userId, token) {
  try {
    const response = await fetch(
      `${API_URL}/retrospective/current?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get retrospective:', error);
    throw error;
  }
}
