'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MonthSelector from './MonthSelector';

export default function Q3SatisfyingMonths({ answers, onNext, onBack }) {
  const [step, setStep] = useState(1); // 1: 달 선택, 2: 이유, 3: 만족도, 4: 추가하고 싶은 것
  const [selectedMonths, setSelectedMonths] = useState(answers.satisfyingMonths?.months || []);
  const [reason, setReason] = useState(answers.satisfyingMonths?.reason || '');
  const [satisfaction, setSatisfaction] = useState(answers.satisfyingMonths?.satisfaction || '');
  const [additionalWants, setAdditionalWants] = useState(answers.satisfyingMonths?.additionalWants || '');

  const handleMonthSelect = (months) => {
    setSelectedMonths(months);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedMonths.length === 0) {
      alert('최소 1개 이상의 달을 선택해주세요');
      return;
    }
    if (step === 2 && reason.trim() === '') {
      alert('이유를 입력해주세요');
      return;
    }
    if (step === 3 && satisfaction.trim() === '') {
      alert('만족도에 대한 생각을 입력해주세요');
      return;
    }
    if (step === 4 && additionalWants.trim() === '') {
      alert('추가하고 싶은 점을 입력해주세요');
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      onNext({
        satisfyingMonths: {
          months: selectedMonths,
          reason,
          satisfaction,
          additionalWants
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

  const getMonthNames = () => {
    const names = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    return selectedMonths.map(m => names[m]).join(', ');
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
              '이정도면 살만했다'
              <br />
              하는 달을 골라주세요
            </h2>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-blue-700 text-center">
                💫 여러 개 선택 가능해요
                <br />
                (최대 6개)
              </p>
            </div>

            <MonthSelector
              selectedMonths={selectedMonths}
              onSelect={handleMonthSelect}
              maxSelection={6}
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
                선택한 달: {getMonthNames()}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 text-center">
              왜 이 기간을
              <br />
              '살만했다'고
              <br />
              생각하시나요?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              이 시기의 특별함을 생각해보세요
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="이 기간이 살만했던 이유를 자유롭게 적어주세요..."
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
              이 정도의 기간만
              <br />
              반복된다면,
              <br />
              충분히 만족하실 수 있나요?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              솔직한 마음을 들려주세요
            </p>

            <textarea
              value={satisfaction}
              onChange={(e) => setSatisfaction(e.target.value)}
              placeholder="만족도에 대한 생각을 자유롭게 적어주세요..."
              className="w-full h-48 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:ring focus:ring-purple-200 transition-all resize-none"
            />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 text-center">
              부족함이 있다면,
              <br />
              어떤 점을 더하고
              <br />
              싶으신가요?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              더 만족스러운 일상을 위해
            </p>

            <textarea
              value={additionalWants}
              onChange={(e) => setAdditionalWants(e.target.value)}
              placeholder="추가하고 싶은 것들을 적어주세요..."
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
          {step === 4 ? '다음 질문 →' : '다음'}
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {[1, 2, 3, 4].map((s) => (
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