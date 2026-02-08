'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
];

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Consultation form
  const [preferredDate1, setPreferredDate1] = useState('');
  const [preferredTime1, setPreferredTime1] = useState('');
  const [preferredDate2, setPreferredDate2] = useState('');
  const [preferredTime2, setPreferredTime2] = useState('');
  const [selectedTicketType, setSelectedTicketType] = useState(null);

  // Urgent confirm
  const [showUrgentConfirm, setShowUrgentConfirm] = useState(false);
  const [urgentPaidOk, setUrgentPaidOk] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const idToken = localStorage.getItem('idToken');
        if (!idToken) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_BASE}/ticket`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await response.json();
        if (data.success) {
          setTickets(data.tickets || []);
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [router]);

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

      const raw = await response.json();

      // API Gateway non-proxy integration인 경우 Lambda 응답이 감싸져 옴
      // { statusCode: 200, headers: {...}, body: "{...}" }
      let data;
      if (raw.body && typeof raw.body === 'string') {
        try { data = JSON.parse(raw.body); } catch { data = raw; }
      } else {
        data = raw;
      }

      if (data.success) {
        // Visually consume the ticket
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
        // Reset form
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

  const getTicketIcon = (type) => {
    const icons = { tarot: '🎴', fortune: '🔮', universe: '🌌', consultation: '💬' };
    return icons[type] || '🎫';
  };

  const getTicketName = (type) => {
    const names = { tarot: '타로', fortune: '사주체크', universe: '우주흐름체크', consultation: '1:1 추가 상담' };
    return names[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center">
        <div className="text-sm text-[#6B6662]">불러오는 중...</div>
      </div>
    );
  }

  const regularTickets = tickets.filter(t => t.ticketType !== 'consultation');
  const consultationTicket = tickets.find(t => t.ticketType === 'consultation');

  return (
    <div className="min-h-screen bg-[#F5F1ED] flex justify-center">
      <div className="w-full max-w-[430px] relative">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[rgba(245,241,237,0.85)] backdrop-blur-[14px] border-b border-[#E6E0DA]">
          <div className="flex items-center px-4 py-3.5">
            <button
              onClick={() => router.push('/premium-home')}
              className="text-sm text-[#2A2725] bg-transparent border-0 cursor-pointer p-0 mr-3"
            >
              ← 돌아가기
            </button>
            <h1 className="text-base font-[750] tracking-tight text-[#2A2725] m-0">
              나의 티켓
            </h1>
          </div>
        </header>

        <main className="px-4 pt-5 pb-8 flex flex-col gap-4">
          {/* ===== Event Tickets: 보유 현황 ===== */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">이벤트 티켓 : 보유 현황</div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.ticketType}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl border ${
                    ticket.count > 0
                      ? 'border-[rgba(191,167,255,0.4)] bg-gradient-to-br from-[rgba(191,167,255,0.12)] to-[rgba(123,203,255,0.08)]'
                      : 'border-[#E6E0DA] bg-[#F5F1ED]/50 opacity-50'
                  }`}
                >
                  <div className="text-3xl flex-shrink-0">{ticket.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#2A2725]">{ticket.name}</div>
                    <div className="text-xs text-[#6B6662] mt-0.5">
                      {ticket.count > 0 ? `${ticket.count}회 사용 가능` : '미보유'}
                    </div>
                    {ticket.expiresAt && ticket.count > 0 && (
                      <div className="text-[10px] text-[#9B9590] mt-0.5">
                        만료: {new Date(ticket.expiresAt).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>
                  {ticket.count > 0 && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(191,167,255,0.9)] text-white text-sm font-bold flex items-center justify-center">
                      {ticket.count}
                    </div>
                  )}
                </div>
              ))}

              {tickets.length === 0 && (
                <div className="text-center py-6 text-sm text-[#6B6662]">
                  아직 부여된 티켓이 없습니다.
                </div>
              )}
            </div>
          </section>

          {/* ===== 1:1 상담 신청 ===== */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">1:1 상담 신청</div>
              <div className="text-xs text-[#6B6662] mt-0.5">희망 날짜와 시간을 선택하세요</div>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Error Message */}
              {submitError && (
                <div className="p-3 rounded-xl bg-red-100 text-red-800 text-sm">
                  {submitError}
                </div>
              )}

              {/* Success Message */}
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

                  {/* 날짜/시간 입력 완료 안내 */}
                  {!datesReady && (
                    <div className="p-3 rounded-xl bg-[rgba(191,167,255,0.08)] border border-[rgba(191,167,255,0.2)] text-xs text-[#6B6662] text-center">
                      희망 날짜와 시간을 모두 입력하면 티켓을 선택할 수 있어요
                    </div>
                  )}

                  {/* 티켓 선택 (날짜/시간 모두 입력 후 표시) */}
                  {datesReady && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-[#6B6662]">사용할 티켓 선택</label>

                      <div className="flex flex-col gap-2">
                        {/* 보유 티켓 목록 */}
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

                        {/* 급해서 일단 신청 */}
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

                      {/* Urgent Confirm Dialog */}
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

                      {/* Urgent choice result */}
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

                  {/* Submit */}
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

          {/* Info */}
          <div className="text-xs text-[#9B9590] leading-relaxed px-1">
            <p className="m-0">* 티켓은 관리자가 개인별로 부여합니다.</p>
            <p className="m-0 mt-1">* 모든 티켓은 발급된 달의 말일까지 유효합니다.</p>
            <p className="m-0 mt-1">* 상담 신청 후 관리자 확인을 거쳐 확정됩니다.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
