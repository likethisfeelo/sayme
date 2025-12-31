'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// 공통 헤더
import Header from '../../components/Header';

// 단계별 컴포넌트
import WelcomeScreen from './components/WelcomeScreen';
import LifeChangeQuestion from './components/LifeChangeQuestion';
import ReasonQuestion from './components/ReasonQuestion';
import PeopleQuestion from './components/PeopleQuestion';
import EventQuestion from './components/EventQuestion';
import NewBehaviorQuestion from './components/NewBehaviorQuestion';
import BestWordsQuestion from './components/BestWordsQuestion';
import CompletionScreen from './components/CompletionScreen';

export default function Retrospective2025() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  
  const [answers, setAnswers] = useState({
    lifeChange: null,
    socialChange: null,
    innerChange: null,
    reason: '',
    firstHalfPeople: '',
    secondHalfPeople: '',
    firstHalfEvent: {
      what: '',
      why: '',
      expectation: '',
      emotion: ''
    },
    secondHalfEvent: {
      what: '',
      why: '',
      expectation: '',
      emotion: ''
    },
    newBehavior: '',
    newBehaviorReason: '',
    bestWords: '',
    bestWordsWhoAmI: ''
  });

  const [showCountdown, setShowCountdown] = useState(false);

  const steps = [
    { component: WelcomeScreen, name: 'welcome' },
    { component: LifeChangeQuestion, name: 'lifeChange' },
    { component: ReasonQuestion, name: 'reason' },
    { component: PeopleQuestion, name: 'people' },
    { component: EventQuestion, name: 'event' },
    { component: NewBehaviorQuestion, name: 'behavior' },
    { component: BestWordsQuestion, name: 'words' },
    { component: CompletionScreen, name: 'completion' }
  ];

  // 쿠키에서 토큰 가져오기
  const getCookie = (name) => {
    if (typeof window === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // 로그인 체크 및 userId 가져오기
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const accessToken = getCookie('accessToken') || 
                       (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    console.log('🔑 토큰 확인:', accessToken ? '있음' : '없음');

    if (!accessToken) {
      console.error('❌ 토큰 없음, 로그인 페이지로 이동');
      router.push('/login');
      return;
    }

    try {
      console.log('📡 /auth/me API 호출 중...');
      const response = await fetch('https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 응답 상태:', response.status);
      const data = await response.json();
      console.log('📡 응답 데이터:', data);

      if (response.ok && data.success) {
        setUserId(data.user.userId);
        console.log('✅ 인증 성공! userId:', data.user.userId);
      } else {
        console.error('❌ 인증 실패:', data);
        router.push('/login');
      }
    } catch (err) {
      console.error('❌ 인증 체크 실패:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // 진행 상황 저장 (각 단계마다)
  const saveProgress = async (updatedAnswers) => {
    console.log('💾 saveProgress 호출 - userId:', userId);
    console.log('💾 현재 answers:', updatedAnswers);
    
    if (!userId) {
      console.warn('⚠️ userId 없음, 저장 건너뛰기');
      return;
    }

    try {
      const currentSessionId = sessionId || Date.now().toString();
      
      const payload = {
        userId,
        sessionId: currentSessionId,
        answers: updatedAnswers,
        currentStep,
        status: 'in_progress'
      };

      console.log('💾 전송 데이터:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/retrospective/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('💾 응답 상태:', response.status);
      const data = await response.json();
      console.log('💾 응답 데이터:', data);
      
      if (data.success) {
        console.log('✅ 저장 성공!');
        if (!sessionId) {
          setSessionId(currentSessionId);
        }
      } else {
        console.error('❌ 저장 실패:', data.message);
      }
    } catch (error) {
      console.error('❌ 저장 API 오류:', error);
    }
  };

  // 완료 처리
  const completeRetrospective = async () => {
    if (!userId) return;

    try {
      console.log('🎉 완료 처리 시작');
      const response = await fetch('https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/retrospective/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId: sessionId || Date.now().toString(),
          answers
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 회고 완료:', data);
      } else {
        console.error('❌ 완료 처리 실패:', data.message);
      }
    } catch (error) {
      console.error('완료 처리 API 오류:', error);
    }
  };

  const handleNext = async (data) => {
    console.log('📥 handleNext 받은 데이터:', data);
    console.log('📥 데이터 키:', Object.keys(data));
    console.log('📥 현재 Step:', currentStep);
    
    const updatedAnswers = { ...answers, ...data };
    console.log('📦 업데이트된 전체 answers:', updatedAnswers);
    
    setAnswers(updatedAnswers);
    
    await saveProgress(updatedAnswers);
    
    // BestWordsQuestion 완료 후 completeRetrospective 호출
    // Step 6 = BestWordsQuestion (CountdownTransition 제거 후)
    if (currentStep === 6) {
      console.log('🎉 BestWordsQuestion 완료, 회고 완료 처리');
      await completeRetrospective();
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-purple mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const CurrentComponent = steps[currentStep]?.component;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      {/* 헤더 */}
      <Header showAuthButtons={false} />

      {/* 파스텔 입자 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/4 right-20 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl animate-float-delay-1" />
        <div className="absolute bottom-1/4 left-1/4 w-36 h-36 bg-blue-200/20 rounded-full blur-3xl animate-float-delay-2" />
        <div className="absolute bottom-20 right-1/4 w-44 h-44 bg-pink-200/15 rounded-full blur-3xl animate-float" />
      </div>

      {/* 모바일 컨테이너 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 md:px-6">
        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {CurrentComponent && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <CurrentComponent
                  answers={answers}
                  onNext={handleNext}
                  onBack={handleBack}
                  currentStep={currentStep}
                  userId={userId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 진행 상태 표시 */}
      {currentStep > 0 && currentStep < steps.length - 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex gap-2">
            {steps.slice(1, -1).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index < currentStep - 1 ? 'w-8 bg-pastel-purple' : 'w-2 bg-pastel-purple/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}