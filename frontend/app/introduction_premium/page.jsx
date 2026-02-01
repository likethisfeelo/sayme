'use client';

import { useRouter } from 'next/navigation';

export default function IntroductionPremiumPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
      background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
    }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
          <button
            onClick={() => router.back()}
            className="text-sm text-[#6B6662] hover:text-[#2A2725] transition-colors"
          >
            ← 뒤로
          </button>
          <div className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
            Sayme · Spirit Lab
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-12 max-w-[430px] mx-auto">

        {/* Hero */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[rgba(191,167,255,0.2)] rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[rgba(255,193,217,0.2)] rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-block px-3 py-1.5 bg-white/40 backdrop-blur-sm rounded-full text-xs font-semibold text-[rgba(191,167,255,0.95)] border border-[rgba(191,167,255,0.2)] mb-4">
                PREMIUM
              </div>

              <h1 className="text-2xl font-bold text-[#2A2725] mb-3 leading-tight">
                나다움을 위한<br />
                <span className="bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] bg-clip-text text-transparent">
                  1:1 멘탈 PT
                </span>
              </h1>

              <p className="text-sm text-[#6B6662] mb-5 leading-relaxed">
                사주와 점성술을 바탕으로<br />
                질문, 기록, 분석을 통해<br />
                당신만의 선택 기준을 만듭니다.
              </p>
            </div>
          </div>
        </section>

        {/* 프리미엄에 포함된 것 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">프리미엄에 포함된 것</h2>

          <div className="space-y-3">
            {[
              {
                icon: '🎯',
                title: '월간 맞춤 주제 설계',
                desc: '당신의 상태와 흐름을 읽고\n이번 달에 집중할 주제를 함께 정합니다',
                gradient: 'from-[rgba(232,223,245,0.3)] to-[rgba(212,237,228,0.3)]',
              },
              {
                icon: '📝',
                title: '주 1회 설계된 질문',
                desc: '목적 없는 일기가 아닌\n구조화된 질문으로 생각을 정리합니다',
                gradient: 'from-[rgba(255,232,214,0.3)] to-[rgba(244,227,229,0.3)]',
              },
              {
                icon: '📊',
                title: '월간 분석 리포트',
                desc: '한 달간의 답변을 구조화한 리포트로\n나만의 선택 기준이 됩니다',
                gradient: 'from-[rgba(212,237,228,0.3)] to-[rgba(227,238,248,0.3)]',
              },
              {
                icon: '🔮',
                title: '사주/점성 기반 해석',
                desc: '운세가 아닌, 구조적 해석으로\n흐름을 이해하고 방향을 잡습니다',
                gradient: 'from-[rgba(244,227,229,0.3)] to-[rgba(232,223,245,0.3)]',
              },
              {
                icon: '💬',
                title: '1:1 맞춤 피드백',
                desc: '답변에 대한 전문가의 심층 피드백으로\n혼자서는 보지 못한 관점을 발견합니다',
                gradient: 'from-[rgba(232,223,245,0.3)] to-[rgba(255,232,214,0.3)]',
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${item.gradient} bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-4`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/60 flex items-center justify-center border border-white/50 text-xl">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-[#2A2725] mb-1">{item.title}</h3>
                    <p className="text-xs text-[#6B6662] leading-relaxed whitespace-pre-line">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 어떻게 진행되나요 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">어떻게 진행되나요?</h2>

          <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
            <div className="space-y-5">
              {[
                { number: '1', title: '상태를 듣습니다', desc: '현재 상태, 목표, 불안을 먼저 듣고 사주와 점성술로 구조를 읽어냅니다.' },
                { number: '2', title: '주제를 설계합니다', desc: '이번 달 당신에게 필요한 단 하나의 주제를 함께 정합니다.' },
                { number: '3', title: '기록이 쌓입니다', desc: '설계된 질문에 답하고 기록합니다. 의도적으로 생각하는 시간.' },
                { number: '4', title: '기준이 남습니다', desc: '답변을 구조화한 분석 리포트 제공. 이후 선택의 기준으로 반복 활용.' },
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[rgba(191,167,255,0.3)] to-[rgba(123,203,255,0.3)] flex items-center justify-center border border-white/50">
                    <span className="text-sm font-bold text-[#2A2725]">{step.number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#2A2725] mb-0.5">{step.title}</h3>
                    <p className="text-xs text-[#6B6662] leading-relaxed">{step.desc}</p>
                  </div>
                  {index < 3 && (
                    <div className="absolute left-[35px] top-[40px] w-px h-4 bg-[rgba(191,167,255,0.2)]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 이런 분들에게 필요합니다 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">이런 분들에게 필요합니다</h2>

          <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5 space-y-3">
            {[
              '생각은 깊은데 방향 정리할 시간 없는 분',
              '중요한 선택 앞에서 확신이 필요한 분',
              '혼자 하면 흐트러지는 걸 함께 정리하고 싶은 분',
              '사주에 관심 있지만 비의존적 해석을 원하는 분',
              '매달 나에 대해 깊이 생각하는 시간이 필요한 분',
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

        {/* 참여자들의 이야기 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">참여자들의 이야기</h2>

          <div className="space-y-3">
            {[
              { text: '불안이 사라진 건 아니에요. 대신, 내가 뭘 해야 하는지는 알겠어요', author: '30대 마케터' },
              { text: '사람 문제라고 생각했던 것이 관계 구조 문제였다는 걸 알았어요', author: '40대 디자이너' },
              { text: '대략적인 흐름을 파악하고, 상황을 미리 생각하니 내가 만드는 나에 더 쉽게 집중이 되고 있어요.', author: '30대 기획자' },
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

        {/* 참여 구조 (가격) */}
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
          </div>
        </section>

        {/* CTA */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-6 text-center">
            <h3 className="text-xl font-bold text-[#2A2725] mb-3 leading-tight">
              나다움을 위해<br />
              하루 몇 분이나 쓰고 있나요?
            </h3>
            <p className="text-sm text-[#6B6662] mb-5">
              혼자서는 어려운 것을<br />
              함께 시작할 준비가 되셨나요?
            </p>

            <button
              onClick={() => window.open('https://spirit-lab.me/payment', '_blank')}
              className="w-full py-4 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-base shadow-[0_10px_22px_rgba(123,203,255,0.18)] mb-3 transition-transform active:scale-98"
            >
              프리미엄 시작하기 →
            </button>

            <button
              onClick={() => window.open('https://pf.kakao.com/_xoMxbdG', '_blank')}
              className="w-full py-3 bg-[#FEE500] text-[#000000] rounded-[14px] font-semibold text-sm mb-3 transition-transform active:scale-98"
            >
              카카오톡으로 문의하기 💬
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
