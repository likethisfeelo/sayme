'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { isAdmin } from '../../../lib/auth/checkAdmin';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const STATUS_CONFIG = {
  pending: { label: '대기 중', color: 'text-[#6B6662]', bg: 'bg-[#E6E0DA]' },
  confirmed: { label: '확정', color: 'text-[#2E8B57]', bg: 'bg-[rgba(46,139,87,0.15)]' },
  completed: { label: '완료', color: 'text-[#BFA7FF]', bg: 'bg-[rgba(191,167,255,0.15)]' },
  cancelled: { label: '취소됨', color: 'text-[#999]', bg: 'bg-[#f5f5f5]' },
};

const TICKET_NAMES = {
  tarot: '🎴 타로',
  fortune: '🔮 사주체크',
  universe: '🌌 우주흐름체크',
  consultation: '💬 1:1 추가 상담',
  urgent: '🚨 급해서 일단 신청',
};

export default function AdminConsultationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/me');
      return;
    }
    fetchRequests();
  }, [router, statusFilter]);

  const fetchRequests = async () => {
    try {
      const idToken = localStorage.getItem('idToken');
      const url = statusFilter === 'all'
        ? `${API_BASE}/consultation/admin`
        : `${API_BASE}/consultation/admin?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const backgroundStyle = {
    background:
      'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
    color: '#2A2725',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
        <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
        <Header
          subtitle="관리자 · 상담 요청"
          showBackButton
          onBack={() => router.push('/admin')}
        />

        <main className="flex-1 px-4 py-4 pb-8">
          {/* Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? 'bg-[#2A2725] text-white'
                    : 'bg-white/70 border border-[#E6E0DA] text-[#6B6662]'
                }`}
              >
                {status === 'all' ? '전체' : STATUS_CONFIG[status]?.label || status}
              </button>
            ))}
          </div>

          {/* Requests List */}
          {requests.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-8 text-center">
              <p className="text-sm text-[#6B6662]">상담 요청이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((req) => {
                const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={req.requestId}
                    className={`bg-white/70 backdrop-blur-sm border shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4 ${
                      req.isUrgent ? 'border-[#FF8A65]' : 'border-[#E6E0DA]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                        {req.isUrgent && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(255,138,101,0.15)] text-[#FF8A65]">
                            🚨 긴급
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {req.ticketType && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[rgba(191,167,255,0.15)] text-[#7B6CB5]">
                            {TICKET_NAMES[req.ticketType] || req.ticketType}
                          </span>
                        )}
                        {req.isUrgent && req.urgentPaidOk && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[rgba(255,138,101,0.15)] text-[#FF8A65]">
                            유료 동의
                          </span>
                        )}
                        {req.isUrgent && req.urgentPaidOk === false && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#F5F1ED] text-[#9B9590]">
                            유료 미동의
                          </span>
                        )}
                        {!req.isUrgent && req.isPaidOk && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[rgba(255,193,217,0.3)] text-[#e57399]">
                            유료 희망
                          </span>
                        )}
                      </div>
                    </div>

                    {/* User ID */}
                    <div className="text-xs text-[#6B6662] mb-2 font-mono bg-[#F5F1ED] p-2 rounded-lg overflow-hidden text-ellipsis">
                      {req.userId}
                    </div>

                    {/* Ticket consumed status */}
                    {req.ticketType && req.ticketType !== 'urgent' && (
                      <div className={`text-xs mb-2 px-2 py-1 rounded-lg inline-block ${
                        req.ticketConsumed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {req.ticketConsumed ? '티켓 소진 완료' : '티켓 소진 대기'}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 text-sm">
                      <div className="flex gap-2">
                        <span className="text-[#6B6662] w-12">1순위</span>
                        <span className="text-[#2A2725] font-medium">
                          {formatDate(req.preferredDate1)} {req.preferredTime1}
                        </span>
                      </div>
                      {req.preferredDate2 && (
                        <div className="flex gap-2">
                          <span className="text-[#6B6662] w-12">2순위</span>
                          <span className="text-[#2A2725]">
                            {formatDate(req.preferredDate2)} {req.preferredTime2}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#E6E0DA] flex justify-between items-center">
                      <span className="text-xs text-[#6B6662]">
                        접수: {formatDate(req.createdAt)}
                      </span>
                      <span className="text-xs text-[#6B6662]">
                        ID: {req.requestId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}