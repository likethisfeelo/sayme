'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MonthSelector from './MonthSelector';

const monthNames = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function Q4MemorableScene({ answers, onNext, onBack }) {
  const [step, setStep] = useState(1); // 1: 달 선택, 2: 장면 묘사
  const [selectedMonth, setSelectedMonth] = useState(answers.memorableScene?.month ? [answers.memorableScene.month] : []);
  const [sceneDescription, setSceneDescription] = useState(answers.memorableScene?.sceneDescription || '');

  const handleMonthSelect = (months) => {
    setSelectedMonth(months);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedMonth.length === 0) {
      alert('달을 선택해주세요');
      return;
    }
    if (step === 2 && sceneDescription.trim() === '') {
      alert('장면을 묘사해주세요');
      return;
    }

    if (step < 2) {
      setStep(step + 1);
    } else {
      onNext({
        memorableScene: {
          month: selectedMonth[0],
          sceneDescription
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
              긍정적인 면에서,
              <br />
              가장 기억하고 싶은
              <br />
              장면이 있는 달을
              <br />
              하나만 골라주세요 ✨
            </h2>
            <p className="text-gray-600 text-center mb-10">
              행복했던 순간, 뿌듯했던 순간,
              <br />
              아름다웠던 순간...
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
              어떤 장면,
              <br />
              어떤 상황이었나요?
            </h2>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-yellow-700 text-center">
                💭 구체적으로 떠올려보세요
                <br />
                장소, 날씨, 함께 있던 사람,
                <br />
                그때의 감정...
              </p>
            </div>

            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="그 순간의 모든 것을 생생하게 적어주세요..."
              className="w-full h-56 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:ring focus:ring-purple-200 transition-all resize-none"
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
          {step === 2 ? '다음 질문 →' : '다음'}
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {[1, 2].map((s) => (
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