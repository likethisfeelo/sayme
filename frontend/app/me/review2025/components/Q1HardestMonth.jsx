'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MonthSelector from './MonthSelector';

const monthNames = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function Q1HardestMonth({ answers, onNext, onBack }) {
  const [step, setStep] = useState(1); // 1: 달 선택, 2: 이유, 3: 현재 생각
  const [selectedMonth, setSelectedMonth] = useState(answers.hardestMonth?.month ? [answers.hardestMonth.month] : []);
  const [reason, setReason] = useState(answers.hardestMonth?.reason || '');
  const [currentThoughts, setCurrentThoughts] = useState(answers.hardestMonth?.currentThoughts || '');

  const handleMonthSelect = (months) => {
    setSelectedMonth(months);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedMonth.length === 0) {
      alert('달을 선택해주세요');
      return;
    }
    if (step === 2 && reason.trim() === '') {
      alert('이유를 입력해주세요');
      return;
    }
    if (step === 3 && currentThoughts.trim() === '') {
      alert('현재의 생각을 입력해주세요');
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      // 완료
      onNext({
        hardestMonth: {
          month: selectedMonth[0],
          reason,
          currentThoughts
        }
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 text-center">
              올 한해,
              <br />
              가장 힘들었던 달은
              <br />
              언제였나요?
            </h2>
            <p className="text-gray-600 text-center mb-10">
              어려웠던 순간을 떠올려보세요
            </p>

            <MonthSelector
              selectedMonths={selectedMonth}
              onSelect={handleMonthSelect}
              maxSelection={1}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
                선택한 달: {monthNames[selectedMonth[0]]}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 text-center">
              그 당시,
              <br />
              무엇이 당신을
              <br />
              힘들게 했나요?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              솔직하게 표현해주세요
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="그때의 상황과 감정을 자유롭게 적어주세요..."
              className="w-full h-48 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:ring focus:ring-purple-200 transition-all resize-none"
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 text-center">
              그때를 돌아보며,
              <br />
              지금은 어떤 생각이
              <br />
              드시나요?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              시간이 지난 지금의 관점에서
            </p>

            <textarea
              value={currentThoughts}
              onChange={(e) => setCurrentThoughts(e.target.value)}
              placeholder="그 시기를 돌아보며 현재 드는 생각을 적어주세요..."
              className="w-full h-48 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:ring focus:ring-purple-200 transition-all resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 버튼 */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={handleNextStep}
          className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          {step === 3 ? '다음 질문 →' : '다음'}
        </button>
      </div>

      {/* 진행 표시 */}
      <div className="flex justify-center gap-2 mt-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 w-8 rounded-full transition-all ${
              s === step ? 'bg-purple-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}