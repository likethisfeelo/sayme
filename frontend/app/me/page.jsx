'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccessToken, clearTokens, fetchWithAuth } from '../utils/auth';
import QuestSection from '@/components/quest/QuestSection';

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    fetchUserInfo();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) return;

    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const groups = payload['cognito:groups'] || [];
      const adminEmails = ['dark.dduu@gmail.com'];
      const isAdmin = groups.includes('Admins') || adminEmails.includes(payload.email);
      setIsAdminUser(isAdmin);
    } catch (error) {
      console.error('Admin check error:', error);
    }
  };

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
        setUser(data.user);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Admin 링크 (관리자만 표시) */}
      {isAdminUser && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-3 px-4 text-center">
          <a 
            href="/admin/quest" 
            className="text-white font-medium hover:underline inline-flex items-center gap-2"
          >
            <span>⚙️</span>
            <span>Quest 관리 페이지</span>
          </a>
        </div>
      )}

      <header className="py-6 px-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            ← Sayme
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Quest 섹션 추가 */}
        <div className="mb-8">
          <QuestSection />
        </div>

        {/* 2025 회고 배너 */}
        {user && !user.retrospective2025Completed ? (
          <Link href="/me/retrospective" className="block mb-8 group">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl animate-fade-in cursor-pointer">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-float-delay-1" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                  2025년 어땠나요?
                </h2>
                <p className="text-xl text-white/90 mb-6 drop-shadow">
                  2026의 방향을 잘 설정해보아요.
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold group-hover:bg-white/30 transition-all">
                  <span>회고 시작하기</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="absolute top-4 right-4 text-white/30 text-6xl">✨</div>
              <div className="absolute bottom-4 left-4 text-white/30 text-5xl">💫</div>
            </div>
          </Link>
        ) : user?.retrospective2025Completed ? (
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-300 to-gray-400 p-8 shadow-lg opacity-60 cursor-not-allowed">
              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                  2025년 어땠나요?
                </h2>
                <p className="text-xl text-white/90 mb-4 drop-shadow">
                  2026의 방향을 잘 설정해보아요.
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/40 backdrop-blur-sm rounded-full text-white font-semibold">
                  <span>✅ 완료됨</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* 2025 돌아보기 배너 */}
        {user && !user.review2025Completed ? (
          <Link href="/me/review2025" className="block mb-8 group">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl animate-fade-in cursor-pointer">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-float-delay-1" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                  2025년, 당신의 이야기
                </h2>
                <p className="text-xl text-white/90 mb-6 drop-shadow">
                  힘들었던 순간, 노력했던 순간,
                  <br />
                  그리고 행복했던 순간들을 돌아봐요
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold group-hover:bg-white/30 transition-all">
                  <span>돌아보기 시작</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="absolute top-4 right-4 text-white/30 text-6xl">🗓️</div>
              <div className="absolute bottom-4 left-4 text-white/30 text-5xl">✨</div>
            </div>
          </Link>
        ) : user?.review2025Completed ? (
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-300 to-gray-400 p-8 shadow-lg opacity-60 cursor-not-allowed">
              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                  2025년, 당신의 이야기
                </h2>
                <p className="text-xl text-white/90 mb-4 drop-shadow">
                  힘들었던 순간, 노력했던 순간,
                  <br />
                  그리고 행복했던 순간들을 돌아봐요
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/40 backdrop-blur-sm rounded-full text-white font-semibold">
                  <span>✅ 완료됨</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">내 정보</h1>

          {user && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">이메일</div>
                <div className="col-span-2 text-gray-900">{user.email}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">이름</div>
                <div className="col-span-2 text-gray-900">{user.name || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">닉네임</div>
                <div className="col-span-2 text-gray-900">{user.nickname || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">이메일 인증</div>
                <div className="col-span-2">
                  {user.emailVerified ? (
                    <span className="text-green-600">✅ 인증됨</span>
                  ) : (
                    <span className="text-red-600">❌ 미인증</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">생년월일</div>
                <div className="col-span-2 text-gray-900">{user.birthDate || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">출생 국가</div>
                <div className="col-span-2 text-gray-900">{user.birthCountry || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">출생 도시</div>
                <div className="col-span-2 text-gray-900">{user.birthCity || '-'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">마지막 로그인</div>
                <div className="col-span-2 text-gray-900">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">사전 설문</div>
                <div className="col-span-2 flex items-center gap-3">
                  {user.preSurveyCompleted ? (
                    <span className="text-green-600">✅ 완료</span>
                  ) : (
                    <>
                      <span className="text-gray-600">❌ 미완료</span>
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

              <div className="grid grid-cols-3 gap-4 py-3 border-b">
                <div className="font-semibold text-gray-700">할인권</div>
                <div className="col-span-2 text-gray-900">{user.discountCount || 0}개</div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3">
                <div className="font-semibold text-gray-700">리마인더</div>
                <div className="col-span-2 text-gray-900">{user.reminderTime || '-'}</div>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => router.push('/fortune')}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              오늘의 운세
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              로그아웃
            </button>
          </div>

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