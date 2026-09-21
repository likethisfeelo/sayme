// 분석 리포트 신청 API 클라이언트
// 백엔드: backend/lambda/analysis-request (API Gateway /analysis-request/{proxy+})
import { getAccessToken } from '@/app/utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';
const BASE = `${API_BASE_URL}/analysis-request`;

const decodeJwtPayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1] || ''));
  } catch {
    return null;
  }
};

const isExpired = (token) => {
  const p = decodeJwtPayload(token);
  return !!p?.exp && p.exp * 1000 <= Date.now();
};

/** id 토큰(이메일 포함) 우선, 없으면 access 토큰 */
export const getAnalysisAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const idToken = localStorage.getItem('idToken');
  const accessToken = getAccessToken();
  const candidates = [idToken, accessToken].filter((t) => t && !isExpired(t));
  return candidates[0] || null;
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAnalysisAuthToken();
    if (!token) throw new ApiError('로그인이 필요합니다.', 401, null);
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });

  if (raw) {
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ApiError(text || `요청 실패 (${res.status})`, res.status, null);
    }
    return res;
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok || (data && data.success === false)) {
    throw new ApiError(data?.error || data?.message || `요청 실패 (${res.status})`, res.status, data);
  }
  return data;
}

// ----- 사용자 -----
export const analysisUserApi = {
  submit: (payload) => request('', { method: 'POST', body: payload }),
  listMine: () => request('/mine'),
  get: (requestId) => request(`/${encodeURIComponent(requestId)}`),
  /** 이메일 링크(토큰) 조회: 로그인 불필요 */
  getReportByToken: (requestId, token) =>
    request(`/${encodeURIComponent(requestId)}/report?token=${encodeURIComponent(token)}`, { auth: false }),
};

// ----- 관리자 -----
export const analysisAdminApi = {
  list: (status) => request(`/admin${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  get: (requestId) => request(`/admin/${encodeURIComponent(requestId)}`),
  /** status 를 생략하면 adminNote 만 저장 (상태 변경 없음) */
  updateStatus: (requestId, status, adminNote) =>
    request(`/admin/${encodeURIComponent(requestId)}/status`, {
      method: 'PUT',
      body: { ...(status ? { status } : {}), ...(adminNote !== undefined ? { adminNote } : {}) },
    }),
  saveNote: (requestId, adminNote) =>
    request(`/admin/${encodeURIComponent(requestId)}/status`, { method: 'PUT', body: { adminNote } }),
  saveReport: (requestId, { reportTitle, reportHtml }) =>
    request(`/admin/${encodeURIComponent(requestId)}/report`, { method: 'PUT', body: { reportTitle, reportHtml } }),
  send: (requestId, body = {}) => request(`/admin/${encodeURIComponent(requestId)}/send`, { method: 'POST', body }),
  remove: (requestId) => request(`/admin/${encodeURIComponent(requestId)}`, { method: 'DELETE' }),
  /** CSV 다운로드 (Blob 반환) */
  exportCsv: async (status) => {
    const res = await request(`/admin/export${status ? `?status=${encodeURIComponent(status)}` : ''}`, { raw: true });
    return res.blob();
  },
};

/** Blob 을 파일로 저장 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
