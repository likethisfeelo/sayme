'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAccessToken } from '../../utils/auth';

function QuestDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questId = searchParams.get('id');

  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!questId) {
      router.push('/quest');
      return;
    }
    fetchQuestDetail();
  }, [questId, router]);

  const fetchQuestDetail = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/quest/detail/${questId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setQuest(data.quest);
        setAnswer(data.quest.userAnswer || '');
      }
    } catch (error) {
      console.error('Quest detail fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert('답변을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const token = getAccessToken();
      const response = await fetch(
        `https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/quest/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questId,
            answer: answer.trim(),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('답변이 저장되었습니다!');
        fetchQuestDetail(); // Refresh quest data
      } else {
        alert('저장 실패: ' + (data.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('저장 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!answer.trim()) {
      alert('답변을 먼저 입력해주세요');
      return;
    }

    const confirmed = confirm('Quest를 완료하시겠습니까? 완료 후에는 수정할 수 없습니다.');
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const token = getAccessToken();
      const response = await fetch(
        `https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/quest/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questId,
            answer: answer.trim(),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('🎉 Quest 완료! 보상이 지급되었습니다.');
        router.push('/quest');
      } else {
        alert('완료 실패: ' + (data.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Complete error:', error);
      alert('완료 처리 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED'
      }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6662]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), #F5F1ED'
      }}>
        <div className="text-center px-4">
          <p className="text-[#6B6662] mb-4">Quest를 찾을 수 없습니다</p>
          <button
            onClick={() => router.push('/quest')}
            className="px-6 py-2.5 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-sm"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = quest.status === 'completed';
  const canEdit = quest.status === 'active';

  return (
    <div className="min-h-screen" style={{
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
      background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
      color: '#2A2725',
    }}>
      
      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
          <button
            onClick={() => router.push('/quest')}
            className="text-[#2A2725] hover:text-[#BFA7FF] transition-colors"
          >
            ← 목록
          </button>
          
          <div className="flex flex-col items-center gap-0.5 leading-none">
            <div className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
              Quest Detail
            </div>
            <div className="text-xs text-[#6B6662]">
              {isCompleted ? '완료됨' : '진행 중'}
            </div>
          </div>
          
          <div className="w-12" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-12 max-w-[430px] mx-auto">
        
        {/* Quest Info */}
        <section className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">
                {isCompleted ? '✅' : '▶️'}
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${
                isCompleted
                  ? 'bg-[rgba(46,139,87,0.15)] text-[rgba(46,139,87,0.95)] border-[rgba(46,139,87,0.25)]'
                  : 'bg-[rgba(123,203,255,0.15)] text-[rgba(123,203,255,0.95)] border-[rgba(123,203,255,0.25)]'
              }`}>
                {isCompleted ? '완료' : '진행 중'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-[#2A2725] mb-3 leading-tight">
              {quest.title}
            </h1>

            {/* Description */}
            <p className="text-sm text-[#6B6662] leading-relaxed mb-4 whitespace-pre-line">
              {quest.description}
            </p>

            {/* Reward */}
            {quest.reward && (
              <div className="mt-4 p-3 bg-[rgba(191,167,255,0.1)] rounded-xl border border-[rgba(191,167,255,0.2)]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  <div className="flex-1">
                    <div className="text-xs text-[#6B6662] mb-0.5">완료 시 보상</div>
                    <div className="text-sm font-semibold text-[#2A2725]">{quest.reward}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Answer Section */}
        <section className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <h2 className="text-lg font-bold text-[#2A2725] mb-4">
              {isCompleted ? '제출한 답변' : '답변 작성'}
            </h2>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isCompleted}
              placeholder="여기에 답변을 작성해주세요..."
              className="w-full min-h-[200px] p-4 bg-white border border-[#E6E0DA] rounded-xl text-sm text-[#2A2725] placeholder-[#6B6662] resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(191,167,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: 'inherit' }}
            />

            <div className="mt-2 text-xs text-[#6B6662] text-right">
              {answer.length} / 1000자
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        {canEdit && (
          <section className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || !answer.trim()}
              className="w-full py-4 bg-white border border-[#E6E0DA] text-[#2A2725] rounded-[14px] font-bold text-sm hover:bg-[rgba(191,167,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '저장 중...' : '💾 임시 저장'}
            </button>

            <button
              onClick={handleComplete}
              disabled={submitting || !answer.trim()}
              className="w-full py-4 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-sm shadow-[0_10px_22px_rgba(123,203,255,0.18)] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '완료 처리 중...' : '🎯 Quest 완료하기'}
            </button>

            <p className="text-xs text-[#6B6662] text-center leading-relaxed">
              완료 후에는 답변을 수정할 수 없습니다
            </p>
          </section>
        )}

        {/* Completed Info */}
        {isCompleted && (
          <section className="mt-6">
            <div className="bg-gradient-to-br from-[rgba(46,139,87,0.1)] to-[rgba(169,180,160,0.1)] border border-[rgba(46,139,87,0.2)] rounded-[18px] p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-[#2A2725] mb-2">
                Quest 완료!
              </h3>
              <p className="text-sm text-[#6B6662] mb-4">
                {quest.completedAt && (
                  <>완료 일시: {new Date(quest.completedAt).toLocaleString('ko-KR')}</>
                )}
              </p>
              <button
                onClick={() => router.push('/quest')}
                className="px-6 py-2.5 bg-[#2A2725] text-white rounded-[14px] font-semibold text-sm"
              >
                다른 Quest 보기
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

export default function QuestDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), #F5F1ED'
      }}>
        <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <QuestDetailContent />
    </Suspense>
  );
}