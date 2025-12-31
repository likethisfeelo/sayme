'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, clearTokens, fetchWithAuth } from '../utils/auth';

export default function Header({ showAuthButtons = true }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const token = getAccessToken();
    
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    // 사용자 이름 가져오기
    try {
      const response = await fetchWithAuth(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/me'
      );
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUserName(data.user.name || data.user.nickname || data.user.email.split('@')[0]);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    setIsLoggedIn(false);
    setUserName('');
    router.push('/login');
  };

  const handleConsultation = () => {
    window.open('https://pf.kakao.com/_xjwsxfb/chat', '_blank');
  };

  return (
    <nav className="relative z-50 py-6 px-4 border-b border-pastel-purple/20 bg-white/60 backdrop-blur-sm sticky top-0">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <button
          onClick={() => router.push('/')}
          className="text-2xl font-bold bg-gradient-to-r from-pastel-purple to-pastel-blue bg-clip-text text-transparent hover:scale-105 transition-transform cursor-pointer"
        >
          Sayme
        </button>

        <div className="flex gap-3 items-center">
          {/* 1:1 상담신청 버튼 (항상 표시) */}
          <button
            onClick={handleConsultation}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <span>💬</span>
            <span className="hidden sm:inline">1:1 상담신청</span>
            <span className="sm:hidden">상담</span>
          </button>

          {showAuthButtons && (
            <>
              {loading ? (
                <>
                  <div className="w-20 h-10 bg-gray-200 animate-pulse rounded"></div>
                  <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-full"></div>
                </>
              ) : isLoggedIn ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">{userName}</span>
                    <span className="text-sm text-gray-500">님</span>
                  </div>
                  <button
                    onClick={() => router.push('/me')}
                    className="px-4 py-2 text-pastel-purple hover:text-pastel-purple/80 font-semibold transition-colors"
                  >
                    MY PAGE
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 text-gray-700 hover:text-pastel-purple transition-colors"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => router.push('/signup')}
                    className="px-6 py-2 bg-gradient-to-r from-pastel-purple to-pastel-blue text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    시작하기
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}