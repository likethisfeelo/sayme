'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { questUserApi } from '@/lib/api/quest';

function QuestDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questId = searchParams.get('id');

  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
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
      const idToken = localStorage.getItem('idToken');
      if (!idToken) {
        router.push('/login');
        return;
      }
      const data = await questUserApi.getContentDetail(questId, idToken);
      if (data?.success) {
        const content = data.content || {};
        const assignment = data.assignment || {};
        const userResponse = data.userResponse || null;

        const questData = {
          assignmentId: assignment.assignmentId || questId,
          title: content.title || '제목 없음',
          description: content.description || '',
          reward: content.reward,
          metadata: content.metadata || {},
          contentItems: content.contentItems || [],
          status: userResponse?.status || 'in_progress',
          completedAt: userResponse?.completedAt,
        };

        setQuest(questData);

        // 기존 응답 복원 또는 빈 배열 초기화
        if (userResponse?.responses && userResponse.responses.length > 0) {
          setResponses(userResponse.responses);
        } else {
          setResponses(questData.contentItems.map(() => null));
        }
      }
    } catch (error) {
      console.error('Quest detail fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (index, value) => {
    setResponses(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSave = async (finalStatus = 'in_progress') => {
    setSubmitting(true);
    try {
      const idToken = localStorage.getItem('idToken');
      if (!idToken) {
        router.push('/login');
        return;
      }

      const result = await questUserApi.saveResponse(
        quest?.assignmentId || questId,
        {
          assignmentId: quest?.assignmentId || questId,
          responses,
          status: finalStatus,
        },
        idToken
      );

      if (result?.response || result?.message) {
        if (finalStatus === 'completed') {
          alert('Quest 완료!');
          router.push('/quest');
        } else {
          alert('답변이 저장되었습니다!');
          fetchQuestDetail();
        }
      } else {
        alert('저장 실패: ' + (result?.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = () => {
    // 객관식 질문 중 답변 안 한 것 체크
    const questionItems = (quest?.contentItems || []).filter(
      item => item.type === 'question_objective' || item.type === 'question_subjective'
    );
    const unanswered = questionItems.some((item, idx) => {
      const itemIndex = quest.contentItems.indexOf(item);
      return !responses[itemIndex];
    });

    if (unanswered) {
      alert('모든 질문에 답변해주세요');
      return;
    }

    const confirmed = confirm('Quest를 완료하시겠습니까? 완료 후에는 수정할 수 없습니다.');
    if (!confirmed) return;

    handleSave('completed');
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
        }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6662]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), #F5F1ED',
        }}
      >
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
  const canEdit = quest.status !== 'completed';

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        color: '#2A2725',
      }}
    >
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
            <div className="text-xs text-[#6B6662]">{isCompleted ? '완료됨' : '진행 중'}</div>
          </div>

          <div className="w-12" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-12 max-w-[430px] mx-auto">
        {/* Quest Info */}
        <section className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{isCompleted ? '✅' : '▶️'}</span>
              <span
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${
                  isCompleted
                    ? 'bg-[rgba(46,139,87,0.15)] text-[rgba(46,139,87,0.95)] border-[rgba(46,139,87,0.25)]'
                    : 'bg-[rgba(123,203,255,0.15)] text-[rgba(123,203,255,0.95)] border-[rgba(123,203,255,0.25)]'
                }`}
              >
                {isCompleted ? '완료' : '진행 중'}
              </span>
              {quest.metadata?.estimatedTime && (
                <span className="text-xs text-[#6B6662] ml-auto">
                  ⏱ {quest.metadata.estimatedTime}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-[#2A2725] mb-3 leading-tight">{quest.title}</h1>

            {quest.description && (
              <p className="text-sm text-[#6B6662] leading-relaxed whitespace-pre-line">
                {quest.description}
              </p>
            )}
          </div>
        </section>

        {/* Content Items */}
        {quest.contentItems.map((item, index) => (
          <section key={index} className="mb-4">
            <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">

              {/* 객관식 질문 */}
              {item.type === 'question_objective' && (
                <>
                  <div className="flex items-start gap-2 mb-4">
                    <span className="text-xs font-bold text-white bg-[rgba(191,167,255,0.85)] rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {quest.contentItems.slice(0, index).filter(i => i.type.startsWith('question')).length + 1}
                    </span>
                    <p className="text-sm font-semibold text-[#2A2725] leading-relaxed">
                      {item.question}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {(item.options || []).map((option, optIdx) => {
                      const isSelected = responses[index] === option;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => canEdit && handleResponseChange(index, option)}
                          disabled={!canEdit}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                            isSelected
                              ? 'bg-[rgba(191,167,255,0.15)] border-[rgba(191,167,255,0.5)] text-[#2A2725] font-semibold'
                              : 'bg-white border-[#E6E0DA] text-[#6B6662] hover:border-[rgba(191,167,255,0.3)]'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          <span className="mr-2 text-xs">{String.fromCharCode(65 + optIdx)}.</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 주관식 질문 */}
              {item.type === 'question_subjective' && (
                <>
                  <div className="flex items-start gap-2 mb-4">
                    <span className="text-xs font-bold text-white bg-[rgba(191,167,255,0.85)] rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {quest.contentItems.slice(0, index).filter(i => i.type.startsWith('question')).length + 1}
                    </span>
                    <p className="text-sm font-semibold text-[#2A2725] leading-relaxed">
                      {item.question}
                    </p>
                  </div>
                  <textarea
                    value={responses[index] || ''}
                    onChange={(e) => handleResponseChange(index, e.target.value)}
                    disabled={!canEdit}
                    placeholder="답변을 입력해주세요..."
                    className="w-full min-h-[120px] p-4 bg-white border border-[#E6E0DA] rounded-xl text-sm text-[#2A2725] placeholder-[#6B6662] resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(191,167,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'inherit' }}
                  />
                </>
              )}

              {/* 텍스트(안내문) */}
              {item.type === 'text' && (
                <div className="text-sm text-[#2A2725] leading-relaxed whitespace-pre-line">
                  {item.title && (
                    <h3 className="font-bold mb-3 text-base">{item.title}</h3>
                  )}
                  {item.description}
                </div>
              )}
            </div>
          </section>
        ))}

        {/* Action Buttons */}
        {canEdit && (
          <section className="space-y-3 mt-6">
            <button
              onClick={() => handleSave('in_progress')}
              disabled={submitting}
              className="w-full py-4 bg-white border border-[#E6E0DA] text-[#2A2725] rounded-[14px] font-bold text-sm hover:bg-[rgba(191,167,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '저장 중...' : '💾 임시 저장'}
            </button>

            <button
              onClick={handleComplete}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-sm shadow-[0_10px_22px_rgba(123,203,255,0.18)] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '완료 처리 중...' : '🎯 Quest 완료하기'}
            </button>

            <p className="text-xs text-[#6B6662] text-center leading-relaxed">완료 후에는 답변을 수정할 수 없습니다</p>
          </section>
        )}

        {/* Completed Info */}
        {isCompleted && (
          <section className="mt-6">
            <div className="bg-gradient-to-br from-[rgba(46,139,87,0.1)] to-[rgba(169,180,160,0.1)] border border-[rgba(46,139,87,0.2)] rounded-[18px] p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-[#2A2725] mb-2">Quest 완료!</h3>
              <p className="text-sm text-[#6B6662] mb-4">
                {quest.completedAt && <>완료 일시: {new Date(quest.completedAt).toLocaleString('ko-KR')}</>}
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
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), #F5F1ED',
          }}
        >
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <QuestDetailContent />
    </Suspense>
  );
}
