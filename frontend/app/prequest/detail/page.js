/**
 * File: frontend/app/prequest/detail/page.js
 * Description: 사전질문 답변 페이지 (스텝별 진행 + 완료 보기)
 * Route: /prequest/detail?id={contentId}
 */


'use client';
 
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { prequestUserApi } from '@/lib/api/prequest';
import { getAccessToken } from '../../utils/auth';
 
function PrequestDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get('id');
 
  const [content, setContent] = useState(null);
  const [responses, setResponses] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
 
  useEffect(() => {
    if (contentId) fetchData();
  }, [contentId]);
 
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('idToken') || getAccessToken();
      const data = await prequestUserApi.getActivePrequests(token);
      console.log('Detail - API response:', JSON.stringify(data));
      const prequests = data.prequests || [];
      const found = prequests.find(p => p.contentId === contentId);
 
      if (!found) {
        alert('사전질문을 찾을 수 없습니다');
        router.push('/trial-home');
        return;
      }
 
      setContent(found);
 
      // 기존 응답 복원
      if (found.userResponse) {
        setResponses(found.userResponse.responses || []);
        if (found.userResponse.status === 'completed') {
          setIsCompleted(true);
        }
      } else {
        setResponses(new Array((found.contentItems || []).length).fill(null));
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleResponseChange = (index, value) => {
    const updated = [...responses];
    updated[index] = value;
    setResponses(updated);
  };
 
  const handleSave = async (status = 'in_progress') => {
    setSaving(true);
    try {
      const token = localStorage.getItem('idToken') || getAccessToken();
      await prequestUserApi.saveResponse({
        contentId,
        responses,
        status,
        timeSpent: 0
      }, token);
 
      if (status === 'completed') {
        setIsCompleted(true);
        alert('답변이 저장되었습니다!');
        router.push('/trial-home');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };
 
  const handleComplete = () => {
    const questionItems = (content?.contentItems || []).filter(i => i.type?.startsWith('question'));
    const answeredCount = responses.filter(r => r && r.trim && r.trim() !== '').length;
 
    if (answeredCount < questionItems.length) {
      if (!confirm('아직 답변하지 않은 질문이 있습니다. 그래도 완료하시겠습니까?')) return;
    }
    handleSave('completed');
  };
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), #F5F1ED'
      }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgba(99,102,241,1)]"></div>
      </div>
    );
  }
 
  if (!content) return null;
 
  const items = content.contentItems || [];
  const currentItem = items[currentStep];
  const totalSteps = items.length;
 
  // 완료 상태: 전체 응답 보기
  if (isCompleted) {
    return (
      <div className="min-h-screen" style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
        background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), #F5F1ED'
      }}>
        <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
          <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
            <button onClick={() => router.push('/trial-home')} className="text-sm text-[#6B6662]">
              ← 돌아가기
            </button>
            <span className="text-sm font-semibold text-[rgba(99,102,241,1)]">답변 완료</span>
          </div>
        </header>
        <main className="px-4 py-6 max-w-[430px] mx-auto">
          <h2 className="text-xl font-bold text-[#2A2725] mb-6">{content.title}</h2>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[14px] p-5">
                {item.type === 'text' ? (
                  <div>
                    {item.title && <h3 className="font-semibold text-[#2A2725] mb-2">{item.title}</h3>}
                    <p className="text-sm text-[#6B6662] leading-relaxed">{item.description}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-[rgba(139,125,216,0.95)] mb-1">Q{idx + 1}</p>
                    <p className="text-sm font-semibold text-[#2A2725] mb-3">{item.question}</p>
                    <div className="bg-[rgba(249,249,255,1)] rounded-xl p-3">
                      <p className="text-sm text-[#2A2725]">{responses[idx] || '(미답변)'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 하단 액션 영역 */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push('/trial-home')}
              className="w-full px-4 py-3 bg-[#2A2725] text-white rounded-xl text-sm font-semibold"
            >
              메인으로 돌아가기
            </button>

            <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
              <h4 className="text-base font-semibold text-[#2A2725] mb-2">
                전문 분석 서비스 받기
              </h4>
              <p className="text-sm text-[#6B6662] mb-4 leading-relaxed">
                프리미엄 회원이 되시면 1:1 맞춤 상담과<br />
                매주 개인화된 심층 리포트를 받으실 수 있습니다.
              </p>
              <button
                onClick={() => router.push('/payment')}
                className="w-full px-4 py-3 bg-white border-2 border-[rgba(99,102,241,1)] text-[rgba(99,102,241,1)] rounded-xl text-sm font-semibold mb-2 hover:bg-[rgba(99,102,241,0.05)] transition-all"
              >
                분석 신청하기
              </button>
              <button
                onClick={() => window.open('https://pf.kakao.com/_xoMxbdG', '_blank')}
                className="w-full px-4 py-3 bg-[#FEE500] text-[#000000] rounded-xl text-sm font-semibold hover:bg-[#FDD835] transition-all"
              >
                서비스 문의하기 💬
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }
 
  // 진행 중: 스텝별 답변
  return (
    <div className="min-h-screen" style={{
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
      background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), #F5F1ED'
    }}>
      <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
          <button onClick={() => router.push('/trial-home')} className="text-sm text-[#6B6662]">
            ← 돌아가기
          </button>
          <span className="text-sm text-[#6B6662]">{currentStep + 1} / {totalSteps}</span>
        </div>
        {/* Progress bar */}
        <div className="max-w-[430px] mx-auto px-4 pb-2">
          <div className="w-full bg-[#E6E0DA] rounded-full h-1.5">
            <div
              className="bg-[rgba(99,102,241,1)] h-1.5 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </header>
 
      <main className="px-4 py-6 max-w-[430px] mx-auto">
        <h2 className="text-lg font-bold text-[#2A2725] mb-6">{content.title}</h2>
 
        <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
          {currentItem?.type === 'text' && (
            <div>
              {currentItem.title && (
                <h3 className="text-lg font-bold text-[#2A2725] mb-3">{currentItem.title}</h3>
              )}
              <p className="text-sm text-[#6B6662] leading-relaxed whitespace-pre-wrap">
                {currentItem.description}
              </p>
            </div>
          )}
 
          {currentItem?.type === 'question_subjective' && (
            <div>
              <p className="text-lg font-bold text-[#2A2725] mb-4">{currentItem.question}</p>
              <textarea
                value={responses[currentStep] || ''}
                onChange={(e) => handleResponseChange(currentStep, e.target.value)}
                placeholder={currentItem.placeholder || '자유롭게 작성해주세요...'}
                className="w-full border-2 border-[#E6E0DA] rounded-xl p-4 min-h-[200px] text-sm focus:border-[rgba(99,102,241,0.5)] focus:outline-none resize-none"
              />
            </div>
          )}
 
          {currentItem?.type === 'question_objective' && (
            <div>
              <p className="text-lg font-bold text-[#2A2725] mb-4">{currentItem.question}</p>
              <div className="space-y-2">
                {(currentItem.options || []).map((option, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleResponseChange(currentStep, option)}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all text-sm
                      ${responses[currentStep] === option
                        ? 'border-[rgba(99,102,241,1)] bg-[rgba(245,243,255,1)] text-[rgba(99,102,241,1)] font-semibold'
                        : 'border-[#E6E0DA] bg-white hover:border-[rgba(167,139,250,0.5)]'
                      }
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 px-4 py-3 bg-white border-2 border-[#E6E0DA] text-[#2A2725] rounded-xl font-semibold"
            >
              이전
            </button>
          )}
 
          {currentStep < totalSteps - 1 ? (
            <button
              onClick={() => {
                handleSave('in_progress');
                setCurrentStep(currentStep + 1);
              }}
              className="flex-1 px-4 py-3 bg-[rgba(99,102,241,1)] text-white rounded-xl font-semibold"
            >
              다음
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[rgba(167,139,250,1)] to-[rgba(99,102,241,1)] text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {saving ? '저장 중...' : '완료하기'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
 
export default function PrequestDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F1ED' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgba(99,102,241,1)]"></div>
      </div>
    }>
      <PrequestDetailContent />
    </Suspense>
  );
}