'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { isAdmin } from '../../../lib/auth/checkAdmin';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const TICKET_TYPES = [
  { value: 'tarot', label: '타로', icon: '🎴' },
  { value: 'fortune', label: '사주체크', icon: '🔮' },
  { value: 'universe', label: '우주흐름체크', icon: '🌌' },
  { value: 'consultation', label: '1:1 추가 상담', icon: '💬' },
];

export default function AdminTicketsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [ticketType, setTicketType] = useState('tarot');
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/me');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleAssign = async () => {
    if (!targetUserId) {
      setMessage({ type: 'error', text: '사용자 ID를 입력해주세요' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/ticket/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUserId,
          ticketType,
          count: Number(count),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const ticketInfo = TICKET_TYPES.find((t) => t.value === ticketType);
        setMessage({
          type: 'success',
          text: `${ticketInfo?.label} 티켓 ${count}장이 부여되었습니다`,
        });
      } else {
        setMessage({ type: 'error', text: data.message || '부여에 실패했습니다' });
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      setMessage({ type: 'error', text: '부여에 실패했습니다' });
    } finally {
      setSaving(false);
    }
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
          subtitle="관리자 · 티켓 부여"
          showBackButton
          onBack={() => router.push('/admin')}
        />

        <main className="flex-1 px-4 py-4 pb-8">
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <h2 className="text-sm font-bold text-[#2A2725] mb-4">사용자에게 티켓 부여</h2>

            {message.text && (
              <div
                className={`p-3 rounded-xl mb-4 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Target User ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">사용자 ID (Cognito sub)</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="예: 12345678-1234-1234-1234-123456789012"
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
              </div>

              {/* Ticket Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">티켓 종류</label>
                <div className="grid grid-cols-2 gap-2">
                  {TICKET_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setTicketType(type.value)}
                      className={`p-3 rounded-xl border text-sm flex items-center gap-2 transition-all ${
                        ticketType === type.value
                          ? 'border-[#BFA7FF] bg-[rgba(191,167,255,0.15)]'
                          : 'border-[#E6E0DA] bg-white/80'
                      }`}
                    >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">수량</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
                <p className="text-xs text-[#6B6662]">0으로 설정하면 티켓이 제거됩니다</p>
              </div>

              {/* Assign Button */}
              <button
                onClick={handleAssign}
                disabled={saving}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                  saving
                    ? 'bg-[#E6E0DA] text-[#6B6662]'
                    : 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f]'
                }`}
              >
                {saving ? '부여 중...' : '티켓 부여'}
              </button>
            </div>
          </section>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs text-yellow-800">
              ℹ️ 티켓은 발행된 월의 마지막 날까지 유효합니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}