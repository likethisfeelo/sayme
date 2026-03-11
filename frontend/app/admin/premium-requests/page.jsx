'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import { clearTokens, getAccessToken } from '@/app/utils/auth';
import { isAdmin } from '@/lib/auth/checkAdmin';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const decodeJwtPayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1] || ''));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
};

const getAdminAuthHeaderCandidates = () => {
  if (typeof window === 'undefined') return [];

  const idToken = localStorage.getItem('idToken');
  const accessToken = getAccessToken();

  const tokenEntries = [
    { token: accessToken, label: 'access' },
    { token: idToken, label: 'id' },
  ].filter(({ token }) => token && !isTokenExpired(token));

  const candidates = tokenEntries.flatMap(({ token }) => [
    `Bearer ${token}`,
    token,
  ]);

  return [...new Set(candidates)];
};

export default function AdminPremiumRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const authHeaders = getAdminAuthHeaderCandidates();
      if (!authHeaders.length) {
        clearTokens();
        router.push('/login');
        return;
      }

      let response;
      for (const authorization of authHeaders) {
        response = await fetch(`${API_BASE}/premium-registration/admin`, {
          headers: {
            Authorization: authorization,
          },
        });

        if (response.status !== 401) break;
      }

      if (response.status === 401) {
        clearTokens();
        router.push('/login');
        throw new Error('관리자 인증이 만료되었습니다. 다시 로그인해 주세요.');
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || '신청 목록을 불러오지 못했습니다.');
      }

      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
      setError(err.message || '신청 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/me');
      return;
    }

    fetchRequests();
  }, [fetchRequests, router]);

  const sourceLabel = useMemo(
    () => ({
      hinewmember: '기존 /hinewmember',
      hinewmember02: '신규 /hinewmember02',
      premium_inactive_home: '재참여 홈 /premium-inactive-home',
      unknown: '출처 미기록',
    }),
    []
  );

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
      }}
    >
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
        <Header subtitle="프리미엄 신청 목록" showBackButton onBack={() => router.push('/admin')} />

        <main className="flex-1 px-4 py-4 pb-8 space-y-3">
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-sm font-bold text-[#2A2725]">정회원 전환 신청</h1>
              <button
                onClick={fetchRequests}
                className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.1)] text-[rgba(99,102,241,1)]"
              >
                새로고침
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-[#6B6662]">불러오는 중...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <p className="text-xs text-[#6B6662]">총 {requests.length}건</p>
            )}
          </section>

          {!loading && !error && requests.map((req) => (
            <section key={req.userId} className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-semibold text-[#2A2725]">{req.name || req.nickname || '이름 없음'}</div>
                  <div className="text-xs text-[#6B6662]">{req.email || '-'}</div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-[rgba(99,102,241,0.12)] text-[rgba(99,102,241,1)]">
                  {sourceLabel[req.premiumRequestSource] || req.premiumRequestSource}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#2A2725]">
                <div>연락처: {req.phoneNumber || '-'}</div>
                <div>성별: {req.gender || '-'}</div>
                <div>생년월일: {req.birthDate || '-'}</div>
                <div>출생도시: {req.birthCity || '-'}</div>
                <div>
                  태어난 시간: {req.birthTime || '-'}
                </div>
                <div>
                  시간 인지: {req.birthTimeCertainty === 'approximate' ? '대략 알고있음' : '전혀 모름'}
                </div>
                <div>
                  마케팅 동의: {req.marketingConsent ? '예' : '아니오'}
                </div>
                <div>
                  신청시각: {req.premiumRequestedAt ? new Date(req.premiumRequestedAt).toLocaleString('ko-KR') : '-'}
                </div>
              </div>
            </section>
          ))}

          {!loading && !error && requests.length === 0 && (
            <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 text-center text-sm text-[#6B6662]">
              현재 접수된 프리미엄 신청이 없습니다.
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
