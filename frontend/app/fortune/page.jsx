'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FortunePage() {
  const router = useRouter();
  const [fortune, setFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFortune();
  }, []);

  const fetchFortune = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/public/fortune'
      );

      if (!response.ok) {
        throw new Error('운세를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setFortune(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    router.push('/service-intro');
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", Segoe UI, Roboto, Arial, sans-serif',
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
          color: '#2A2725',
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgba(191,167,255,0.95)] mx-auto mb-4"></div>
          <p className="text-[#6B6662]">오늘의 운세를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", Segoe UI, Roboto, Arial, sans-serif',
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
          color: '#2A2725',
        }}
      >
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-semibold text-[#2A2725] mb-2">오류가 발생했습니다</h2>
          <p className="text-[#6B6662] mb-6">{error}</p>
          <button
            onClick={fetchFortune}
            className="px-6 py-3 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-lg font-semibold hover:shadow-[0_10px_24px_rgba(123,203,255,0.25)] transition-all"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", Segoe UI, Roboto, Arial, sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        color: '#2A2725',
      }}
    >
      {/* Header */}
      <header className="py-6 px-4 border-b border-[rgba(230,224,218,0.8)] bg-[rgba(245,241,237,0.7)] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[rgba(191,167,255,0.95)]">Sayme</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Date Display */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-white/80 rounded-full shadow-sm border border-[#E6E0DA]">
            <p className="text-sm text-[#6B6662]">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Fortune Card */}
        <div className="bg-white/75 rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.08)] p-8 mb-8 border border-[#E6E0DA] backdrop-blur-sm">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="inline-block text-6xl">
              {fortune?.category === 'reflection' && '🌙'}
              {fortune?.category === 'gratitude' && '🙏'}
              {fortune?.category === 'growth' && '🌱'}
            </div>
          </div>

          {/* Category Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-block px-4 py-1 bg-[rgba(245,243,255,1)] text-[rgba(139,125,216,0.95)] text-sm font-medium rounded-full">
              {fortune?.category === 'reflection' && '성찰의 시간'}
              {fortune?.category === 'gratitude' && '감사의 시간'}
              {fortune?.category === 'growth' && '성장의 시간'}
            </span>
          </div>

          {/* Fortune Text */}
          <div className="mb-8">
            <p className="text-lg leading-relaxed text-[#2A2725] text-center">
              {fortune?.fortuneText}
            </p>
          </div>

          {/* Question */}
          <div className="bg-gradient-to-r from-[rgba(245,243,255,1)] to-[rgba(252,231,243,0.8)] rounded-xl p-6 border border-[rgba(230,224,218,0.9)]">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💭</div>
              <div>
                <h3 className="text-sm font-semibold text-[rgba(42,39,37,0.85)] mb-2">
                  오늘의 질문
                </h3>
                <p className="text-base text-[#2A2725]">
                  {fortune?.questionPrompt}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[rgba(191,167,255,0.85)] to-[rgba(123,203,255,0.85)] rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.08)] p-8 text-[#1f1f1f] text-center">
          <h2 className="text-2xl font-bold mb-3 text-[#1f1f1f]">
            본격적인 자기성찰을 시작해보세요
          </h2>
          <p className="text-[rgba(42,39,37,0.75)] mb-6 leading-relaxed">
            10일간 깊이 있는 질문으로<br />
            한 달을 더욱 의미있게 마무리하는 프리미엄 챌린지
          </p>
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-4 bg-white/85 text-[rgba(42,39,37,0.9)] rounded-xl font-semibold hover:bg-white transition-all transform hover:scale-105 shadow-lg"
          >
            서비스 알아보기 →
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">✨</div>
            <h4 className="font-semibold text-[#2A2725] mb-1">맞춤형 질문</h4>
            <p className="text-sm text-[#6B6662]">15분 상담으로 나만의 질문 설계</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="font-semibold text-[#2A2725] mb-1">10만원 환급</h4>
            <p className="text-sm text-[#6B6662]">정시 완주 시 전액 환급</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📄</div>
            <h4 className="font-semibold text-[#2A2725] mb-1">PDF 결산</h4>
            <p className="text-sm text-[#6B6662]">나만의 성찰 리포트</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[rgba(230,224,218,0.8)] mt-16">
        <div className="max-w-2xl mx-auto text-center text-sm text-[#8A8681]">
          <p>© 2024 Sayme. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
