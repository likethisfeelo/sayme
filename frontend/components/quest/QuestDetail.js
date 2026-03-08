'use client';

import { useState, useEffect, useRef } from 'react';
import { questUserApi } from '@/lib/api/quest';
import { useRouter } from 'next/navigation';

export default function QuestDetail({ assignmentId, readonlyMode = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const autoSaveTimerRef = useRef(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    loadContent();

    const handleBeforeUnload = (e) => {
      if (!readonlyMode && !isCompleted && hasUnsavedChanges.current) {
        autoSave(true);
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (!readonlyMode && !isCompleted && hasUnsavedChanges.current) {
        autoSave(true);
      }
    };
  }, [assignmentId, readonlyMode, isCompleted]);

  useEffect(() => {
    if (readonlyMode || isCompleted) return;

    if (currentAnswer) {
      hasUnsavedChanges.current = true;

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        autoSave();
      }, 3000);
    }
  }, [currentAnswer, readonlyMode, isCompleted]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const idToken = localStorage.getItem('idToken');
      if (!idToken) {
        router.push('/login');
        return;
      }

      const [contentData, responseData] = await Promise.all([
        questUserApi.getContentDetail(assignmentId, idToken),
        questUserApi.getMyResponse(assignmentId, idToken).catch(() => null),
      ]);

      setContent(contentData);

      const savedResponses = responseData?.response?.responses || [];
      const responseStatus = responseData?.response?.status;
      const totalItems = contentData?.content?.contentItems?.length || 0;
      const completedByCount = totalItems > 0 && savedResponses.length >= totalItems;
      const completed = readonlyMode || responseStatus === 'completed' || completedByCount;

      setIsCompleted(completed);
      setResponses(savedResponses);

      if (!completed) {
        setCurrentStep(savedResponses.length || 0);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      alert('콘텐츠를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async (isSync = false) => {
    if (readonlyMode || isCompleted || !currentAnswer || saving || !content) return;

    const idToken = localStorage.getItem('idToken');
    if (!idToken) return;

    const currentItem = content.content.contentItems[currentStep];
    if (!currentItem) return;

    const newResponse = {
      itemIndex: currentStep,
      answeredAt: new Date().toISOString(),
    };

    if (currentItem.type === 'question_subjective' || currentItem.type === 'question_objective') {
      newResponse.answer = currentAnswer;
    }

    const updatedResponses = [...responses];
    const existingIndex = updatedResponses.findIndex((r) => r.itemIndex === currentStep);

    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = newResponse;
    } else {
      updatedResponses.push(newResponse);
    }

    try {
      const savePromise = questUserApi.saveResponse(
        assignmentId,
        {
          assignmentId,
          responses: updatedResponses,
          status: 'in_progress',
        },
        idToken,
      );

      if (isSync) {
        await savePromise;
      } else {
        savePromise
          .then(() => {
            hasUnsavedChanges.current = false;
          })
          .catch((error) => {
            console.error('[AUTO-SAVE] Failed:', error);
          });
      }
    } catch (error) {
      console.error('[AUTO-SAVE] Error:', error);
    }
  };

  const handleNext = async () => {
    if (readonlyMode || isCompleted) return;

    const idToken = localStorage.getItem('idToken');
    if (!idToken) {
      router.push('/login');
      return;
    }

    setSaving(true);

    try {
      const currentItem = content.content.contentItems[currentStep];
      const newResponse = {
        itemIndex: currentStep,
        answeredAt: new Date().toISOString(),
      };

      if (currentItem.type === 'question_subjective') {
        if (!currentAnswer.trim()) {
          alert('답변을 입력해주세요.');
          setSaving(false);
          return;
        }
        newResponse.answer = currentAnswer;
      } else if (currentItem.type === 'question_objective') {
        if (!currentAnswer) {
          alert('선택지를 선택해주세요.');
          setSaving(false);
          return;
        }
        newResponse.answer = currentAnswer;
      } else if (currentItem.type === 'youtube') {
        newResponse.watched = true;
      } else if (currentItem.type === 'text') {
        newResponse.read = true;
      }

      const updatedResponses = [...responses, newResponse];
      const isLastStep = currentStep >= content.content.contentItems.length - 1;

      await questUserApi.saveResponse(
        assignmentId,
        {
          assignmentId,
          responses: updatedResponses,
          status: isLastStep ? 'completed' : 'in_progress',
          timeSpent: 0,
        },
        idToken,
      );

      hasUnsavedChanges.current = false;

      if (isLastStep) {
        alert('Quest를 완료했습니다! 🎉');
        router.push('/me');
      } else {
        setResponses(updatedResponses);
        setCurrentStep(currentStep + 1);
        setCurrentAnswer('');
      }
    } catch (error) {
      console.error('[SAVE] Failed:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const getResponseByItemIndex = (itemIndex) => responses.find((response) => response.itemIndex === itemIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">콘텐츠를 찾을 수 없습니다</div>
      </div>
    );
  }

  const contentItems = content.content.contentItems || [];

  if (readonlyMode || isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-4">
            <h1 className="text-2xl font-bold text-[#2A2725] mb-2">{content.content.title}</h1>
            <p className="text-sm text-gray-500">완료된 Quest 답변 보기</p>
          </div>

          <div className="space-y-4">
            {contentItems.map((item, index) => {
              const response = getResponseByItemIndex(index);
              const questionText = item.question || item.title || `문항 ${index + 1}`;

              return (
                <div key={`${item.type}-${index}`} className="bg-white rounded-2xl shadow p-6">
                  <p className="text-xs text-gray-400 mb-2">Q{index + 1}</p>
                  <h2 className="text-lg font-semibold text-[#2A2725] mb-3">{questionText}</h2>

                  {item.type === 'question_objective' || item.type === 'question_subjective' ? (
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 whitespace-pre-wrap text-[#2A2725]">
                      {response?.answer || '저장된 답변이 없습니다.'}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-[#6B6662]">
                      {item.description || '콘텐츠 항목'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => router.push('/quest')}
            className="w-full mt-6 px-6 py-3 bg-[#2A2725] text-white rounded-lg font-medium hover:opacity-90"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentItem = contentItems[currentStep];
  const progress = ((currentStep / contentItems.length) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{content.content.title}</span>
            <span>
              {currentStep + 1} / {contentItems.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          {hasUnsavedChanges.current && <p className="text-xs text-gray-500 mt-1">💾 자동 저장 중...</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {currentItem.type === 'youtube' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">{currentItem.title}</h2>
              <p className="text-gray-600 mb-6">{currentItem.description}</p>
              <div className="aspect-video mb-6">
                <iframe
                  src={currentItem.url.replace('watch?v=', 'embed/')}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {currentItem.type === 'text' && (
            <div>
              <div className="prose max-w-none whitespace-pre-wrap">{currentItem.description}</div>
            </div>
          )}

          {currentItem.type === 'question_subjective' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">{currentItem.question}</h2>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={currentItem.placeholder || '자유롭게 작성해주세요...'}
                className="w-full border-2 rounded-lg p-4 min-h-[200px] focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">💡 입력 후 3초 뒤 자동 저장됩니다</p>
            </div>
          )}

          {currentItem.type === 'question_objective' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">{currentItem.question}</h2>
              <div className="space-y-3">
                {(currentItem.options || []).map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      currentAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="objective-answer"
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <button
                onClick={() => {
                  setCurrentStep(currentStep - 1);
                  setCurrentAnswer('');
                }}
                className="px-6 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
                disabled={saving}
              >
                ← 이전
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400"
            >
              {saving ? '저장 중...' : currentStep >= contentItems.length - 1 ? '완료' : '다음'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}