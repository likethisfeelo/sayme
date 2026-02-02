'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

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
    router.push('/introduction_premium');
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        }}
      >
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-semibold text-[#2A2725] mb-2">오류가 발생했습니다</h2>
          <p className="text-[#6B6662] mb-6">{error}</p>
          <button
            onClick={fetchFortune}
            className="px-6 py-3 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] font-[650] rounded-[14px] transition-transform active:scale-[0.98]"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-[430px] mx-auto min-h-screen flex flex-col"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", Segoe UI, Roboto, Arial, sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        color: '#2A2725',
      }}
    >
      <Header subtitle="오늘의 운세" maxWidthClass="max-w-[430px]" />

      <main className="px-4 py-3.5 flex flex-col gap-3.5">
        {/* Date Display */}
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-[#E6E0DA]">
            <p className="text-xs text-[#6B6662] m-0">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Fortune Card */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          <div className="p-4">
            {/* Icon */}
            <div className="text-center mb-4">
              <div className="inline-block text-5xl">
                {fortune?.category === 'reflection' && '🌙'}
                {fortune?.category === 'gratitude' && '🙏'}
                {fortune?.category === 'growth' && '🌱'}
              </div>
            </div>

            {/* Category Badge */}
            <div className="flex justify-center mb-4">
              <span className="inline-block px-3.5 py-1.5 text-xs font-[650] rounded-full border border-[rgba(191,167,255,0.35)] text-[#6B6662] bg-[rgba(191,167,255,0.12)]">
                {fortune?.category === 'reflection' && '성찰의 시간'}
                {fortune?.category === 'gratitude' && '감사의 시간'}
                {fortune?.category === 'growth' && '성장의 시간'}
              </span>
            </div>

            {/* Fortune Text */}
            <p className="text-base leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight text-center m-0 mb-4">
              {fortune?.fortuneText}
            </p>

            {/* Question */}
            <div className="bg-gradient-to-br from-[rgba(191,167,255,0.15)] via-[rgba(123,203,255,0.12)] to-[rgba(255,193,217,0.10)] rounded-[14px] p-4 border border-[rgba(230,224,218,0.85)]">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💭</div>
                <div>
                  <h3 className="text-xs font-[750] tracking-tight text-[#2A2725] mb-1.5 m-0">
                    오늘의 질문
                  </h3>
                  <p className="text-sm text-[rgba(42,39,37,0.92)] leading-[1.55] tracking-tight m-0">
                    {fortune?.questionPrompt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          <div className="p-4 text-center">
            <h2 className="text-base font-[750] tracking-tight text-[#2A2725] mb-2">
              내게 맞춘 우주의 흐름을 받아보세요!
            </h2>
            <p className="text-[13px] text-[#6B6662] leading-[1.65] mb-4 m-0">
              깊이 있는 질문으로 나다움에 대해<br />
              생각하는 시간을 함께 만들어드립니다.
            </p>
            <button
              onClick={handleStart}
              className="w-full appearance-none border-0 cursor-pointer rounded-[14px] px-3.5 py-3 font-[650] text-sm tracking-tight inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] text-[#1f1f1f] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] shadow-[0_10px_22px_rgba(123,203,255,0.18)]"
            >
              서비스 알아보기 →
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 mt-8">
        <div className="text-center text-xs text-[#6B6662]">
          <p className="m-0">© 2024 Sayme. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
