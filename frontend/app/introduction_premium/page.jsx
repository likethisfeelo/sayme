'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IntroductionPremiumPage() {
  const router = useRouter();
  const [openMonthly, setOpenMonthly] = useState(false);
  const [openNewMember, setOpenNewMember] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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

        {/* Hero Section */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[rgba(191,167,255,0.2)] rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[rgba(255,193,217,0.2)] rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-block px-3 py-1.5 bg-white/40 backdrop-blur-sm rounded-full text-xs font-semibold text-[rgba(191,167,255,0.95)] border border-[rgba(191,167,255,0.2)] mb-4">
                PREMIUM
              </div>

              <h1 className="text-2xl font-bold text-[#2A2725] mb-3 leading-tight">
                나에게 맞는 속도로 살아가기 위한<br />
                <span className="bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] bg-clip-text text-transparent">
                  한 달의 리듬을 시작합니다
                </span>
              </h1>

              <p className="text-sm text-[#6B6662] mb-2 leading-relaxed">
                스피릿랩 프리미엄은<br />
                질문과 기록, 1:1 리딩을 통해<br />
                나의 생각과 선택 기준을 정리하는<br />
                월간 개인 리딩 서비스입니다
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: 4주 플로우 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-1 px-1">프리미엄 회원으로 참여하면</h2>
          <p className="text-sm text-[#6B6662] mb-4 px-1">이런 한 달을 경험하게 됩니다</p>

          <div className="space-y-3">
            {/* 1주차 */}
            <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2.5 py-1 bg-gradient-to-r from-[rgba(191,167,255,0.3)] to-[rgba(123,203,255,0.3)] rounded-full">
                  <span className="text-xs font-bold text-[#2A2725]">1주차</span>
                </div>
                <span className="text-sm font-bold text-[#2A2725]">시작 & 방향 설정</span>
              </div>
              <div className="space-y-2 mb-3">
                {[
                  '사전 질문 답변 (서비스 내 진행)',
                  '리더와 1:1 온라인 상담 (15분 기본, 보통 20~30분)',
                  '이번 달 월간 목표 설정 (최대 3개)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-[rgba(169,180,160,0.95)] mt-0.5">✓</span>
                    <p className="text-xs text-[#2A2725] leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[rgba(191,167,255,0.95)] leading-relaxed">
                → 현재 상태를 정리하고, 한 달의 방향을 설정합니다
              </p>
            </div>

            {/* 2~4주차 */}
            <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2.5 py-1 bg-gradient-to-r from-[rgba(191,167,255,0.3)] to-[rgba(123,203,255,0.3)] rounded-full">
                  <span className="text-xs font-bold text-[#2A2725]">2~4주차</span>
                </div>
                <span className="text-sm font-bold text-[#2A2725]">질문과 기록의 시간</span>
              </div>
              <div className="space-y-2 mb-3">
                {[
                  '매주 제공되는 개인 맞춤 질문 (한 달 총 7~10개)',
                  '질문에 답하며 생각을 정리하는 시간',
                  '주간 회고 작성 (선택)',
                  '월간 목표 점검 및 수정 가능',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-[rgba(169,180,160,0.95)] mt-0.5">✓</span>
                    <p className="text-xs text-[#2A2725] leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[rgba(191,167,255,0.95)] leading-relaxed">
                → 빨리 결론을 내는 것이 아니라,<br />
                의도적으로 생각할 시간을 갖는 것이 핵심입니다
              </p>
            </div>

            {/* 4주차 */}
            <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2.5 py-1 bg-gradient-to-r from-[rgba(191,167,255,0.3)] to-[rgba(123,203,255,0.3)] rounded-full">
                  <span className="text-xs font-bold text-[#2A2725]">4주차</span>
                </div>
                <span className="text-sm font-bold text-[#2A2725]">정리 & 마무리</span>
              </div>
              <div className="space-y-2 mb-3">
                {[
                  '한 달 동안의 모든 답변을 바탕으로 한 통합 분석 보고서',
                  '리더와 마지막 1:1 온라인 상담 (15분 기본, 보통 20~30분)',
                  '다음 달로 이어질 핵심 포인트 확인',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-[rgba(169,180,160,0.95)] mt-0.5">✓</span>
                    <p className="text-xs text-[#2A2725] leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[rgba(191,167,255,0.95)] leading-relaxed">
                → 한 달의 기록이 하나의 구조화된 리포트로 정리됩니다
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: 핵심 가치 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">스피릿랩이 다른 이유</h2>

          <div className="space-y-3">
            {[
              {
                num: '1',
                title: '답을 주지 않고, 기준을 남깁니다',
                desc: '"무엇을 해야 하는가"가 아니라\n"무엇을 기준으로 선택할 것인가"에 집중합니다',
                sub: '결정을 대신해주지 않으며\n스스로 선택할 수 있는 구조를 설계합니다',
                gradient: 'from-[rgba(232,223,245,0.3)] to-[rgba(212,237,228,0.3)]',
              },
              {
                num: '2',
                title: '사주·점성술을 도구로 활용합니다',
                desc: '예언이나 위로가 아닌\n사고 프레임을 제공하는 도구로 접근합니다',
                sub: '나다움에 대해 깊이 생각할 수 있는\n인사이트를 제공합니다',
                gradient: 'from-[rgba(255,232,214,0.3)] to-[rgba(244,227,229,0.3)]',
              },
              {
                num: '3',
                title: '혼자서는 어려운 리듬을 만들어줍니다',
                desc: '바쁜 일상 속에서 자꾸 미뤄지는\n사유의 시간을 구조화합니다',
                sub: '한 달 동안 질문-기록-해석이 연결되며\n지속 가능한 생각의 리듬이 만들어집니다',
                gradient: 'from-[rgba(212,237,228,0.3)] to-[rgba(227,238,248,0.3)]',
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${item.gradient} bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[rgba(191,167,255,0.3)] to-[rgba(123,203,255,0.3)] flex items-center justify-center border border-white/50">
                    <span className="text-xs font-bold text-[#2A2725]">{item.num}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#2A2725]">{item.title}</h3>
                </div>
                <p className="text-xs text-[#2A2725] leading-relaxed whitespace-pre-line mb-2">{item.desc}</p>
                <p className="text-xs text-[#6B6662] leading-relaxed whitespace-pre-line">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Before/After */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">참여 전후, 이렇게 달라집니다</h2>

          <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
            <div className="space-y-4">
              {[
                { before: '생각은 많지만 방향 정리가 안 됨', after: '선택의 기준이 문장으로 정리됨' },
                { before: '중요한 결정을 계속 미룸', after: '결정 속도가 빨라짐 (명료하게)' },
                { before: '타인의 의견에 쉽게 흔들림', after: '자기 판단을 유지할 수 있음' },
                { before: '불안이 먼저 떠오름', after: '불안의 원인을 구조적으로 인식함' },
                { before: '우선순위 없이 떠도는 생각들', after: '다음 선택을 점검할 수 있는 질문을 가짐' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 bg-[rgba(254,226,226,0.3)] rounded-lg p-2.5">
                    <p className="text-xs text-[#6B6662] leading-relaxed">{item.before}</p>
                  </div>
                  <span className="text-xs text-[rgba(191,167,255,0.95)] font-bold flex-shrink-0">→</span>
                  <div className="flex-1 bg-[rgba(220,252,231,0.3)] rounded-lg p-2.5">
                    <p className="text-xs text-[#2A2725] leading-relaxed font-semibold">{item.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: 솔직한 안내 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">이 서비스가 맞지 않는 경우도 있습니다</h2>

          <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
            <p className="text-sm text-[#6B6662] leading-relaxed mb-4">
              스피릿랩은 능동적 참여가 필요한 서비스입니다.<br />
              아래에 해당한다면 만족도가 낮을 수 있습니다.
            </p>
            <div className="space-y-2.5">
              {[
                '빠른 답이나 즉각적인 해결을 원하시는 분',
                '질문에 성실히 답할 시간을 내기 어려운 분',
                '"정해진 솔루션"이나 확답을 기대하시는 분',
                '감정 위로 중심의 상담을 원하시는 분',
              ].map((text, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <span className="text-xs text-red-400 mt-0.5">✕</span>
                  <p className="text-sm text-[#2A2725] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[rgba(191,167,255,0.95)] mt-4 leading-relaxed">
              → 이 서비스는 짧은 시간 안에 답을 얻는 방식이 아닙니다.
            </p>
          </div>
        </section>

        {/* Section 5: 적합 대상 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-1 px-1">당신이 이런 상태라면,</h2>
          <p className="text-sm text-[#6B6662] mb-4 px-1">스피릿랩이 필요한 시점입니다</p>

          <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5 space-y-3">
            {[
              '생각은 깊지만 정리할 시간이 없으신 분',
              '중요한 선택(커리어, 관계, 삶의 구조)을 앞두고 계신 분',
              '사주·점성술을 참고하되, 의존하지 않고 싶으신 분',
              '혼자서는 자꾸 미뤄지는 사유의 시간을 확보하고 싶으신 분',
              '매달 나의 방향을 점검하는 루틴이 필요한 분',
              '기준이 흔들려 타인 의견에 쉽게 영향받으신 분',
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

        {/* Section 6: 제공 항목 */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">프리미엄 회원이 받는 것</h2>

          <div className="space-y-3">
            {/* 포함된 것 */}
            <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
              <div className="text-sm font-bold text-[rgba(22,163,74,1)] mb-3">포함된 것</div>
              <div className="space-y-2.5">
                {[
                  '사주·점성술 기반 개인 맞춤 질문 (월 7~10개)',
                  '질문에 답하며 생각을 정리할 수 있는 시간과 구조',
                  '월간 목표 설정 및 주간 점검 시스템',
                  '한 달 답변을 바탕으로 한 통합 분석 보고서 (리더 직접 작성)',
                  '시작과 마무리 1:1 온라인 상담 2회 (각 15분 기본)',
                  '언제든 다시 볼 수 있는 개인 아카이브',
                ].map((text, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-xs text-[rgba(22,163,74,1)] mt-0.5">✅</span>
                    <p className="text-xs text-[#2A2725] leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 포함되지 않는 것 */}
            <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
              <div className="text-sm font-bold text-red-500 mb-3">포함되지 않는 것</div>
              <div className="space-y-2.5">
                {[
                  '운세 풀이나 예언',
                  '실시간 채팅 상담',
                  '구체적 행동 지시',
                  '감정 위로 중심의 대화',
                ].map((text, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-xs text-red-400 mt-0.5">✕</span>
                    <p className="text-xs text-[#6B6662] leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 가격 (from hinewmember) */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">서비스 가격</h2>

          {/* 신규 회원 가격 */}
          <div className="bg-gradient-to-br from-[rgba(245,243,255,1)] to-[rgba(252,231,243,1)] border-2 border-[rgba(99,102,241,1)] rounded-[18px] p-6 text-center relative overflow-hidden mb-4">
            <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
              신규 회원
            </div>
            <div className="text-[13px] text-[#6B6662] mb-3">스피릿랩 첫 참여 신청 시</div>
            <div className="text-4xl font-bold text-[#2A2725] mb-2">₩200,000</div>
            <div className="text-[13px] text-[rgba(99,102,241,1)] mb-4">
              월 구독 100,000원 + 초기 상담 2회 100,000원
            </div>

            <div className="bg-white rounded-[10px] p-3 text-left">
              <div className="text-[11px] text-[#6B6662] leading-relaxed">
                ✓ 가입 후 초기 집중 1:1 상담 2회 (30분씩 2회)<br />
                ✓ 개인 맞춤 질문 7~10개<br />
                ✓ 1:1 온라인 상담 2회 (시작 15분 + 마무리 15분)<br />
                ✓ 통합 분석 보고서 1회<br />
                ✓ 주간 회고 &amp; 월간 목표 시스템<br />
                ✓ 개인 아카이브 무제한 열람
              </div>
            </div>
          </div>

          {/* 참여 구조 */}
          <div className="bg-[rgba(249,249,255,1)] border border-[rgba(99,102,241,0.2)] rounded-[18px] p-5 mb-4">
            <div className="text-sm font-bold text-[#2A2725] mb-3 text-center">참여자 평균 2~6개월 지속</div>
            <div className="space-y-2.5 mb-4">
              {[
                { label: '월 단위 참여', price: '100,000원/월', color: 'rgba(99,102,241,1)', border: false },
                { label: '3개월 이상 참여', price: '77,000원/월', color: 'rgba(167,139,250,1)', border: false },
                { label: '5개월 이상 참여', price: '50,000원/월', color: 'rgba(22,163,74,1)', border: true },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center p-2.5 bg-white rounded-lg ${
                    item.border ? 'border-2 border-[rgba(22,163,74,0.3)]' : ''
                  }`}
                >
                  <span className={`text-[13px] text-[#2A2725] ${item.border ? 'font-semibold' : ''}`}>{item.label}</span>
                  <span className="text-[15px] font-bold" style={{ color: item.color }}>{item.price}</span>
                </div>
              ))}
            </div>

            <div className="bg-[rgba(254,243,199,1)] rounded-lg p-3 mb-3">
              <div className="text-xs text-[#78350F] leading-relaxed">
                <strong>초기 구조 세팅 (가입비) 50,000원 (1회)</strong><br />
                첫 달에만 부과되는 세팅 비용입니다
              </div>
            </div>

            <div className="text-[11px] text-[#6B6662] leading-relaxed">
              * 자동 갱신 없음<br />
              * 매달 참여 의사 확인 후 결제
            </div>
          </div>

          {/* 왜 월 단위인가요? */}
          <div className="bg-[rgba(224,242,254,1)] border-l-4 border-[rgba(59,130,246,1)] rounded-xl mb-4 overflow-hidden">
            <button
              onClick={() => setOpenMonthly(!openMonthly)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="text-sm font-bold text-[#2A2725]">왜 월 단위인가요?</span>
              <span className={`text-[#6B6662] text-sm transition-transform duration-200 ${openMonthly ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {openMonthly && (
              <div className="px-5 pb-5 text-xs text-[#1e3a8a] leading-[1.7]">
                매달 질문과 기준이 누적되며 당신만의 선택 기준이 만들어집니다.<br /><br />
                사주와 점성술의 기본인 <strong>달님의 사이클에 맞춰</strong> 진행됩니다.<br /><br />
                변화는 결심이 아니라 <strong>반복</strong>입니다.
              </div>
            )}
          </div>

          {/* 왜 신규 회원 비용이 더 높나요? */}
          <div className="bg-gradient-to-br from-[rgba(254,243,199,1)] to-[rgba(253,230,138,1)] border-l-4 border-[rgba(245,158,11,1)] rounded-[14px] mb-4 overflow-hidden">
            <button
              onClick={() => setOpenNewMember(!openNewMember)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <span className="text-[15px] font-bold text-[#78350F]">왜 신규 회원 비용이 더 높나요?</span>
              <span className={`text-[#78350F] text-sm transition-transform duration-200 ${openNewMember ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {openNewMember && (
              <div className="px-6 pb-6">
                <div className="text-[13px] text-[#78350F] leading-[1.8] mb-4">
                  <strong>신규 회원은 더 많은 시간과 분석이 필요합니다</strong>
                </div>

                <div className="bg-white rounded-xl p-4 mb-4">
                  <div className="text-xs font-bold text-[#78350F] mb-3">첫 달, 당신만의 구조를 만드는 시간</div>
                  <div className="text-[11px] text-[#78350F] leading-[1.8]">
                    • <strong>1:1 상담 총 60분</strong> (시작 30분 + 마무리 30분)<br />
                    • 사주·점성술 기초 분석 &amp; 개인 구조 완전 파악<br />
                    • 당신의 리듬에 맞는 질문 설계를 위한 심층 대화<br />
                    • 첫 달 목표 설정 및 앞으로의 방향 수립<br />
                    • 이후 매달 활용할 수 있는 <strong>나만의 기준 설계</strong>
                  </div>
                </div>

                <div className="bg-[rgba(245,243,255,1)] border-2 border-[rgba(99,102,241,0.3)] rounded-xl p-4 mb-4 text-center">
                  <div className="text-xs text-[#2A2725] leading-[1.8]">
                    일반 1:1 상담 30분 = <strong className="text-[rgba(99,102,241,1)]">77,000원</strong><br />
                    <div className="text-[10px] text-[#6B6662] my-2">×</div>
                    스피릿랩 초기 참여 시<br />
                    신규 회원은 <strong>30분 상담 2회 후</strong><br />
                    <strong>+ 구조 세팅 + 맞춤 분석</strong><br />
                    <div className="mt-3 pt-3 border-t border-[rgba(99,102,241,0.2)]">
                      <span className="text-[11px] text-[#6B6662]">이 모든 것을</span><br />
                      <strong className="text-lg text-[rgba(99,102,241,1)]">200,000원</strong><br />
                      <span className="text-[11px] text-[rgba(99,102,241,1)] font-semibold">단순 상담비보다 저렴하면서 한달내내 나다움에 집중할 수 있도록 구성했습니다.</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[rgba(240,253,244,1)] rounded-xl p-3.5">
                  <div className="text-[11px] text-[#166534] leading-[1.8]">
                    <strong>2개월차부터는?</strong><br /><br />
                    이미 파악된 당신의 구조를 바탕으로 진행하므로<br />
                    상담 시간이 줄어들고, 질문은 더 정교해지며,<br />
                    비용도 자연스럽게 낮아집니다.<br /><br />
                    사주와 점성술의 의존도가 낮아지며<br />
                    자신이 단단해지고, 쌓인 기록이 곧 당신만의 자산이 됩니다.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 장기 참여 혜택 */}
          <div className="bg-[rgba(240,253,244,1)] border border-[rgba(22,163,74,0.3)] rounded-xl p-4">
            <div className="text-[13px] font-bold text-[rgba(22,163,74,1)] mb-2.5">
              장기 참여 시 이런 점이 좋습니다
            </div>
            <div className="text-[11px] text-[#166534] leading-[1.7]">
              ✓ 3개월차부터 <strong>23% 할인</strong> (77,000원)<br />
              ✓ 5개월차부터 <strong>50% 할인</strong> (50,000원)<br />
              ✓ 누적된 기록으로 더 정교한 분석<br />
              ✓ 질문과 기준이 쌓여 명확한 방향성 확보<br />
              ✓ 변화의 패턴이 보이기 시작함
            </div>
          </div>
        </section>

        {/* Section 7: 운영 방식 & FAQ */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-[#2A2725] mb-4 px-1">참여 방법 & 일정</h2>

          <div className="space-y-3">
            {/* 운영 방식 */}
            <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#2A2725] mb-1">월간 단위 운영</h3>
                  <p className="text-xs text-[#6B6662] leading-relaxed">
                    스피릿랩은 매달 말~매달 초에만 신규 회원을 받습니다<br />
                    중도 가입은 불가하며, 매달 1일부터 시작됩니다
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2A2725] mb-1">1:1 상담 일정</h3>
                  <p className="text-xs text-[#6B6662] leading-relaxed">
                    상담은 온라인으로 진행되며<br />
                    기본 15분이지만 보통 20~30분까지 진행됩니다<br />
                    여유 있게 시간을 확보해 주시기 바랍니다
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2A2725] mb-1">질문 제공 주기</h3>
                  <p className="text-xs text-[#6B6662] leading-relaxed">
                    매주 질문이 제공되며<br />
                    본인의 속도에 맞춰 답변하실 수 있습니다
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-5">
              <h3 className="text-sm font-bold text-[#2A2725] mb-4">자주 묻는 질문</h3>
              <div className="space-y-0">
                {[
                  {
                    q: '언제 가입할 수 있나요?',
                    a: '스피릿랩은 월간 단위로만 운영되며, 매달 말~매달 초에만 신규 회원을 받습니다.\n예: 3월 서비스는 2월 말~3월 1일까지 가입 가능',
                  },
                  {
                    q: '중도 가입이 가능한가요?',
                    a: '아니요, 중도 가입은 불가능합니다.\n스피릿랩은 매달 1일부터 시작되는 월간 프로그램으로,\n한 달의 흐름을 온전히 경험하기 위해 월 초에만 가입을 받고 있습니다.',
                  },
                  {
                    q: '1:1 상담은 어떻게 진행되나요?',
                    a: '온라인(화상 또는 음성)으로 진행됩니다.\n- 1주차: 시작 상담 (15분 기본, 보통 20~30분)\n- 4주차: 마무리 상담 (15분 기본, 보통 20~30분)\n상담 일정은 가입 후 개별 조율하며, 시간 여유를 두고 참여하시는 것을 권장합니다.',
                  },
                  {
                    q: '질문에 답변하지 않으면 어떻게 되나요?',
                    a: '스피릿랩은 능동적 참여가 필요한 서비스입니다.\n질문에 성실히 답변하지 않으면 통합 리포트의 깊이와 정확도가 제한될 수 있습니다.\n답변 내용이 풍부할수록 더 개인화된 분석을 받으실 수 있습니다.',
                  },
                  {
                    q: '환불이 가능한가요?',
                    a: '서비스 시작 전(매달 1일 이전)에는 전액 환불 가능합니다.\n서비스 시작 후에는 환불 정책에 따라 처리되며,\n자세한 내용은 가입 시 안내해드립니다.',
                  },
                  {
                    q: '한 달만 이용할 수 있나요?',
                    a: '네, 가능합니다.\n스피릿랩은 월 단위 서비스로, 한 달만 체험하셔도 되고\n원하시면 다음 달에도 연속 참여 가능합니다.\n자동 갱신은 없으며, 매달 의사를 확인합니다.',
                  },
                  {
                    q: '사주 정보는 왜 필요한가요?',
                    a: '사주와 점성술을 기반으로 개인 맞춤 질문을 설계하기 때문입니다.\n생년월일시와 출생지 정보를 통해 현재 시점의 흐름을 파악하고,\n나다움에 대해 깊이 생각할 수 있는 개인화된 질문을 제공합니다.',
                  },
                ].map((item, index) => (
                  <div key={index} className="border-b border-[rgba(230,224,218,0.5)] last:border-b-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between py-3 text-left"
                    >
                      <h4 className="text-xs font-bold text-[rgba(191,167,255,0.95)]">Q. {item.q}</h4>
                      <span className={`text-[#6B6662] text-xs transition-transform duration-200 flex-shrink-0 ml-2 ${openFaq === index ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {openFaq === index && (
                      <p className="text-xs text-[#6B6662] leading-relaxed whitespace-pre-line pb-3">{item.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: 한 문장 재확인 */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-[rgba(191,167,255,0.15)] via-[rgba(123,203,255,0.12)] to-[rgba(255,193,217,0.1)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-6 text-center">
            <p className="text-sm text-[#2A2725] leading-relaxed mb-3">
              스피릿랩은<br />
              답을 주는 서비스가 아니라<br />
              <strong>스스로 선택할 수 있는 기준을 남기는 서비스</strong>입니다
            </p>
            <p className="text-sm text-[#6B6662] leading-relaxed">
              더 잘 버티기 위한 것이 아니라<br />
              <strong className="text-[#2A2725]">나에게 맞는 속도로 살아가기 위한 리듬</strong>을 만드는 곳입니다
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-6">
          <div className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] rounded-[18px] p-6 text-center">
            <button
              onClick={() => router.push('/hinewmember')}
              className="w-full py-4 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-lg shadow-[0_10px_22px_rgba(123,203,255,0.18)] mb-4 transition-transform active:scale-98"
            >
              프리미엄 회원 가입하기
            </button>

            <div className="text-xs text-[#6B6662] mb-4 leading-relaxed">
              <p>다음 회차: <strong className="text-[#2A2725]">2026년 2월 1일</strong> 시작</p>
              <p>신규 가입 마감: <strong className="text-[#2A2725]">2026년 2월 6일</strong> 자정</p>
            </div>

            <button
              onClick={() => router.push('/trial-home#review-2025')}
              className="w-full py-3 bg-white/60 border border-[rgba(230,224,218,0.85)] text-[#2A2725] rounded-[14px] font-semibold text-sm mb-3 transition-transform active:scale-98"
            >
              체험 서비스 먼저 경험하기
            </button>

            <button
              onClick={() => window.open('https://pf.kakao.com/_xjwsxfb/chat', '_blank')}
              className="w-full py-3 bg-[#FFF9DB] text-[#78350F] rounded-[14px] font-semibold text-sm transition-transform active:scale-98 border border-[#FDE68A]"
            >
              1:1 문의하기 💬
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
