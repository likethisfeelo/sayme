'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getAccessToken, fetchWithAuth, clearTokens } from '../../utils/auth';

// 공통 헤더
import Header from '../../components/Header';

// 단계별 컴포넌트
import CalendarEntry from './components/CalendarEntry';
import Q1HardestMonth from './components/Q1HardestMonth';
import Q2EffortMonth from './components/Q2EffortMonth';
import Q3SatisfyingMonths from './components/Q3SatisfyingMonths';
import Q4MemorableScene from './components/Q4MemorableScene';
import Q5Future2026 from './components/Q5Future2026';
import WeekdaySelector from './components/WeekdaySelector';
import CompletionScreen from './components/CompletionScreen';

export default function Review2025() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  
  const [answers, setAnswers] = useState({
    hardestMonth: null,
    effortMonth: null,
    satisfyingMonths: null,
    memorableScene: null,
    future2026: null,
    selectedWeekdays: []
  });

  const steps = [
    { component: CalendarEntry, name: 'entry' },
    { component: Q1HardestMonth, name: 'hardestMonth' },
    { component: Q2EffortMonth, name: 'effortMonth' },
    { component: Q3SatisfyingMonths, name: 'satisfyingMonths' },
    { component: Q4MemorableScene, name: 'memorableScene' },
    { component: Q5Future2026, name: 'future2026' },
    { component: WeekdaySelector, name: 'weekdays' },
    { component: CompletionScreen, name: 'completion' }
  ];

  // 로그인 체크 및 userId 가져오기
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getAccessToken();

    console.log('🔑 토큰 확인:', token ? '있음' : '없음');

    if (!token) {
      console.error('❌ 토큰 없음, 로그인 페이지로 이동');
      router.push('/login');
      return;
    }

    // 토큰 저장
    setAccessToken(token);

    try {
      console.log('📡 /auth/me API 호출 중...');
      const response = await fetchWithAuth('https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/me');

      console.log('📡 응답 상태:', response.status);
      const data = await response.json();
      console.log('📡 응답 데이터:', data);

      if (response.ok && data.success) {
        setUserId(data.user.userId);
        console.log('✅ 인증 성공! userId:', data.user.userId);
      } else {
        console.error('❌ 인증 실패:', data);
        clearTokens();
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
    
    if (!userId || !accessToken) {
      console.warn('⚠️ userId 또는 토큰 없음, 저장 건너뛰기');
      return;
    }

    try {
      const currentSessionId = sessionId || Date.now().toString();
      
      // 🔧 순환 참조 제거 - 깨끗한 객체만 전송
      const cleanAnswers = {};
      
      // 각 필드를 안전하게 복사
      Object.keys(updatedAnswers).forEach(key => {
        const value = updatedAnswers[key];
        
        // null, undefined는 그대로
        if (value === null || value === undefined) {
          cleanAnswers[key] = value;
        }
        // 배열인 경우
        else if (Array.isArray(value)) {
          cleanAnswers[key] = value.map(item => {
            if (typeof item === 'object' && item !== null) {
              // 객체 배열인 경우 안전하게 복사
              return JSON.parse(JSON.stringify(item));
            }
            return item;
          });
        }
        // 객체인 경우
        else if (typeof value === 'object') {
          try {
            cleanAnswers[key] = JSON.parse(JSON.stringify(value));
          } catch (e) {
            console.warn(`⚠️ ${key} 직렬화 실패:`, e);
            cleanAnswers[key] = null;
          }
        }
        // 기본 타입 (string, number, boolean)
        else if (typeof value !== 'function' && typeof value !== 'symbol') {
          cleanAnswers[key] = value;
        }
      });
      
      const payload = {
        userId,
        sessionId: currentSessionId,
        answers: cleanAnswers,
        currentStep,
        status: 'in_progress'
      };

      console.log('💾 전송 데이터:', payload);
      
      const response = await fetch('https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/review2025/save', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
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
  const completeReview = async (finalAnswers) => {
    const answersToUse = finalAnswers || answers;
    
    console.log('🎯 completeReview 호출됨');
    console.log('🔑 userId:', userId);
    console.log('🔑 accessToken:', accessToken ? '있음' : '없음');
    console.log('📦 answers 전체:', answersToUse);
    console.log('📦 selectedWeekdays:', answersToUse.selectedWeekdays);
    
    if (!userId || !accessToken) {
      console.error('❌ userId 또는 accessToken 없음!');
      return;
    }

    try {
      console.log('🎉 완료 처리 시작');
      
      // 🔧 순환 참조 제거
      const cleanAnswers = {};
      Object.keys(answersToUse).forEach(key => {
        const value = answersToUse[key];
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
      
      console.log('🧹 정제된 cleanAnswers:', cleanAnswers);
      console.log('🧹 정제된 selectedWeekdays:', cleanAnswers.selectedWeekdays);
      
      const payload = {
        userId,
        sessionId: sessionId || Date.now().toString(),
        answers: cleanAnswers,
        selectedWeekdays: cleanAnswers.selectedWeekdays || []
      };
      
      console.log('📤 전송 데이터:', payload);
      console.log('📤 전송 selectedWeekdays:', payload.selectedWeekdays);
      console.log('🔑 Authorization 헤더:', `Bearer ${accessToken.substring(0, 20)}...`);
      
      const response = await fetch('https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/review2025/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 응답 상태:', response.status);
      const data = await response.json();
      console.log('📥 응답 데이터:', data);
      
      if (data.success) {
        console.log('✅ 회고 완료:', data);
      } else {
        console.error('❌ 완료 처리 실패:', data.message);
      }
    } catch (error) {
      console.error('❌ 완료 처리 API 오류:', error);
    }
  };

  const handleNext = async (data) => {
    console.log('📥 handleNext 받은 데이터:', data);
    console.log('📥 데이터 키:', Object.keys(data));
    console.log('📥 현재 Step:', currentStep);
    
    // 🔧 data도 먼저 정제
    const cleanData = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      console.log(`🔍 처리 중: ${key} =`, value, `타입: ${Array.isArray(value) ? 'Array' : typeof value}`);
      
      // null, undefined
      if (value === null || value === undefined) {
        cleanData[key] = value;
        console.log(`  ✅ ${key}: null/undefined 그대로`);
      }
      // 배열
      else if (Array.isArray(value)) {
        console.log(`  📋 ${key}: 배열 처리 시작, 길이: ${value.length}`);
        cleanData[key] = value.filter(item => {
          const isDomElement = item instanceof Element;
          const isFunction = typeof item === 'function';
          console.log(`    항목: ${item}, DOM: ${isDomElement}, Function: ${isFunction}`);
          // DOM 요소, 함수 제외
          return !isDomElement && !isFunction;
        });
        console.log(`  ✅ ${key}: 필터링 후 길이: ${cleanData[key].length}`, cleanData[key]);
      }
      // 객체
      else if (typeof value === 'object') {
        // DOM 요소, Window 객체 제외
        if (!(value instanceof Element) && !(value instanceof Window)) {
          try {
            cleanData[key] = JSON.parse(JSON.stringify(value));
            console.log(`  ✅ ${key}: 객체 직렬화 성공`);
          } catch (e) {
            console.warn(`⚠️ ${key} 직렬화 실패, 제외:`, e);
          }
        } else {
          console.log(`  ⚠️ ${key}: DOM/Window 객체, 제외`);
        }
      }
      // 기본 타입
      else if (typeof value !== 'function' && typeof value !== 'symbol') {
        cleanData[key] = value;
        console.log(`  ✅ ${key}: 기본 타입`);
      }
    });
    
    console.log('🧹 정제된 cleanData:', cleanData);
    
    const updatedAnswers = { ...answers, ...cleanData };
    console.log('📦 업데이트된 전체 answers:', updatedAnswers);
    console.log('📦 selectedWeekdays in updatedAnswers:', updatedAnswers.selectedWeekdays);
    
    setAnswers(updatedAnswers);
    
    await saveProgress(updatedAnswers);
    
    // WeekdaySelector 완료 후 completeReview 호출
    if (currentStep === 6) {
      console.log('🎉 WeekdaySelector 완료, 회고 완료 처리');
      await completeReview(updatedAnswers);
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 md:px-6 py-20">
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
                  index < currentStep - 1 ? 'w-8 bg-purple-500' : 'w-2 bg-purple-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}