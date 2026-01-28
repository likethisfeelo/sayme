'use client';

import { useState, useEffect, useRef } from 'react';
import { questUserApi } from '@/lib/api/quest';
import { useRouter } from 'next/navigation';

export default function QuestDetail({ assignmentId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  
  // 자동 저장을 위한 ref
  const autoSaveTimerRef = useRef(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    loadContent();
    
    // 페이지 이탈 시 저장
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges.current) {
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
      if (hasUnsavedChanges.current) {
        autoSave(true);
      }
    };
  }, [assignmentId]);

  // 답변 변경 시 자동 저장 타이머
  useEffect(() => {
    if (currentAnswer) {
      hasUnsavedChanges.current = true;
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave();
      }, 3000);
    }
  }, [currentAnswer]);

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
        questUserApi.getMyResponse(assignmentId, idToken).catch(() => null)
      ]);

      setContent(contentData);
      if (responseData?.response) {
        setResponses(responseData.response.responses || []);
        setCurrentStep(responseData.response.responses?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      alert('콘텐츠를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async (isSync = false) => {
    if (!currentAnswer || saving) return;

    const idToken = localStorage.getItem('idToken');
    if (!idToken) return;

    const currentItem = content.content.contentItems[currentStep];
    const newResponse = {
      itemIndex: currentStep,
      answeredAt: new Date().toISOString(),
    };

    if (currentItem.type === 'question_subjective' || currentItem.type === 'question_objective') {
      newResponse.answer = currentAnswer;
    }

    const updatedResponses = [...responses];
    const existingIndex = updatedResponses.findIndex(r => r.itemIndex === currentStep);
    
    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = newResponse;
    } else {
      updatedResponses.push(newResponse);
    }

    try {
      console.log('[AUTO-SAVE] Saving current progress...');
      
      const savePromise = questUserApi.saveResponse(
        assignmentId,
        {
          assignmentId,
          responses: updatedResponses,
          status: 'in_progress'
        },
        idToken
      );

      if (isSync) {
        await savePromise;
      } else {
        savePromise.then(() => {
          console.log('[AUTO-SAVE] Success');
          hasUnsavedChanges.current = false;
        }).catch((error) => {
          console.error('[AUTO-SAVE] Failed:', error);
        });
      }
    } catch (error) {
      console.error('[AUTO-SAVE] Error:', error);
    }
  };

  const handleNext = async () => {
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

      console.log('[SAVE] Saving response...', {
        currentStep,
        isLastStep,
        responsesCount: updatedResponses.length
      });

      await questUserApi.saveResponse(
        assignmentId,
        {
          assignmentId,
          responses: updatedResponses,
          status: isLastStep ? 'completed' : 'in_progress',
          timeSpent: 0
        },
        idToken
      );

      console.log('[SAVE] Success');
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

  const currentItem = content.content.contentItems[currentStep];
  const progress = ((currentStep / content.content.contentItems.length) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 진행률 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{content.content.title}</span>
            <span>{currentStep + 1} / {content.content.contentItems.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {hasUnsavedChanges.current && (
            <p className="text-xs text-gray-500 mt-1">💾 자동 저장 중...</p>
          )}
        </div>

        {/* 콘텐츠 */}
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
              <div className="prose max-w-none whitespace-pre-wrap">
                {currentItem.description}
              </div>
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
              <p className="text-xs text-gray-500 mt-2">
                💡 입력 후 3초 뒤 자동 저장됩니다
              </p>
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
                      currentAnswer === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
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

          {/* 버튼 */}
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
              {saving ? '저장 중...' : (currentStep >= content.content.contentItems.length - 1 ? '완료' : '다음')} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}