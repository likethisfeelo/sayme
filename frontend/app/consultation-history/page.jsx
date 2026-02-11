'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const STATUS_CONFIG = {
  pending: { label: '대기 중', color: 'text-[#6B6662]', bg: 'bg-[#E6E0DA]' },
  confirmed: { label: '확정', color: 'text-[#2E8B57]', bg: 'bg-[rgba(46,139,87,0.15)]' },
  completed: { label: '완료', color: 'text-[#BFA7FF]', bg: 'bg-[rgba(191,167,255,0.15)]' },
  cancelled: { label: '취소됨', color: 'text-[#999]', bg: 'bg-[#f5f5f5]' },
};

export default function ConsultationHistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) {
      router.push('/login');
      return;
    }
    fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/consultation`, {
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
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
          subtitle="상담 요청 내역"
          showBackButton
          onBack={() => router.back()}
        />

        <main className="flex-1 px-4 py-4 pb-8">
          {requests.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-sm text-[#6B6662]">아직 상담 요청 내역이 없습니다</p>
              <button
                onClick={() => router.push('/premium_memo')}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f]"
              >
                상담 요청하기 →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((req) => {
                const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={req.requestId}
                    className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                      {req.isPaidOk && (
                        <span className="text-xs px-2 py-1 rounded-full bg-[rgba(255,193,217,0.3)] text-[#e57399]">
                          유료 희망
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-[#6B6662] w-16">1순위</span>
                        <span className="text-[#2A2725] font-medium">
                          {formatDate(req.preferredDate1)} {formatTime(req.preferredTime1)}
                        </span>
                      </div>
                      {req.preferredDate2 && (
                        <div className="flex gap-2">
                          <span className="text-[#6B6662] w-16">2순위</span>
                          <span className="text-[#2A2725]">
                            {formatDate(req.preferredDate2)} {formatTime(req.preferredTime2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#E6E0DA]">
                      <span className="text-xs text-[#6B6662]">
                        접수일: {formatDate(req.createdAt)}
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