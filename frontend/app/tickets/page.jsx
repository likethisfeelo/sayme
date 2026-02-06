'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center">
        <div className="text-sm text-[#6B6662]">불러오는 중...</div>
      </div>
    );
  }

  const regularTickets = tickets.filter(t => t.ticketType !== 'consultation');
  const consultationTicket = tickets.find(t => t.ticketType === 'consultation');
  const hasAnyTicket = tickets.some(t => t.count > 0);

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
          {/* Summary */}
          <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(255,193,217,0.18)] to-[rgba(123,203,255,0.15)] bg-white/70 border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="p-5 text-center">
              <div className="text-xs text-[#6B6662] mb-1">보유 중인 티켓</div>
              <div className="text-3xl font-[750] text-[#2A2725]">
                {tickets.reduce((sum, t) => sum + (t.count || 0), 0)}
                <span className="text-base font-normal text-[#6B6662] ml-1">장</span>
              </div>
              {hasAnyTicket && (
                <p className="text-xs text-[#6B6662] mt-2 m-0">
                  이번 달 말까지 유효합니다
                </p>
              )}
            </div>
          </section>

          {/* Ticket Cards */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">이벤트 티켓</div>
              <div className="text-xs text-[#6B6662] mt-0.5">관리자가 부여한 특별 이벤트</div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {regularTickets.map((ticket) => (
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

              {regularTickets.length === 0 && (
                <div className="text-center py-6 text-sm text-[#6B6662]">
                  아직 부여된 티켓이 없습니다.
                </div>
              )}
            </div>
          </section>

          {/* 1:1 Consultation */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="p-4">
              <div className="text-sm font-[750] tracking-tight text-[#2A2725] mb-3">1:1 상담</div>
              {consultationTicket?.count > 0 ? (
                <button
                  onClick={() => router.push('/premium_memo')}
                  className="w-full py-3.5 rounded-xl text-sm font-bold border-0 cursor-pointer bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] transition-transform active:scale-[0.98]"
                >
                  💬 1:1 추가 상담 요청 ({consultationTicket.count}회)
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl text-sm font-medium border-0 bg-[#E6E0DA] text-[#6B6662] opacity-60"
                >
                  💬 1:1 추가 상담 (미보유)
                </button>
              )}
            </div>
          </section>

          {/* Info */}
          <div className="text-xs text-[#9B9590] leading-relaxed px-1">
            <p className="m-0">* 티켓은 관리자가 개인별로 부여합니다.</p>
            <p className="m-0 mt-1">* 모든 티켓은 발급된 달의 말일까지 유효합니다.</p>
            <p className="m-0 mt-1">* 사용하지 않은 티켓은 자동으로 소멸됩니다.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
