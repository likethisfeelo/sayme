'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, fetchWithAuth, clearTokens } from '../../utils/auth';
import { saveRetrospective } from '../../../lib/api/retrospective';

import WelcomeScreen from './components/WelcomeScreen';
import CountdownTransition from './components/CountdownTransition';
import LifeChangeQuestion from './components/LifeChangeQuestion';
import EventQuestion from './components/EventQuestion';
import PeopleQuestion from './components/PeopleQuestion';
import NewBehaviorQuestion from './components/NewBehaviorQuestion';
import BestWordsQuestion from './components/BestWordsQuestion';
import ReasonQuestion from './components/ReasonQuestion';
import CompletionScreen from './components/CompletionScreen';

export default function Retrospective2025Page() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }

      setAccessToken(token);

      try {
        const response = await fetchWithAuth(
          'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/me'
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          if (response.status === 401) {
            clearTokens();
          }
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('사용자 정보 확인 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  const persistAnswers = async (nextAnswers, nextStep) => {
    if (!accessToken) {
      return;
    }

    const isCompleted = nextStep >= 8;

    await saveRetrospective({
      sessionId: 'retrospective-2025',
      answers: nextAnswers,
      token: accessToken,
      currentStep: nextStep,
      status: isCompleted ? 'completed' : 'in_progress',
    });
  };

  const handleNext = async (newAnswers) => {
    const nextAnswers = { ...answers, ...newAnswers };
    const nextStep = currentStep + 1;

    setAnswers(nextAnswers);
    setCurrentStep(nextStep);

    try {
      await persistAnswers(nextAnswers, nextStep);
    } catch (error) {
      console.error('회고 저장 실패:', error);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const steps = [
    <WelcomeScreen key="welcome" onNext={handleNext} />,
    <CountdownTransition key="countdown" onNext={handleNext} />,
    <LifeChangeQuestion key="lifeChange" answers={answers} onNext={handleNext} />,
    <EventQuestion key="event" answers={answers} onNext={handleNext} onBack={handleBack} />,
    <PeopleQuestion key="people" answers={answers} onNext={handleNext} onBack={handleBack} />,
    <NewBehaviorQuestion key="newBehavior" answers={answers} onNext={handleNext} onBack={handleBack} />,
    <BestWordsQuestion key="bestWords" answers={answers} onNext={handleNext} onBack={handleBack} />,
    <ReasonQuestion key="reason" answers={answers} onNext={handleNext} onBack={handleBack} />,
    <CompletionScreen key="completion" />,
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E879F9 0%, #C084FC 30%, #818CF8 60%, #60A5FA 100%)' }}>
        <div className="text-white text-base">로딩 중...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
        background: 'linear-gradient(135deg, #E879F9 0%, #C084FC 30%, #818CF8 60%, #60A5FA 100%)',
      }}
    >
      {steps[currentStep] || <CompletionScreen />}
    </div>
  );
}