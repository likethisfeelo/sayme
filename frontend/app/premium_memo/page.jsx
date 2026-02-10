﻿﻿'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';
const MAX_CONTENT_LENGTH = 1000;

export default function PremiumMemoPage() {
  const router = useRouter();
  const [memoContent, setMemoContent] = useState('');
  const [monthlyMemos, setMonthlyMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const isCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  };

  useEffect(() => {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) {
      router.push('/login');
      return;
    }
    fetchMonthlyMemos();
  }, [router]);

  const fetchMonthlyMemos = async () => {
    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/memo`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (data.success) {
        const filtered = (data.memos || []).filter((m) => isCurrentMonth(m.createdAt));
        setMonthlyMemos(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch monthly memos:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMemo = async (memoId) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    setDeletingId(memoId);
    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/memo/${memoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setMonthlyMemos((prev) => prev.filter((m) => m.memoId !== memoId));
      } else {
        alert(data.message || '삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete memo:', error);
      alert('삭제에 실패했습니다');
    } finally {
      setDeletingId(null);
    }
  };

  const saveMemo = async () => {
    if (!memoContent.trim()) return;
    setSaving(true);
    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/memo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ content: memoContent }),
      });
      const data = await response.json();
      if (data.success) {
        setMemoContent('');
        fetchMonthlyMemos();
      } else {
        alert(data.message || '저장에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to save memo:', error);
      alert('저장에 실패했습니다');
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
          subtitle="나다움 메모"
          showBackButton
          onBack={() => router.back()}
        />

        <main className="flex-1 px-4 py-4 pb-32 flex flex-col gap-4">
          {/* Memo Input */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <div className="text-sm font-bold text-[#2A2725] mb-3">
              오늘의 나다움에 대한 생각
            </div>
            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
              placeholder="오늘 느낀 나다움에 대해 자유롭게 적어보세요..."
              className="w-full h-32 p-3 rounded-xl border border-[#E6E0DA] bg-white/80 resize-none text-sm focus:outline-none focus:border-[#BFA7FF]"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-[#6B6662]">
                {memoContent.length} / {MAX_CONTENT_LENGTH}자
              </span>
              <button
                onClick={saveMemo}
                disabled={saving || !memoContent.trim()}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  saving || !memoContent.trim()
                    ? 'bg-[#E6E0DA] text-[#6B6662]'
                    : 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f]'
                }`}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </section>

          {/* Monthly Memos */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">
                {currentMonth + 1}월 작성한 메모 ({monthlyMemos.length}개)
              </div>
              <div className="text-xs text-[#6B6662] mt-0.5">
                {currentYear}년 {currentMonth + 1}월 1일 ~ {currentMonth + 1}월 {new Date(currentYear, currentMonth + 1, 0).getDate()}일
              </div>
            </div>

            <div className="p-4 flex flex-col gap-2">
              {monthlyMemos.length === 0 ? (
                <div className="text-center py-6 text-sm text-[#6B6662]">
                  이번 달 작성한 메모가 없습니다.
                </div>
              ) : (
                monthlyMemos.map((memo) => (
                  <div
                    key={memo.memoId}
                    className="p-3 bg-white/60 rounded-xl border border-[rgba(230,224,218,0.9)]"
                  >
                    <p className="text-sm text-[#2A2725] whitespace-pre-wrap m-0">{memo.content}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-[#6B6662]">
                        {new Date(memo.createdAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(memo.createdAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        onClick={() => deleteMemo(memo.memoId)}
                        disabled={deletingId === memo.memoId}
                        className="text-xs text-[#999] hover:text-red-500 bg-transparent border-0 cursor-pointer p-0 transition-colors"
                      >
                        {deletingId === memo.memoId ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}