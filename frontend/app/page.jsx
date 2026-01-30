'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, getIdTokenPayload } from './utils/auth';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    const token = getAccessToken();
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/me',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const user = data.user;
        // 프리미엄 판단 조건 (실제 DB 구조에 맞게 수정)
        const paymentStatus = (user.paymentStatus || '').toLowerCase();
        const tokenPayload = getIdTokenPayload();
        const cognitoGroups = tokenPayload?.['cognito:groups'] || [];
        const isPremium =
          user.preSurveyCompleted ||
          paymentStatus === 'completed' ||
          paymentStatus === 'premium' ||
          cognitoGroups.includes('premium');
        
        if (isPremium) {
          router.push('/premium-home');
        } else {
          router.push('/trial-home');
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
        background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
      }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6662]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
      background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
      color: '#2A2725',
    }}>
      
      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
          <div className="flex flex-col gap-0.5 leading-none">
            <div className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
              Sayme · Spirit Lab
            </div>
            <div className="text-xs text-[#6B6662]">멘탈 PT 플랫폼</div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => router.push('/login')}
              className="text-xs px-3 py-2 text-[#2A2725] hover:text-[rgba(191,167,255,0.95)] transition-colors font-medium"
            >
              로그인
            </button>
            <button 
              onClick={() => router.push('/signup')}
              className="text-xs px-4 py-2 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-full font-bold transition-transform active:scale-95"
            >
              시작하기
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-12 max-w-[430px] mx-auto">
        
        {/* Hero Section */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-6 relative overflow-hidden">
            
            {/* Background decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[rgba(191,167,255,0.2)] rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[rgba(255,193,217,0.2)] rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="inline-block px-3 py-1.5 bg-white/40 backdrop-blur-sm rounded-full text-xs font-semibold text-[rgba(191,167,255,0.95)] border border-[rgba(191,167,255,0.2)] mb-4">
                WELCOME 2026
              </div>

              <h1 className="text-2xl font-bold text-[#2A2725] mb-3 leading-tight">
                지금, 나에게 필요한<br />
                <span className="bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] bg-clip-text text-transparent">
                  질문을 만나는 시간
                </span>
              </h1>

              <p className="text-sm text-[#6B6662] mb-5 leading-relaxed">
                사주와 점성술을 바탕으로<br />
                질문, 기록, 분석을 통해<br />
                당신만의 선택 기준을 만드는 <span className="font-semibold text-[#2A2725]">멘탈 PT</span>
              </p>

              <button
                onClick={() => router.push('/signup')}
                className="w-full py-3.5 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-sm shadow-[0_10px_22px_rgba(123,203,255,0.18)] transition-transform active:scale-98"
              >
                지금 시작하기 →
              </button>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">어떻게 진행되나요?</h2>
          
          <div className="space-y-3">
            {[
              {
                number: '1',
                title: '상태를 듣습니다',
                desc: '당신의 현재 상태, 목표, 불안을 먼저 듣고\n사주와 점성술로 구조를 읽어냅니다',
                gradient: 'from-[rgba(232,223,245,0.3)] to-[rgba(212,237,228,0.3)]',
              },
              {
                number: '2',
                title: '주제를 설계합니다',
                desc: '이번 달 당신에게 필요한\n단 하나의 주제를 함께 정합니다',
                gradient: 'from-[rgba(255,232,214,0.3)] to-[rgba(244,227,229,0.3)]',
              },
              {
                number: '3',
                title: '기록이 쌓입니다',
                desc: '설계된 질문에 답하고 기록합니다\n의도적으로 생각하는 시간',
                gradient: 'from-[rgba(212,237,228,0.3)] to-[rgba(227,238,248,0.3)]',
              },
              {
                number: '4',
                title: '기준이 남습니다',
                desc: '답변을 구조화한 분석 리포트 제공\n이후 선택의 기준으로 반복 활용',
                gradient: 'from-[rgba(244,227,229,0.3)] to-[rgba(232,223,245,0.3)]',
              },
            ].map((step, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-br ${step.gradient} bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-4`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[rgba(191,167,255,0.3)] to-[rgba(123,203,255,0.3)] flex items-center justify-center border border-white/50">
                    <span className="text-lg font-bold text-[#2A2725]">{step.number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-[#2A2725] mb-1">{step.title}</h3>
                    <p className="text-xs text-[#6B6662] leading-relaxed whitespace-pre-line">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why You Need This */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">이런 분들에게 필요합니다</h2>
          
          <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5 space-y-3">
            {[
              '생각은 깊은데 방향 정리할 시간 없는 분',
              '중요한 선택 앞에서 확신이 필요한 분',
              '혼자 하면 흐트러지는 걸 함께 정리하고 싶은 분',
              '사주에 관심 있지만 비의존적 해석을 원하는 분',
            ].map((text, index) => (
              <div key={index} className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[rgba(169,180,160,0.2)] flex items-center justify-center mt-0.5">
                  <span className="text-xs text-[rgba(169,180,160,0.95)]">✓</span>
                </div>
                <p className="text-sm text-[#2A2725] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">참여 구조</h2>
          
          <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
            <div className="text-center mb-5">
              <div className="text-3xl font-bold text-[#2A2725] mb-1">
                월 100,000원
              </div>
              <p className="text-xs text-[#6B6662]">
                월 단위 구독형 (1:1 멘탈 PT)
              </p>
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(230,224,218,0.5)]">
                <span className="text-sm text-[#6B6662]">3개월 이상</span>
                <span className="text-sm font-bold text-[#2A2725]">77,000원/월</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(230,224,218,0.5)]">
                <span className="text-sm text-[#6B6662]">5개월 이상</span>
                <span className="text-sm font-bold text-[#2A2725]">50,000원/월</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#6B6662]">초기 구조 세팅</span>
                <span className="text-sm font-bold text-[#2A2725]">150,000원 (1회)</span>
              </div>
            </div>

            <div className="p-4 bg-[rgba(191,167,255,0.05)] rounded-xl border border-[rgba(191,167,255,0.15)] mb-4">
              <p className="text-xs text-[#6B6662] leading-relaxed">
                <span className="font-semibold text-[#2A2725]">왜 월 단위인가요?</span><br />
                매달 질문과 기준이 누적되며 당신만의 선택 기준이 만들어집니다. 사주와 점성술의 기본인 달님의 사이클에 맞춰 진행됩니다. 변화는 결심이 아니라 반복입니다.
              </p>
            </div>

            <button
              onClick={() => router.push('/signup')}
              className="w-full py-3.5 bg-[rgba(42,39,37,0.92)] text-[rgba(245,241,237,0.98)] rounded-[14px] font-bold text-sm transition-transform active:scale-98"
            >
              지금 시작하기 →
            </button>
          </div>
        </section>

        {/* Today's Fortune CTA */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-[rgba(212,237,228,0.3)] to-[rgba(227,238,248,0.3)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5 text-center">
            <div className="text-4xl mb-3">🌙</div>
            <h3 className="text-lg font-bold text-[#2A2725] mb-2">
              우주일기예보 먼저 확인해보세요
            </h3>
            <p className="text-sm text-[#6B6662] mb-4">
              매일 업데이트되는 운세와 질문을<br />
              무료로 제공합니다
            </p>
            <button
              onClick={() => router.push('/fortune')}
              className="w-full py-3 bg-white border border-[rgba(230,224,218,0.9)] text-[#2A2725] rounded-[14px] font-semibold text-sm transition-transform active:scale-98"
            >
              오늘의 우주 이벤트 →
            </button>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">참여자들의 이야기</h2>
          
          <div className="space-y-3">
            {[
              {
                text: '불안이 사라진 건 아니에요. 대신, 내가 뭘 해야 하는지는 알겠어요',
                author: '30대 마케터',
              },
              {
                text: '사람 문제라고 생각했던 것이 관계 구조 문제였다는 걸 알았어요',
                author: '40대 디자이너',
              },
              {
                text: '대략적인 흐름을 파악하고, 상황을 미리 생각하니 내가 만드는 나에 더 쉽게 집중이 되고 있어요.',
                author: '30대 기획자',
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-4"
              >
                <p className="text-sm text-[#2A2725] leading-relaxed mb-2 italic">
                  "{testimonial.text}"
                </p>
                <p className="text-xs text-[#6B6662] text-right">
                  - {testimonial.author}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-6 text-center">
            <h3 className="text-xl font-bold text-[#2A2725] mb-3 leading-tight">
              나다움을 위해 <br />
              하루 몇 분이나 쓰고 있나요?
            </h3>
            <p className="text-sm text-[#6B6662] mb-5">
              혼자서는 어려운 것을<br />
              함께 시작할 준비가 되셨나요?
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="w-full py-4 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-base shadow-[0_10px_22px_rgba(123,203,255,0.18)] mb-3 transition-transform active:scale-98"
            >
              지금 시작하기 →
            </button>
            <button
              onClick={() => window.open('https://pf.kakao.com/_xjwsxfb/chat', '_blank')}
              className="text-sm text-[#6B6662] hover:text-[#2A2725] transition-colors"
            >
              더 궁금한 점이 있다면 →
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 px-1 border-t border-[rgba(230,224,218,0.5)]">
          <div className="flex flex-col gap-3 text-center">
            <div className="text-sm font-bold bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] bg-clip-text text-transparent">
              Sayme · Spirit Lab
            </div>
            <p className="text-xs text-[#6B6662]">
              월간/연간 자기성찰 챌린지 플랫폼
            </p>
            <p className="text-xs text-[#6B6662]">
              © 2024-2026 Sayme. All rights reserved.
            </p>
            <p className="text-xs text-[rgba(107,102,98,0.7)]">
              spirit-lab.me
            </p>
          </div>
        </footer>

      </main>
    </div>
  );
}
