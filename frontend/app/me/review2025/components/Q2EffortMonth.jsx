'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MonthSelector from './MonthSelector';

const monthNames = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function Q2EffortMonth({ answers, onNext, onBack }) {
  const [step, setStep] = useState(1); // 1: 달 선택, 2: 노력의 이유, 3: 현재 생각
  const [selectedMonth, setSelectedMonth] = useState(answers.effortMonth?.month ? [answers.effortMonth.month] : []);
  const [motivationReason, setMotivationReason] = useState(answers.effortMonth?.motivationReason || '');
  const [currentThoughts, setCurrentThoughts] = useState(answers.effortMonth?.currentThoughts || '');

  const handleMonthSelect = (months) => {
    setSelectedMonth(months);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedMonth.length === 0) {
      alert('달을 선택해주세요');
      return;
    }
    if (step === 2 && motivationReason.trim() === '') {
      alert('노력의 이유를 입력해주세요');
      return;
    }
    if (step === 3 && currentThoughts.trim() === '') {
      alert('현재의 생각을 입력해주세요');
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      onNext({
        effortMonth: {
          month: selectedMonth[0],
          motivationReason,
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
              가장 노력했던 달은
              <br />
              언제였나요?
            </h2>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-purple-700 text-center">
                💡 열심히 잘하지 않았어도,
                <br />
                마음으로 노력했던 것도 괜찮아요!
              </p>
            </div>

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
              어떤 생각이 당신을
              <br />
              노력하게 만들었나요?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              그 시기 당신을 움직인 마음
            </p>

            <textarea
              value={motivationReason}
              onChange={(e) => setMotivationReason(e.target.value)}
              placeholder="무엇이 당신을 노력하게 만들었나요?"
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
              그 노력을 돌아보며,
              <br />
              지금은 어떤 생각이
              <br />
              드시나요?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              그때의 노력이 지금 어떤 의미인가요?
            </p>

            <textarea
              value={currentThoughts}
              onChange={(e) => setCurrentThoughts(e.target.value)}
              placeholder="현재 드는 생각을 자유롭게 적어주세요..."
              className="w-full h-48 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:ring focus:ring-purple-200 transition-all resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

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