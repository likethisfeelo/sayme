'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, clearTokens } from './utils/auth';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로그인 상태 확인
    const token = getAccessToken();
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    clearTokens();
    setIsLoggedIn(false);
    alert('로그아웃 되었습니다.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 relative overflow-hidden">
      {/* 파스텔 입자 배경 효과 (RETRO 스타일) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pastel-pink/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/4 right-20 w-40 h-40 bg-pastel-purple/20 rounded-full blur-3xl animate-float-delay-1" />
        <div className="absolute bottom-1/4 left-1/4 w-36 h-36 bg-pastel-blue/20 rounded-full blur-3xl animate-float-delay-2" />
        <div className="absolute bottom-20 right-1/4 w-44 h-44 bg-pastel-peach/15 rounded-full blur-3xl animate-float" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 py-6 px-4 border-b border-pastel-purple/20 bg-white/60 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pastel-purple to-pastel-blue bg-clip-text text-transparent cursor-pointer"
              onClick={() => router.push('/')}>
            Sayme
          </h1>
          
          {loading ? (
            <div className="flex gap-3">
              <div className="w-20 h-10 bg-gray-200 animate-pulse rounded"></div>
              <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-full"></div>
            </div>
          ) : isLoggedIn ? (
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/me')}
                className="px-4 py-2 text-gray-700 hover:text-pastel-purple transition-colors"
              >
                내 정보
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
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
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20 text-center">
        <div className="mb-4 md:mb-6">
          <span className="inline-block px-4 md:px-6 py-2 md:py-3 bg-pastel-lavender/30 text-pastel-purple text-xs md:text-sm font-semibold rounded-full border border-pastel-purple/20">
            WELCOME 2026
          </span>
        </div>

        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-2">
          10일간 나와의 대화로<br />
          <span className="bg-gradient-to-r from-pastel-purple via-pastel-pink to-pastel-blue bg-clip-text text-transparent">
            일년을 결산하고
          </span><br />
          <span className="text-gray-700 text-2xl md:text-4xl lg:text-5xl">
            새롭게 더 나다운<br className="md:hidden" /> 2026을 준비해요.
          </span>
        </h2>

        <p className="text-base md:text-xl text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
          맞춤형 질문과 기록하는<br className="md:hidden" /> 프리미엄 자기성찰 경험.<br />
          나를 이해하고, 성장하며,<br className="md:hidden" /> 감사를 발견하는 시간.
        </p>

        <div className="flex flex-col gap-3 md:gap-4 justify-center mb-6 md:mb-8 px-4">
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/me')}
              className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-pastel-purple via-pastel-pink to-pastel-blue text-white rounded-2xl font-semibold hover:shadow-2xl transition-all transform hover:scale-105 text-base md:text-lg"
            >
              내 정보로 이동 →
            </button>
          ) : (
            <button
              onClick={() => router.push('/signup')}
              className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-pastel-purple via-pastel-pink to-pastel-blue text-white rounded-2xl font-semibold hover:shadow-2xl transition-all transform hover:scale-105 text-base md:text-lg"
            >
              지금 시작하기 →
            </button>
          )}
          <button
            onClick={() => router.push('/fortune')}
            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-white/80 backdrop-blur-sm text-pastel-purple border-2 border-pastel-purple/30 rounded-2xl font-semibold hover:bg-pastel-purple/10 transition-all text-base md:text-lg"
          >
            오늘의 운세 보기
          </button>
        </div>

        <p className="text-xs md:text-sm text-gray-600 px-4">
          기간 내 완주 시 <span className="font-semibold text-pastel-purple">10만원 전액 환급</span>
        </p>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-16">
          어떻게 진행되나요?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Step 1 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-lg border border-pastel-purple/20 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pastel-pink to-pastel-purple rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-md">
              <span className="text-xl md:text-2xl font-bold text-white">1</span>
            </div>
            <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
              15분 개인 상담
            </h4>
            <p className="text-gray-600 leading-relaxed text-sm">
              1:1 온라인 상담으로 당신의 고민과 관심사를 반영한 맞춤형 질문을 설계합니다
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-lg border border-pastel-blue/20 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pastel-blue to-pastel-sky rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-md">
              <span className="text-xl md:text-2xl font-bold text-white">2</span>
            </div>
            <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
              10일간의 챌린지
            </h4>
            <p className="text-gray-600 leading-relaxed text-sm">
              매일 하나씩 열리는 질문에 텍스트 또는 음성으로 답합니다.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-lg border border-pastel-peach/20 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pastel-peach to-pastel-pink rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-md">
              <span className="text-xl md:text-2xl font-bold text-white">3</span>
            </div>
            <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
              최종 분석 리포트
            </h4>
            <p className="text-gray-600 leading-relaxed text-sm">
              당신의 성장과 변화를 담은 PDF 결산 및 2026 예측 리포트를 받습니다.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-lg border border-pastel-mint/20 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pastel-mint to-pastel-blue rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-md">
              <span className="text-xl md:text-2xl font-bold text-white">4</span>
            </div>
            <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
              1:1 상담 15분
            </h4>
            <p className="text-gray-600 leading-relaxed text-sm">
              최종 분석 리포트와 함께 2026의 방향을 대화하는 1:1 상담으로 마무리합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-pastel-purple via-pastel-pink to-pastel-blue rounded-3xl p-12 text-white text-center shadow-2xl relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-6">
              2025결산 Sayme Final 신청 접수 중
            </div>
            
            <h3 className="text-4xl font-bold mb-4">
              연간 결산 프로그램
            </h3>
            <p className="text-white/90 mb-8 text-lg">
              결산 이후에는 월간 서비스로 변경됩니다.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
              <div className="text-6xl font-bold mb-2">200,000원</div>
              <p className="text-white/90 text-lg mb-4">
                연간 결산 챌린지 참가비
              </p>
              <div className="inline-block bg-white/90 text-pastel-purple px-6 py-3 rounded-full text-sm font-bold">
                기간 내 완주 시 10만원 환급 = 실질 10만원 참여
              </div>
            </div>

            <button
              onClick={() => router.push(isLoggedIn ? '/me' : '/signup')}
              className="w-full sm:w-auto px-12 py-4 bg-white text-pastel-purple rounded-2xl font-bold hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg text-lg"
            >
              {isLoggedIn ? '내 정보로 이동 →' : '지금 시작하기 →'}
            </button>

            <p className="text-white/80 text-sm mt-6">
              입금 후 15분 상담 예약 • 상담 완료 후 챌린지 시작
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          지금 시작하는<br className="sm:hidden" /> 나만의 성찰 시간
        </h3>
        <p className="text-xl text-gray-600 mb-10">
          오늘의 운세를 먼저 확인해보세요
        </p>
        <button
          onClick={() => router.push('/fortune')}
          className="px-10 py-4 bg-gradient-to-r from-pastel-purple via-pastel-pink to-pastel-blue text-white rounded-2xl font-semibold hover:shadow-2xl transition-all transform hover:scale-105 text-lg"
        >
          오늘의 운세 보기 →
        </button>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-pastel-purple/20 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h4 className="text-xl font-bold bg-gradient-to-r from-pastel-purple to-pastel-blue bg-clip-text text-transparent mb-2">
                Sayme
              </h4>
              <p className="text-sm text-gray-600">
                연간/월간 자기성찰 챌린지 플랫폼
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">
                © 2024-2025 Sayme. All rights reserved.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                spirit-lab.me
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}