'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { isAdmin } from '../../../lib/auth/checkAdmin';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

export default function AdminGoalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [goalForm, setGoalForm] = useState({
    // 월간 목표
    keyword: '',
    direction: '',
    sentence3: '',
    // 주간 목표
    weeklyKeyword: '',
    weeklyDirection: '',
    weeklySentence3: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/me');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleSave = async () => {
    if (!targetUserId || !month) {
      setMessage({ type: 'error', text: '사용자 ID와 월은 필수입니다' });
      return;
    }

    if (!goalForm.keyword && !goalForm.weeklyKeyword) {
      setMessage({ type: 'error', text: '월간 또는 주간 키워드 중 하나는 필수입니다' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/premium-home/user-goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: targetUserId,
          month,
          // 월간 목표
          keyword: goalForm.keyword,
          direction: goalForm.direction,
          sentence3: goalForm.sentence3,
          // 주간 목표
          weeklyKeyword: goalForm.weeklyKeyword,
          weeklyDirection: goalForm.weeklyDirection,
          weeklySentence3: goalForm.weeklySentence3,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '목표가 저장되었습니다' });
        setGoalForm({
          keyword: '',
          direction: '',
          sentence3: '',
          weeklyKeyword: '',
          weeklyDirection: '',
          weeklySentence3: '',
        });
      } else {
        setMessage({ type: 'error', text: data.message || '저장에 실패했습니다' });
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
      setMessage({ type: 'error', text: '저장에 실패했습니다' });
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
          subtitle="관리자 · 목표 관리"
          showBackButton
          onBack={() => router.push('/admin')}
        />

        <main className="flex-1 px-4 py-4 pb-8 flex flex-col gap-4">
          {/* 기본 정보 */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <h2 className="text-sm font-bold text-[#2A2725] mb-4">기본 정보</h2>

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

              {/* Month */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">월 (YYYY-MM)</label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
              </div>
            </div>
          </section>

          {/* 월간 목표 */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <h2 className="text-sm font-bold text-[#2A2725] mb-4">📅 월간 목표</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">월간 키워드</label>
                <input
                  type="text"
                  value={goalForm.keyword}
                  onChange={(e) => setGoalForm({ ...goalForm, keyword: e.target.value })}
                  placeholder="예: 명료함"
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">월간 방향</label>
                <input
                  type="text"
                  value={goalForm.direction}
                  onChange={(e) => setGoalForm({ ...goalForm, direction: e.target.value })}
                  placeholder="예: 흐트러진 생각을 정리하는"
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">월간 문장 3</label>
                <input
                  type="text"
                  value={goalForm.sentence3}
                  onChange={(e) => setGoalForm({ ...goalForm, sentence3: e.target.value })}
                  placeholder="예: 차분하게 선택하는"
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
              </div>
            </div>
          </section>

          {/* 주간 목표 */}
          <section className="bg-gradient-to-br from-[rgba(191,167,255,0.15)] to-[rgba(123,203,255,0.1)] backdrop-blur-sm border border-[rgba(191,167,255,0.3)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <h2 className="text-sm font-bold text-[#2A2725] mb-4">📆 주간 목표</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">주간 키워드</label>
                <input
                  type="text"
                  value={goalForm.weeklyKeyword}
                  onChange={(e) => setGoalForm({ ...goalForm, weeklyKeyword: e.target.value })}
                  placeholder="예: 집중"
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">주간 방향</label>
                <input
                  type="text"
                  value={goalForm.weeklyDirection}
                  onChange={(e) => setGoalForm({ ...goalForm, weeklyDirection: e.target.value })}
                  placeholder="예: 한 가지에 깊이 몰입하는"
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B6662]">주간 문장 3</label>
                <input
                  type="text"
                  value={goalForm.weeklySentence3}
                  onChange={(e) => setGoalForm({ ...goalForm, weeklySentence3: e.target.value })}
                  placeholder="예: 작은 성취를 쌓는"
                  className="p-3 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
              saving
                ? 'bg-[#E6E0DA] text-[#6B6662]'
                : 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f]'
            }`}
          >
            {saving ? '저장 중...' : '월간 + 주간 목표 저장'}
          </button>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs text-yellow-800">
              ℹ️ 사용자 ID는 Cognito의 sub 값입니다. AWS 콘솔 또는 DynamoDB에서 확인할 수 있습니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
