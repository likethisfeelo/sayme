'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventQuestion({ answers, onNext, onBack }) {
  const [currentHalf, setCurrentHalf] = useState('first');
  const [events, setEvents] = useState({
    first: answers.firstHalfEvent || { what: '', why: '', expectation: '', emotion: '' },
    second: answers.secondHalfEvent || { what: '', why: '', expectation: '', emotion: '' }
  });

  const questions = [
    { 
      key: 'what', 
      label: currentHalf === 'first' 
        ? '2025년 상반기(1월 ~ 6월)\n내가 가장 집중한 사건, 이벤트 등은 무엇이 있나요?' 
        : '2025년 하반기(7월 ~ 12월)\n내가 가장 에너지를 많이 집중한 일이나 생각 사람은 무엇이 있나요?',
      placeholder: '예: 새로운 프로젝트 시작, 이직 결정, 중요한 발표' 
    },
    { key: 'why', label: '나는 왜 이것에 에너지를 쏟고 있었을까요?', placeholder: '예: 성장하고 싶었고, 인정받고 싶었고...' },
    { key: 'expectation', label: '그때 어떤 것을 예상 또는 기대했기 때문일까요?', placeholder: '예: 성공하면 더 나은 기회가 올 거라고...' },
    { key: 'emotion', label: '그때 나의 감정은 어떤 감정이었나요?', placeholder: '예: 설렘, 불안, 기대, 긴장...' }
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const currentEvent = events[currentHalf];

  const handleInputChange = (value) => {
    const questionKey = questions[currentQuestion].key;
    setEvents({
      ...events,
      [currentHalf]: {
        ...currentEvent,
        [questionKey]: value
      }
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (currentHalf === 'first') {
      setCurrentHalf('second');
      setCurrentQuestion(0);
    } else {
      onNext({
        firstHalfEvent: events.first,
        secondHalfEvent: events.second
      });
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else if (currentHalf === 'second') {
      setCurrentHalf('first');
      setCurrentQuestion(questions.length - 1);
    } else {
      onBack();
    }
  };

  const currentQ = questions[currentQuestion];
  const currentValue = currentEvent[currentQ.key];
  const isValid = currentValue.trim().length >= 10;

  return (
    <div className="py-12 px-6">
      {/* 질문 제목 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentHalf}-${currentQuestion}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 text-center"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-3 whitespace-pre-line">
            {currentQ.label}
          </h2>
          <p className="text-xs text-gray-400">
            {currentHalf === 'first' ? '상반기' : '하반기'} · {currentQuestion + 1} / {questions.length}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            부정적이든, 긍정적이든 상관없습니다!
          </p>
        </motion.div>
      </AnimatePresence>

      {/* 입력 필드 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <textarea
          value={currentValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={currentQ.placeholder}
          className="w-full h-40 p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 resize-none text-gray-700 placeholder:text-gray-400"
          style={{ fontSize: '16px' }}
        />
        <p className={`text-xs mt-2 text-center ${
          isValid ? 'text-purple-600 font-medium' : 'text-gray-400'
        }`}>
          {currentValue.length}자 {!isValid && '(최소 10자 이상)'}
        </p>
      </motion.div>

      {/* 버튼 그룹 */}
      <div className="flex gap-3 mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="flex-1 py-4 bg-gray-200 text-gray-600 rounded-full font-medium hover:bg-gray-300 transition-colors"
        >
          이전
        </motion.button>

        <motion.button
          whileHover={{ scale: isValid ? 1.05 : 1 }}
          whileTap={{ scale: isValid ? 0.95 : 1 }}
          onClick={handleNext}
          disabled={!isValid}
          className={`
            flex-[2] py-4 rounded-full font-medium transition-all duration-300
            ${isValid
              ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white shadow-lg'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {currentHalf === 'first' && currentQuestion === questions.length - 1
            ? '하반기로'
            : currentHalf === 'second' && currentQuestion === questions.length - 1
            ? '완료'
            : '다음'}
        </motion.button>
      </div>

      {/* 진행 상태 */}
      <div className="flex justify-center gap-2 mt-6">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`
              h-1.5 rounded-full transition-all duration-300
              ${index === currentQuestion ? 'w-8 bg-purple-400' : 'w-2 bg-gray-300'}
            `}
          />
        ))}
      </div>
    </div>
  );
}