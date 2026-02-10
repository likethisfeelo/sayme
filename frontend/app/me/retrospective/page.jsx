'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../../utils/auth';

import WelcomeScreen from './components/WelcomeScreen';
import CountdownTransition from './components/CountdownTransition';
import LifeChangeQuestion from './components/LifeChangeQuestion';
import EventQuestion from './components/EventQuestion';
import PeopleQuestion from './components/PeopleQuestion';
import NewBehaviorQuestion from './components/NewBehaviorQuestion';
import BestWordsQuestion from './components/BestWordsQuestion';
import ReasonQuestion from './components/ReasonQuestion';
import CompletionScreen from './components/CompletionScreen';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

export default function Retrospective2025Page() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [accessToken, setAccessToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setAccessToken(token);
  }, [router]);

  // 진행 상황 저장 (각 단계마다)
  const saveProgress = async (updatedAnswers, step) => {
    if (!accessToken) return;

    try {
      const currentSessionId = sessionId || Date.now().toString();

      const cleanAnswers = {};
      Object.keys(updatedAnswers).forEach(key => {
        const value = updatedAnswers[key];
        if (value === null || value === undefined) {
          cleanAnswers[key] = value;
        } else if (Array.isArray(value)) {
          cleanAnswers[key] = value.map(item => {
            if (typeof item === 'object' && item !== null) {
              return JSON.parse(JSON.stringify(item));
            }
            return item;
          });
        } else if (typeof value === 'object') {
          try {
            cleanAnswers[key] = JSON.parse(JSON.stringify(value));
          } catch (e) {
            cleanAnswers[key] = null;
          }
        } else if (typeof value !== 'function' && typeof value !== 'symbol') {
          cleanAnswers[key] = value;
        }
      });

      const payload = {
        sessionId: currentSessionId,
        answers: cleanAnswers,
        currentStep: step,
        status: 'in_progress'
      };

      const response = await fetch(`${API_BASE}/retrospective/save`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success && !sessionId) {
        setSessionId(currentSessionId);
      }
    } catch (error) {
      console.error('Failed to save retrospective progress:', error);
    }
  };

  // 완료 처리
  const completeRetrospective = async (finalAnswers) => {
    if (!accessToken) return;

    try {
      const cleanAnswers = {};
      Object.keys(finalAnswers).forEach(key => {
        const value = finalAnswers[key];
        if (value === null || value === undefined) {
          cleanAnswers[key] = value;
        } else if (Array.isArray(value)) {
          cleanAnswers[key] = [...value];
        } else if (typeof value === 'object') {
          try {
            cleanAnswers[key] = JSON.parse(JSON.stringify(value));
          } catch (e) {
            cleanAnswers[key] = null;
          }
        } else if (typeof value !== 'function' && typeof value !== 'symbol') {
          cleanAnswers[key] = value;
        }
      });

      const payload = {
        sessionId: sessionId || Date.now().toString(),
        answers: cleanAnswers
      };

      const response = await fetch(`${API_BASE}/retrospective/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        console.log('Retrospective completed successfully');
      }
    } catch (error) {
      console.error('Failed to complete retrospective:', error);
    }
  };

  const handleNext = async (newAnswers) => {
    const updatedAnswers = { ...answers, ...newAnswers };
    setAnswers(updatedAnswers);

    const nextStep = currentStep + 1;

    // 매 단계 자동 저장
    await saveProgress(updatedAnswers, nextStep);

    // ReasonQuestion(step 7) 완료 시 → CompletionScreen(step 8) 전에 complete 호출
    if (currentStep === 7) {
      await completeRetrospective(updatedAnswers);
    }

    setCurrentStep(nextStep);
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
