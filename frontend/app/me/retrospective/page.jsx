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

export default function Retrospective2025Page() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleNext = (newAnswers) => {
    setAnswers(prev => ({ ...prev, ...newAnswers }));
    setCurrentStep(prev => prev + 1);
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
