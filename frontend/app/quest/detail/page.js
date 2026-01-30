'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { questUserApi } from '@/lib/api/quest';

function QuestDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questId = searchParams.get('id');

  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);

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

        if (userResponse?.responses && userResponse.responses.length > 0) {
          setResponses(userResponse.responses);
          const lastAnswered = userResponse.responses.reduce(
            (last, r, i) => (r != null ? i : last), -1
          );
          setCurrentStep(Math.min(lastAnswered + 1, questData.contentItems.length - 1));
        } else {
          setResponses(questData.contentItems.map(() => null));
          setCurrentStep(0);
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

  const handleNext = () => {
    const items = quest?.contentItems || [];
    const currentItem = items[currentStep];
    if (currentItem?.type?.startsWith('question') && !responses[currentStep]) {
      alert('답변을 선택해주세요');
      return;
    }
    if (currentStep < items.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRequestEdit = () => {
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const url = isMobile
      ? 'http://pf.kakao.com/_xjwsxfb/chat'
      : 'http://pf.kakao.com/_xjwsxfb';
    window.open(url, '_blank');
  };

  const isLastStep = currentStep === (quest?.contentItems?.length || 1) - 1;

  const getQuestionNumber = (items, index) => {
    return items.slice(0, index + 1).filter(i => i.type?.startsWith('question')).length;
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
    const items = quest?.contentItems || [];
    const unanswered = items.some(
      (item, idx) => item.type?.startsWith('question') && !responses[idx]
    );
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
  const items = quest.contentItems || [];
  const totalSteps = items.length;
  const currentItem = items[currentStep];

  const questionNumber = getQuestionNumber(items, currentStep);

  // 완료 상태: 전체 질문-답변 목록 보기
  if (isCompleted) {
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
                {quest.title}
              </div>
              <div className="text-xs text-[#6B6662]">완료됨</div>
            </div>
            <div className="w-12" />
          </div>
        </header>

        <main className="px-4 py-6 pb-12 max-w-[430px] mx-auto">
          {/* 완료 섹션 */}
          <section className="mb-6">
            <div className="bg-gradient-to-br from-[rgba(46,139,87,0.1)] to-[rgba(169,180,160,0.1)] border border-[rgba(46,139,87,0.2)] rounded-[18px] p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-[#2A2725] mb-2">Quest 완료!</h3>
              {quest.completedAt && (
                <p className="text-sm text-[#6B6662]">
                  완료 일시: {new Date(quest.completedAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          </section>

          {/* 전체 질문-답변 목록 */}
          {items.map((item, index) => (
            <section key={index} className="mb-4">
              <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">

                {item.type === 'question_objective' && (
                  <>
                    <div className="flex items-start gap-2 mb-4">
                      <span className="text-xs font-bold text-white bg-[rgba(191,167,255,0.85)] rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getQuestionNumber(items, index)}
                      </span>
                      <p className="text-sm font-semibold text-[#2A2725] leading-relaxed">
                        {item.question}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {(item.options || []).map((option, optIdx) => {
                        const isSelected = responses[index] === option;
                        return (
                          <div
                            key={optIdx}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm border ${
                              isSelected
                                ? 'bg-[rgba(191,167,255,0.15)] border-[rgba(191,167,255,0.5)] text-[#2A2725] font-semibold'
                                : 'bg-white border-[#E6E0DA] text-[#6B6662] opacity-50'
                            }`}
                          >
                            <span className="mr-2 text-xs">{String.fromCharCode(65 + optIdx)}.</span>
                            {option}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {item.type === 'question_subjective' && (
                  <>
                    <div className="flex items-start gap-2 mb-4">
                      <span className="text-xs font-bold text-white bg-[rgba(191,167,255,0.85)] rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getQuestionNumber(items, index)}
                      </span>
                      <p className="text-sm font-semibold text-[#2A2725] leading-relaxed">
                        {item.question}
                      </p>
                    </div>
                    <div className="w-full p-4 bg-[rgba(191,167,255,0.08)] border border-[rgba(191,167,255,0.2)] rounded-xl text-sm text-[#2A2725] whitespace-pre-line">
                      {responses[index] || '(답변 없음)'}
                    </div>
                  </>
                )}

                {item.type === 'text' && (
                  <div className="text-sm text-[#2A2725] leading-relaxed whitespace-pre-line">
                    {item.title && <h3 className="font-bold mb-3 text-base">{item.title}</h3>}
                    {item.description}
                  </div>
                )}
              </div>
            </section>
          ))}

          {/* 하단 버튼 */}
          <section className="mt-6 space-y-3">
            <button
              onClick={handleRequestEdit}
              className="w-full py-4 bg-[#FAE100] text-[#3C1E1E] rounded-[14px] font-bold text-sm shadow-[0_4px_12px_rgba(250,225,0,0.25)] hover:shadow-lg transition-all"
            >
              답변 수정 요청
            </button>
            <button
              onClick={() => router.push('/quest')}
              className="w-full py-4 bg-white border border-[#E6E0DA] text-[#2A2725] rounded-[14px] font-bold text-sm hover:bg-[rgba(191,167,255,0.1)] transition-all"
            >
              다른 Quest 보기
            </button>
          </section>
        </main>
      </div>
    );
  }

  // 진행 중 상태
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
              {quest.title}
            </div>
            <div className="text-xs text-[#6B6662]">
              {currentStep + 1} / {totalSteps}
            </div>
          </div>

          <div className="w-12" />
        </div>

        <div className="max-w-[430px] mx-auto px-4 pb-2">
          <div className="w-full h-1.5 bg-[#E6E0DA] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 pb-12 max-w-[430px] mx-auto">
        {isLastStep && (
          <button
            onClick={scrollToBottom}
            className="w-full mb-4 px-4 py-3 bg-[rgba(255,183,77,0.15)] border border-[rgba(255,183,77,0.4)] rounded-[14px] text-sm font-semibold text-[#b37a1b] text-center hover:bg-[rgba(255,183,77,0.25)] transition-all"
          >
            ⚠️ 완료하기를 눌러야 저장됩니다.
          </button>
        )}

        {currentItem && (
          <section className="mb-6">
            <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">

              {currentItem.type === 'question_objective' && (
                <>
                  <div className="flex items-start gap-2 mb-5">
                    <span className="text-xs font-bold text-white bg-[rgba(191,167,255,0.85)] rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {questionNumber}
                    </span>
                    <p className="text-sm font-semibold text-[#2A2725] leading-relaxed">
                      {currentItem.question}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {(currentItem.options || []).map((option, optIdx) => {
                      const isSelected = responses[currentStep] === option;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleResponseChange(currentStep, option)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                            isSelected
                              ? 'bg-[rgba(191,167,255,0.15)] border-[rgba(191,167,255,0.5)] text-[#2A2725] font-semibold'
                              : 'bg-white border-[#E6E0DA] text-[#6B6662] hover:border-[rgba(191,167,255,0.3)]'
                          }`}
                        >
                          <span className="mr-2 text-xs">{String.fromCharCode(65 + optIdx)}.</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {currentItem.type === 'question_subjective' && (
                <>
                  <div className="flex items-start gap-2 mb-5">
                    <span className="text-xs font-bold text-white bg-[rgba(191,167,255,0.85)] rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {questionNumber}
                    </span>
                    <p className="text-sm font-semibold text-[#2A2725] leading-relaxed">
                      {currentItem.question}
                    </p>
                  </div>
                  <textarea
                    value={responses[currentStep] || ''}
                    onChange={(e) => handleResponseChange(currentStep, e.target.value)}
                    placeholder="답변을 입력해주세요..."
                    className="w-full min-h-[120px] p-4 bg-white border border-[#E6E0DA] rounded-xl text-sm text-[#2A2725] placeholder-[#6B6662] resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(191,167,255,0.3)]"
                    style={{ fontFamily: 'inherit' }}
                  />
                </>
              )}

              {currentItem.type === 'text' && (
                <div className="text-sm text-[#2A2725] leading-relaxed whitespace-pre-line">
                  {currentItem.title && (
                    <h3 className="font-bold mb-3 text-base">{currentItem.title}</h3>
                  )}
                  {currentItem.description}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-4 bg-white border border-[#E6E0DA] text-[#2A2725] rounded-[14px] font-bold text-sm hover:bg-[rgba(191,167,255,0.1)] transition-all"
              >
                ← 이전
              </button>
            )}

            {!isLastStep ? (
              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-sm shadow-[0_10px_22px_rgba(123,203,255,0.18)] hover:shadow-xl transition-all"
              >
                다음 →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="flex-1 py-4 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-sm shadow-[0_10px_22px_rgba(123,203,255,0.18)] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '완료 처리 중...' : 'Quest 완료하기'}
              </button>
            )}
          </div>

          <button
            onClick={() => handleSave('in_progress')}
            disabled={submitting}
            className="w-full py-3 bg-transparent border border-[#E6E0DA] text-[#6B6662] rounded-[14px] text-xs hover:bg-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '저장 중...' : '임시 저장'}
          </button>

          {isLastStep && (
            <p className="text-xs text-[#6B6662] text-center leading-relaxed">완료 후에는 답변을 수정할 수 없습니다</p>
          )}
        </section>

        <div ref={bottomRef} />
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
