﻿'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';
const MAX_CONTENT_LENGTH = 1000;

export default function PremiumMemoPage() {
  const router = useRouter();
  const [memoContent, setMemoContent] = useState('');
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    preferredDate1: '',
    preferredTime1: '',
    preferredDate2: '',
    preferredTime2: '',
    isPaidOk: false,
  });
  const [submittingConsultation, setSubmittingConsultation] = useState(false);

  useEffect(() => {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) {
      router.push('/login');
      return;
    }
    fetchMemos();
  }, [router]);

  const fetchMemos = async () => {
    try {
      const idToken = localStorage.getItem('idToken');
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE}/memo?date=${today}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setMemos(data.memos || []);
      }
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    } finally {
      setLoading(false);
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
        fetchMemos();
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

  const submitConsultation = async () => {
    if (!consultationForm.preferredDate1 || !consultationForm.preferredTime1) {
      alert('최소 1개의 희망 날짜와 시간을 선택해주세요');
      return;
    }
    setSubmittingConsultation(true);
    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(consultationForm),
      });
      const data = await response.json();
      if (data.success) {
        alert('상담 요청이 접수되었습니다');
        setShowConsultation(false);
        setConsultationForm({
          preferredDate1: '',
          preferredTime1: '',
          preferredDate2: '',
          preferredTime2: '',
          isPaidOk: false,
        });
      } else {
        alert(data.message || '접수에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to submit consultation:', error);
      alert('접수에 실패했습니다');
    } finally {
      setSubmittingConsultation(false);
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

          {/* Today's Memos */}
          {memos.length > 0 && (
            <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
              <div className="text-sm font-bold text-[#2A2725] mb-3">
                오늘 작성한 메모 ({memos.length}개)
              </div>
              <div className="flex flex-col gap-2">
                {memos.map((memo) => (
                  <div
                    key={memo.memoId}
                    className="p-3 bg-white/60 rounded-xl border border-[rgba(230,224,218,0.9)]"
                  >
                    <p className="text-sm text-[#2A2725] whitespace-pre-wrap">{memo.content}</p>
                    <p className="text-xs text-[#6B6662] mt-2">
                      {new Date(memo.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Consultation Request Button */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <button
              onClick={() => setShowConsultation(!showConsultation)}
              className="w-full py-3 rounded-xl text-sm font-bold bg-[rgba(42,39,37,0.92)] text-[rgba(245,241,237,0.98)] flex items-center justify-center gap-2"
            >
              💬 상담 요청하기
              <span className={`transition-transform ${showConsultation ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Consultation Form */}
            {showConsultation && (
              <div className="mt-4 pt-4 border-t border-[#E6E0DA] flex flex-col gap-4">
                <div className="text-xs text-[#6B6662]">
                  희망하는 상담 날짜와 시간을 선택해주세요
                </div>

                {/* Option 1 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#2A2725]">희망 1순위</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={consultationForm.preferredDate1}
                      onChange={(e) =>
                        setConsultationForm({ ...consultationForm, preferredDate1: e.target.value })
                      }
                      className="flex-1 p-2.5 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                    />
                    <input
                      type="time"
                      value={consultationForm.preferredTime1}
                      onChange={(e) =>
                        setConsultationForm({ ...consultationForm, preferredTime1: e.target.value })
                      }
                      className="w-28 p-2.5 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                    />
                  </div>
                </div>

                {/* Option 2 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#2A2725]">희망 2순위 (선택)</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={consultationForm.preferredDate2}
                      onChange={(e) =>
                        setConsultationForm({ ...consultationForm, preferredDate2: e.target.value })
                      }
                      className="flex-1 p-2.5 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                    />
                    <input
                      type="time"
                      value={consultationForm.preferredTime2}
                      onChange={(e) =>
                        setConsultationForm({ ...consultationForm, preferredTime2: e.target.value })
                      }
                      className="w-28 p-2.5 rounded-xl border border-[#E6E0DA] bg-white/80 text-sm"
                    />
                  </div>
                </div>

                {/* Paid Consultation Checkbox */}
                <label className="flex items-start gap-3 p-3 bg-[rgba(191,167,255,0.1)] rounded-xl border border-[rgba(191,167,255,0.3)]">
                  <input
                    type="checkbox"
                    checked={consultationForm.isPaidOk}
                    onChange={(e) =>
                      setConsultationForm({ ...consultationForm, isPaidOk: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 accent-[#BFA7FF]"
                  />
                  <div>
                    <div className="text-sm font-medium text-[#2A2725]">유료여도 희망합니다</div>
                    <div className="text-xs text-[#6B6662] mt-0.5">
                      체크하시면 유료 상담 우선 배정됩니다
                    </div>
                  </div>
                </label>

                {/* Submit Button */}
                <button
                  onClick={submitConsultation}
                  disabled={submittingConsultation}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                    submittingConsultation
                      ? 'bg-[#E6E0DA] text-[#6B6662]'
                      : 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f]'
                  }`}
                >
                  {submittingConsultation ? '접수 중...' : '상담 요청 접수하기'}
                </button>

                {/* Link to history */}
                <button
                  onClick={() => router.push('/consultation-history')}
                  className="text-sm text-[#6B6662] underline"
                >
                  접수 내역 확인하기 →
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}