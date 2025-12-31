'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function NewBehaviorQuestion({ answers, onNext, onBack }) {
  const [behavior, setBehavior] = useState(answers.newBehavior || '');
  const [reason, setReason] = useState(answers.newBehaviorReason || '');
  const [step, setStep] = useState(0);

  const handleNextStep = () => {
    if (step === 0 && behavior.trim().length >= 10) {
      setStep(1);
    } else if (step === 1 && reason.trim().length >= 10) {
      onNext({
        newBehavior: behavior,
        newBehaviorReason: reason
      });
    }
  };

  const handleBackStep = () => {
    if (step === 1) {
      setStep(0);
    } else {
      onBack();
    }
  };

  const questions = [
    {
      title: '2025년 내가 했던 행동들 중에서',
      subtitle: '이전의 나와 다르거나, 정말 오랜만에 한 행동은 어떤 것이었나요?',
      value: behavior,
      onChange: setBehavior,
      placeholder: '예: 혼자 여행을 다녀왔다, 처음으로 운동을 시작했다, 새로운 취미를 배웠다...'
    },
    {
      title: '그렇게 한 이유는 무엇인가요?',
      subtitle: '왜 그런 행동을 하게 되었나요?',
      value: reason,
      onChange: setReason,
      placeholder: '예: 변화가 필요하다고 느꼈고, 나 자신에게 집중하고 싶었고...'
    }
  ];

  const currentQ = questions[step];
  const isValid = currentQ.value.trim().length >= 10;

  return (
    <div className="py-12 px-6">
      {/* 수고했어요 메시지 */}
      {step === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl"
        >
          <p className="text-lg font-medium text-gray-700">
            2025년 정말 수고 많으셨어요 💜
          </p>
        </motion.div>
      )}

      {/* 질문 제목 */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-8 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {currentQ.title}
        </h2>
        <p className="text-sm text-gray-500">
          {currentQ.subtitle}
        </p>
      </motion.div>

      {/* 텍스트 입력 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <textarea
          value={currentQ.value}
          onChange={(e) => currentQ.onChange(e.target.value)}
          placeholder={currentQ.placeholder}
          className="w-full h-48 p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 resize-none text-gray-700 placeholder:text-gray-400"
          style={{ fontSize: '16px' }}
        />
        <p className={`text-sm mt-2 text-center ${
          isValid ? 'text-purple-600 font-medium' : 'text-gray-400'
        }`}>
          {currentQ.value.length}자 {!isValid && '(최소 10자 이상)'}
        </p>
      </motion.div>

      {/* 버튼 그룹 */}
      <div className="flex gap-3 mt-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackStep}
          className="flex-1 py-4 bg-gray-200 text-gray-600 rounded-full font-medium hover:bg-gray-300 transition-colors"
        >
          이전
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: isValid ? 1.05 : 1 }}
          whileTap={{ scale: isValid ? 0.95 : 1 }}
          onClick={handleNextStep}
          disabled={!isValid}
          className={`
            flex-[2] py-4 rounded-full font-medium transition-all duration-300
            ${isValid
              ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white shadow-lg'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {step === 0 ? '다음' : '완료'}
        </motion.button>
      </div>

      {/* 진행 상태 */}
      <div className="flex justify-center gap-2 mt-6">
        {[0, 1].map((index) => (
          <div
            key={index}
            className={`
              h-1.5 rounded-full transition-all duration-300
              ${index === step ? 'w-8 bg-purple-400' : 'w-2 bg-gray-300'}
            `}
          />
        ))}
      </div>
    </div>
  );
}