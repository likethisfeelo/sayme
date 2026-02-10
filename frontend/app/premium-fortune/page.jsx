'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
];

const STATUS_CONFIG = {
  pending: { label: '대기 중', color: 'text-[#6B6662]', bg: 'bg-[#E6E0DA]' },
  confirmed: { label: '확정', color: 'text-[#2E8B57]', bg: 'bg-[rgba(46,139,87,0.15)]' },
  completed: { label: '완료', color: 'text-[#BFA7FF]', bg: 'bg-[rgba(191,167,255,0.15)]' },
  cancelled: { label: '취소됨', color: 'text-[#999]', bg: 'bg-[#f5f5f5]' },
};

const TICKET_NAMES = {
  tarot: '타로',
  fortune: '사주체크',
  universe: '우주흐름체크',
  consultation: '1:1 추가 상담',
  urgent: '긴급 신청',
};

export default function PremiumFortunePage() {
  const router = useRouter();
  const [fortune, setFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tickets & consultation requests
  const [tickets, setTickets] = useState([]);
  const [consultationRequests, setConsultationRequests] = useState([]);

  // Consultation form (tickets page style)
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [preferredDate1, setPreferredDate1] = useState('');
  const [preferredTime1, setPreferredTime1] = useState('');
  const [preferredDate2, setPreferredDate2] = useState('');
  const [preferredTime2, setPreferredTime2] = useState('');
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [showUrgentConfirm, setShowUrgentConfirm] = useState(false);
  const [urgentPaidOk, setUrgentPaidOk] = useState(null);

  const fetchConsultationRequests = async (idToken) => {
    try {
      const response = await fetch(`${API_BASE}/consultation/list`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setConsultationRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch consultation requests:', error);
    }
  };

  useEffect(() => {
    fetchFortune();
    const idToken = localStorage.getItem('idToken');
    if (idToken) {
      fetch(`${API_BASE}/ticket`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
        .then(res => res.json())
        .then(data => { if (data.success) setTickets(data.tickets || []); })
        .catch(() => {});
      fetchConsultationRequests(idToken);
    }
  }, []);

  const fetchFortune = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/public/fortune`);

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

  const today = new Date().toISOString().split('T')[0];
  const datesReady = preferredDate1 && preferredTime1 && preferredDate2 && preferredTime2;
  const availableTickets = tickets.filter(t => t.count > 0);

  const handleTicketSelect = (ticketType) => {
    if (ticketType === 'urgent') {
      setSelectedTicketType('urgent');
      setShowUrgentConfirm(true);
      setUrgentPaidOk(null);
    } else {
      setSelectedTicketType(ticketType);
      setShowUrgentConfirm(false);
      setUrgentPaidOk(null);
    }
  };

  const handleUrgentChoice = (paidOk) => {
    setUrgentPaidOk(paidOk);
    setShowUrgentConfirm(false);
  };

  const canSubmit = datesReady && selectedTicketType && !submitting &&
    (selectedTicketType !== 'urgent' || urgentPaidOk !== null);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          preferredDate1,
          preferredTime1,
          preferredDate2,
          preferredTime2,
          ticketType: selectedTicketType,
          isUrgent: selectedTicketType === 'urgent',
          urgentPaidOk: selectedTicketType === 'urgent' ? urgentPaidOk : null,
          isPaidOk: selectedTicketType === 'urgent' ? urgentPaidOk : false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (selectedTicketType !== 'urgent') {
          setTickets(prev =>
            prev.map(t =>
              t.ticketType === selectedTicketType
                ? { ...t, count: Math.max(0, t.count - 1) }
                : t
            )
          );
        }
        setSubmitSuccess(true);
        setSubmitError('');
        const idToken2 = localStorage.getItem('idToken');
        if (idToken2) fetchConsultationRequests(idToken2);
        setPreferredDate1('');
        setPreferredTime1('');
        setPreferredDate2('');
        setPreferredTime2('');
        setSelectedTicketType(null);
        setUrgentPaidOk(null);
      } else {
        setSubmitError(data.message || '신청에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Failed to submit consultation:', error);
      setSubmitError(`신청 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const backgroundStyle = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", Segoe UI, Roboto, Arial, sans-serif',
    background:
      'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
    color: '#2A2725',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6662]">오늘의 운세를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
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
    <div className="min-h-screen" style={backgroundStyle}>
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
        <Header
          subtitle="우주의 흐름"
          showMenuButton
          zIndexClass="z-50"
          maxWidthClass="max-w-[430px]"
        />

        <main className="px-4 py-3.5 pb-[86px] flex flex-col gap-3.5">
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

          {/* ===== 상담 신청 내역 ===== */}
          {consultationRequests.length > 0 && (
            <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
                <div className="text-sm font-[750] tracking-tight text-[#2A2725]">상담 신청 내역</div>
                <div className="text-xs text-[#6B6662] mt-0.5">접수한 상담 요청의 현재 상태</div>
              </div>

              <div className="p-4 flex flex-col gap-2.5">
                {consultationRequests.map((req) => {
                  const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={req.requestId}>
                      <div
                        className={`p-3 rounded-xl border ${
                          req.status === 'confirmed'
                            ? 'border-[rgba(46,139,87,0.3)] bg-[rgba(46,139,87,0.04)]'
                            : req.status === 'cancelled'
                              ? 'border-[#E6E0DA] bg-[#F5F1ED]/50'
                              : 'border-[#E6E0DA] bg-white/60'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <span className="text-[10px] text-[#9B9590]">
                            {formatDate(req.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#2A2725]">
                          <span className="text-[#6B6662]">1순위</span>
                          <span className="font-medium">{formatDate(req.preferredDate1)} {req.preferredTime1}</span>
                        </div>
                        {req.preferredDate2 && (
                          <div className="flex items-center gap-2 text-xs text-[#2A2725] mt-1">
                            <span className="text-[#6B6662]">2순위</span>
                            <span>{formatDate(req.preferredDate2)} {req.preferredTime2}</span>
                          </div>
                        )}
                        <div className="mt-1.5 flex gap-1.5">
                          {req.ticketType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(191,167,255,0.12)] text-[#7B6CB5]">
                              {TICKET_NAMES[req.ticketType] || req.ticketType}
                            </span>
                          )}
                          {req.isUrgent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(255,138,101,0.12)] text-[#FF8A65]">
                              긴급
                            </span>
                          )}
                        </div>
                      </div>
                      {req.status === 'cancelled' && (
                        <a
                          href="http://pf.kakao.com/_xjwsxfb/chat"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 mt-1.5 w-full py-2.5 rounded-xl text-sm font-bold border border-[rgba(250,225,115,0.6)] bg-[rgba(250,225,115,0.25)] text-[#5C5340] no-underline transition-all active:scale-[0.98]"
                        >
                          바로 연락하기
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ===== 1:1 상담 신청 ===== */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">1:1 상담 신청</div>
              <div className="text-xs text-[#6B6662] mt-0.5">희망 날짜와 시간을 선택하세요</div>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {submitError && (
                <div className="p-3 rounded-xl bg-red-100 text-red-800 text-sm">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-green-100 text-green-800 text-sm">
                  상담 신청이 완료되었습니다! 관리자 확인 후 확정됩니다.
                  <button
                    onClick={() => { setSubmitSuccess(false); setSubmitError(''); }}
                    className="block mt-2 text-xs underline bg-transparent border-0 cursor-pointer text-green-700 p-0"
                  >
                    새 상담 신청하기
                  </button>
                </div>
              )}

              {!submitSuccess && (
                <>
                  {/* 1순위 희망 날짜/시간 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-[#6B6662]">1순위 희망 날짜 · 시간</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={preferredDate1}
                        min={today}
                        onChange={(e) => setPreferredDate1(e.target.value)}
                        className="flex-1 p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                      />
                      <select
                        value={preferredTime1}
                        onChange={(e) => setPreferredTime1(e.target.value)}
                        className="flex-1 p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm appearance-none"
                      >
                        <option value="">시간 선택</option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2순위 희망 날짜/시간 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-[#6B6662]">2순위 희망 날짜 · 시간</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={preferredDate2}
                        min={today}
                        onChange={(e) => setPreferredDate2(e.target.value)}
                        className="flex-1 p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                      />
                      <select
                        value={preferredTime2}
                        onChange={(e) => setPreferredTime2(e.target.value)}
                        className="flex-1 p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm appearance-none"
                      >
                        <option value="">시간 선택</option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!datesReady && (
                    <div className="p-3 rounded-xl bg-[rgba(191,167,255,0.08)] border border-[rgba(191,167,255,0.2)] text-xs text-[#6B6662] text-center">
                      희망 날짜와 시간을 모두 입력하면 티켓을 선택할 수 있어요
                    </div>
                  )}

                  {datesReady && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-[#6B6662]">사용할 티켓 선택</label>

                      <div className="flex flex-col gap-2">
                        {availableTickets.map((ticket) => (
                          <button
                            key={ticket.ticketType}
                            onClick={() => handleTicketSelect(ticket.ticketType)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              selectedTicketType === ticket.ticketType
                                ? 'border-[#BFA7FF] bg-[rgba(191,167,255,0.15)] shadow-[0_0_0_1px_rgba(191,167,255,0.4)]'
                                : 'border-[#E6E0DA] bg-white/80 hover:bg-[rgba(191,167,255,0.05)]'
                            }`}
                          >
                            <div className="text-2xl flex-shrink-0">{ticket.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#2A2725]">{ticket.name}</div>
                              <div className="text-xs text-[#6B6662]">{ticket.count}회 남음</div>
                            </div>
                            {selectedTicketType === ticket.ticketType && (
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#BFA7FF] flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}

                        <button
                          onClick={() => handleTicketSelect('urgent')}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedTicketType === 'urgent'
                              ? 'border-[#FF8A65] bg-[rgba(255,138,101,0.12)] shadow-[0_0_0_1px_rgba(255,138,101,0.4)]'
                              : 'border-[#E6E0DA] bg-white/80 hover:bg-[rgba(255,138,101,0.05)]'
                          }`}
                        >
                          <div className="text-2xl flex-shrink-0">🚨</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#2A2725]">급해서 일단 신청</div>
                            <div className="text-xs text-[#FF8A65]">티켓 없이 긴급 신청</div>
                          </div>
                          {selectedTicketType === 'urgent' && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF8A65] flex items-center justify-center">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>

                      {showUrgentConfirm && (
                        <div className="p-4 rounded-xl border border-[#FF8A65] bg-[rgba(255,138,101,0.08)]">
                          <p className="text-sm font-medium text-[#2A2725] m-0 mb-3 text-center">
                            너무 급해서 유료여도 신청하시겠습니까?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUrgentChoice(true)}
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold border-0 cursor-pointer bg-[#FF8A65] text-white transition-all active:scale-[0.98]"
                            >
                              YES
                            </button>
                            <button
                              onClick={() => handleUrgentChoice(false)}
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-[#E6E0DA] cursor-pointer bg-white text-[#6B6662] transition-all active:scale-[0.98]"
                            >
                              NO
                            </button>
                          </div>
                          <p className="text-[10px] text-[#9B9590] m-0 mt-2 text-center">
                            NO를 선택해도 신청은 가능합니다
                          </p>
                        </div>
                      )}

                      {selectedTicketType === 'urgent' && urgentPaidOk !== null && !showUrgentConfirm && (
                        <div className={`p-3 rounded-xl text-xs text-center ${
                          urgentPaidOk
                            ? 'bg-[rgba(255,138,101,0.1)] text-[#FF8A65]'
                            : 'bg-[#F5F1ED] text-[#6B6662]'
                        }`}>
                          {urgentPaidOk ? '유료 동의 후 긴급 신청' : '유료 미동의 긴급 신청'}
                          <button
                            onClick={() => { setShowUrgentConfirm(true); setUrgentPaidOk(null); }}
                            className="ml-2 underline bg-transparent border-0 cursor-pointer text-inherit p-0 text-xs"
                          >
                            변경
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold border-0 transition-all ${
                      canSubmit
                        ? 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] cursor-pointer active:scale-[0.98]'
                        : 'bg-[#E6E0DA] text-[#6B6662]'
                    }`}
                  >
                    {submitting ? '신청 중...' : '상담 신청하기'}
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Update Notice */}
          <div className="text-center py-4">
            <p className="text-xs text-[#9B9590] m-0">업데이트 예정입니다.</p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-[rgba(245,241,237,0.78)] backdrop-blur-[14px] border-t border-[rgba(230,224,218,0.9)] px-2.5 py-2.5 pb-3 z-20">
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { icon: '2026', label: '연간', path: '/2026' },
              { icon: '🐇', label: '이번달', path: '/quest' },
              { icon: '●', label: '홈', path: '/premium-home' },
              { icon: '✦', label: '우주', path: '/premium-fortune', active: true },
              { icon: '☺', label: '나', path: '/me' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px] border ${
                  item.active ? 'border-[rgba(191,167,255,0.35)] bg-white/45' : 'border-transparent'
                }`}
              >
                <div
                  className={`w-[34px] h-7 rounded-xl grid place-items-center text-sm ${
                    item.active
                      ? 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.92)] border-transparent text-[rgba(31,31,31,0.92)]'
                      : 'bg-white/55 border border-[rgba(230,224,218,0.9)]'
                  }`}
                >
                  {item.icon}
                </div>
                <div
                  className={`text-[11px] tracking-tight ${
                    item.active ? 'text-[rgba(42,39,37,0.92)] font-bold' : 'text-[rgba(42,39,37,0.70)]'
                  }`}
                >
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}