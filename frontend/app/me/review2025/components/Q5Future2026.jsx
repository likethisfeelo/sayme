'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Q5Future2026({ answers, onNext, onBack }) {
  const [expectation, setExpectation] = useState(answers.future2026?.expectation || '');

  const handleNext = () => {
    if (expectation.trim() === '') {
      alert('2026년에 대한 기대를 입력해주세요');
      return;
    }

    onNext({
      future2026: {
        expectation
      }
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 text-center">
          2026년,
          <br />
          가장 행복한 순간은
          <br />
          어떤 순간을
          <br />
          기대하고 계신가요? 🌟
        </h2>
        <p className="text-gray-600 text-center mb-8">
          내년 이맘때쯤,
          <br />
          당신은 어떤 모습일까요?
        </p>

        <textarea
          value={expectation}
          onChange={(e) => setExpectation(e.target.value)}
          placeholder="2026년에 기대하는 행복한 순간을 상상해보세요..."
          className="w-full h-56 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:ring focus:ring-purple-200 transition-all resize-none"
        />

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 mt-6">
          <p className="text-sm text-purple-700 text-center">
            ✨ 구체적일수록 좋아요
            <br />
            작은 것부터 큰 것까지 자유롭게!
          </p>
        </div>
      </motion.div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}