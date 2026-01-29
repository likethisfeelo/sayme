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
            ].map((step, index) => (
              <div 
                key={index}
                className={`p-4 rounded-[14px] bg-gradient-to-r ${step.gradient} border border-[rgba(230,224,218,0.6)]`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/70 rounded-full flex items-center justify-center font-bold text-sm text-[#2A2725]">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2A2725] mb-1">{step.title}</h3>
                    <p className="text-xs text-[#6B6662] whitespace-pre-line leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
            <h2 className="text-xl font-bold text-[#2A2725] mb-3">지금 시작해보세요</h2>
            <p className="text-sm text-[#6B6662] mb-4">
              첫 번째 질문이 당신을 기다리고 있습니다
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="w-full py-3 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold"
            >
              무료로 시작하기 →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
