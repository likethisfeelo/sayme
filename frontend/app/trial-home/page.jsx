'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../utils/auth';

export default function TrialHomePage() {
  const router = useRouter();
  const [todayFortune, setTodayFortune] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTodayFortune();
  }, [router]);

  const fetchTodayFortune = async () => {
    try {
      const response = await fetch(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/public/fortune'
      );
      const data = await response.json();
      if (data.success) {
        setTodayFortune(data.fortune);
      }
    } catch (error) {
      console.error('Fortune fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
      background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
    }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
          <div className="flex flex-col gap-0.5 leading-none">
            <div className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
              Sayme · Spirit Lab
            </div>
            <div className="text-xs text-[#6B6662]">Trial · 체험 홈</div>
          </div>
          
          <button 
            onClick={() => router.push('/me')}
            className="w-[34px] h-[34px] rounded-[10px] border border-[#E6E0DA] bg-white/65 grid place-items-center cursor-pointer"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-[86px] flex flex-col gap-4 max-w-[430px] mx-auto">
        
        {/* Welcome Message */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
          <h2 className="text-2xl font-bold text-[#2A2725] mb-3 font-serif">
            환영합니다! 👋
          </h2>
          <p className="text-[#6B6662] leading-relaxed mb-4">
            Spirit Lab의 일부 콘텐츠를 체험해보세요.
            <br />
            프리미엄 회원이 되시면 모든 기능을 이용하실 수 있습니다.
          </p>
          <button
            onClick={() => router.push('/payment')}
            className="w-full px-4 py-3 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold"
          >
            프리미엄 시작하기 →
          </button>
        </section>

        {/* Today's Fortune */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
            <div className="text-sm font-[750] text-[#2A2725]">오늘의 운세</div>
            <div className="text-xs text-[#6B6662]">매일 업데이트</div>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#6B6662] text-sm">로딩 중...</p>
            </div>
          ) : todayFortune ? (
            <div className="p-4">
              <p className="text-[#2A2725] leading-relaxed whitespace-pre-line">
                {todayFortune.fortuneText}
              </p>
              {todayFortune.questionPrompt && (
                <div className="mt-4 p-3 bg-[rgba(191,167,255,0.1)] rounded-xl">
                  <p className="text-sm font-semibold text-[#2A2725] mb-1">💭 오늘의 질문</p>
                  <p className="text-sm text-[#6B6662]">{todayFortune.questionPrompt}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-[#6B6662]">운세를 불러올 수 없습니다.</p>
            </div>
          )}
        </section>

        {/* Trial Questions */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
            <div className="text-sm font-[750] text-[#2A2725]">체험 질문</div>
            <div className="text-xs text-[#6B6662]">2개의 샘플 질문</div>
          </div>
          
          <div className="p-3 flex flex-col gap-2">
            <div className="bg-white/75 border border-[rgba(230,224,218,0.9)] rounded-[14px] p-4">
              <div className="text-xs text-[#6B6662] mb-2">체험 질문 1</div>
              <p className="text-sm font-semibold text-[#2A2725] mb-3">
                오늘 하루 중 가장 기억에 남는 순간은?
              </p>
              <button className="w-full px-3 py-2 bg-[#2A2725] text-white rounded-xl text-sm">
                답변 작성하기 →
              </button>
            </div>

            <div className="bg-white/75 border border-[rgba(230,224,218,0.9)] rounded-[14px] p-4">
              <div className="text-xs text-[#6B6662] mb-2">체험 질문 2</div>
              <p className="text-sm font-semibold text-[#2A2725] mb-3">
                올해 나에게 가장 큰 변화는 무엇이었나요?
              </p>
              <button className="w-full px-3 py-2 bg-[#2A2725] text-white rounded-xl text-sm">
                답변 작성하기 →
              </button>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-[rgba(191,167,255,0.05)]">
            <p className="text-xs text-[#6B6662] text-center">
              ℹ️ 체험 질문 답변은 저장되지 않습니다
            </p>
          </div>
        </section>

        {/* Analysis Request CTA */}
        <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(255,193,217,0.18)] to-[rgba(123,203,255,0.15)] border border-[#E6E0DA] rounded-[18px] p-6">
          <h3 className="text-lg font-bold text-[#2A2725] mb-2">
            전문 분석 서비스 받기
          </h3>
          <p className="text-sm text-[#6B6662] mb-4 leading-relaxed">
            프리미엄 회원이 되시면 1:1 맞춤 상담과
            <br />
            매달 개인화된 질문 및 분석 리포트를 받으실 수 있습니다.
          </p>
          <button
            onClick={() => router.push('/payment')}
            className="w-full px-4 py-3 bg-[#2A2725] text-white rounded-[14px] font-bold"
          >
            프리미엄 신청하기 →
          </button>
        </section>

        {/* Retrospective/Review Banners */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
          <h3 className="text-lg font-bold text-[#2A2725] mb-3">
            2025 돌아보기
          </h3>
          <p className="text-sm text-[#6B6662] mb-4">
            연말 회고 및 돌아보기 콘텐츠는 모든 회원에게 제공됩니다.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/me/retrospective')}
              className="flex-1 px-4 py-2.5 bg-white border border-[#E6E0DA] text-[#2A2725] rounded-xl text-sm font-semibold"
            >
              회고하기
            </button>
            <button
              onClick={() => router.push('/me/review2025')}
              className="flex-1 px-4 py-2.5 bg-white border border-[#E6E0DA] text-[#2A2725] rounded-xl text-sm font-semibold"
            >
              돌아보기
            </button>
          </div>
        </section>

      </main>

      {/* Bottom Nav */}
      <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-[rgba(245,241,237,0.78)] backdrop-blur-[14px] border-t border-[rgba(230,224,218,0.9)] px-2.5 py-2.5 pb-3 z-20">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => router.push('/trial-home')}
            className="flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px] border border-[rgba(191,167,255,0.35)] bg-white/45"
          >
            <div className="w-[34px] h-7 rounded-xl grid place-items-center text-sm bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.92)] text-[rgba(31,31,31,0.92)]">
              ●
            </div>
            <div className="text-[11px] text-[rgba(42,39,37,0.92)] font-bold">홈</div>
          </button>

          <button
            onClick={() => router.push('/fortune')}
            className="flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px]"
          >
            <div className="w-[34px] h-7 rounded-xl grid place-items-center text-sm bg-white/55 border border-[rgba(230,224,218,0.9)]">
              ✦
            </div>
            <div className="text-[11px] text-[rgba(42,39,37,0.70)]">운세</div>
          </button>

          <button
            onClick={() => router.push('/me')}
            className="flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px]"
          >
            <div className="w-[34px] h-7 rounded-xl grid place-items-center text-sm bg-white/55 border border-[rgba(230,224,218,0.9)]">
              ☺
            </div>
            <div className="text-[11px] text-[rgba(42,39,37,0.70)]">나</div>
          </button>
        </div>
      </nav>
    </div>
  );
}