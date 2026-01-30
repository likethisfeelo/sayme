﻿'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearTokens, fetchWithAuth, getAccessToken, getIdTokenPayload } from '../utils/auth';

export default function MyProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [homePath, setHomePath] = useState('/');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetchWithAuth(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/me'
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const loadedUser = data.user;
        setUser(loadedUser);

        const paymentStatus = (loadedUser.paymentStatus || '').toLowerCase();
        const tokenPayload = getIdTokenPayload();
        const cognitoGroups = tokenPayload?.['cognito:groups'] || [];
        const isPremium =
          loadedUser.preSurveyCompleted ||
          paymentStatus === 'completed' ||
          paymentStatus === 'premium' ||
          cognitoGroups.includes('premium');

        setHomePath(isPremium ? '/premium-home' : '/trial-home');
      } else {
        setError('사용자 정보를 불러올 수 없습니다.');
        if (response.status === 401) {
          clearTokens();
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('사용자 정보 로드 에러:', err);
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  const handleKakaoConsult = () => {
    window.open('https://pf.kakao.com/_xjwsxfb/chat', '_blank');
  };

  const handleLogoClick = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.push('/');
      return;
    }
    router.push(homePath || '/');
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6662]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        }}
      >
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        color: '#2A2725',
      }}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex flex-col gap-0.5 leading-none text-left"
            aria-label="메인으로 이동"
          >
            <span className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
              Sayme · Spirit Lab
            </span>
            <span className="text-xs text-[#6B6662]">멘탈 PT 플랫폼</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleLogoClick}
              className="text-xs px-3 py-2 text-[#2A2725] hover:text-[rgba(191,167,255,0.95)] transition-colors font-medium"
            >
              홈으로
            </button>
            <button
              onClick={handleLogout}
              className="text-xs px-4 py-2 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-full font-bold transition-transform active:scale-95"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-4 py-8">
        <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <h1 className="text-lg font-bold text-[#2A2725] mb-5">내 정보</h1>
          {user && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">이메일</div>
                <div className="col-span-2 text-[#2A2725]">{user.email}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">이름</div>
                <div className="col-span-2 text-[#2A2725]">{user.name || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">닉네임</div>
                <div className="col-span-2 text-[#2A2725]">{user.nickname || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">이메일 인증</div>
                <div className="col-span-2">
                  {user.emailVerified ? (
                    <span className="text-green-600">✅ 인증됨</span>
                  ) : (
                    <span className="text-red-600">❌ 미인증</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">생년월일</div>
                <div className="col-span-2 text-[#2A2725]">{user.birthDate || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">출생 국가</div>
                <div className="col-span-2 text-[#2A2725]">{user.birthCountry || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">출생 도시</div>
                <div className="col-span-2 text-[#2A2725]">{user.birthCity || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">마지막 로그인</div>
                <div className="col-span-2 text-[#2A2725]">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">사전 설문</div>
                <div className="col-span-2 flex items-center gap-3">
                  {user.preSurveyCompleted ? (
                    <span className="text-green-600">✅ 완료</span>
                  ) : (
                    <>
                      <span className="text-[#6B6662]">❌ 미완료</span>
                      <button
                        onClick={handleKakaoConsult}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
                      >
                        💬 사전 설문 상담 신청
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b border-[rgba(230,224,218,0.7)]">
                <div className="font-semibold text-[#6B6662]">할인권</div>
                <div className="col-span-2 text-[#2A2725]">{user.discountCount || 0}개</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3">
                <div className="font-semibold text-[#6B6662]">리마인더</div>
                <div className="col-span-2 text-[#2A2725]">{user.reminderTime || '-'}</div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ℹ️ <strong>읽기 전용 페이지입니다.</strong> 정보 수정 기능은 추후 추가될 예정입니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
