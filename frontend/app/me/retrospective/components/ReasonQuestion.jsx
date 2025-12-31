'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ReasonQuestion({ answers, onNext, onBack }) {
  const [reason, setReason] = useState(answers.reason || '');

  const handleSubmit = () => {
    if (reason.trim().length >= 10) {
      onNext({ reason });
    }
  };

  const isValid = reason.trim().length >= 10;

  return (
    <div className="py-12 px-6">
      {/* 질문 제목 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          이렇게 생각하는 이유를
          <br />
          간단히 적어주세요
        </h2>
        <p className="text-sm text-gray-400">
          당신의 솔직한 생각이 중요합니다
        </p>
      </motion.div>

      {/* 텍스트 입력 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예: 새로운 직장에서 많은 사람들을 만났고, 도전적인 프로젝트를 진행하면서..."
          className="w-full h-48 p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 resize-none text-gray-700 placeholder:text-gray-400"
          style={{ fontSize: '16px' }}
        />
      </motion.div>

      {/* 버튼 그룹 */}
      <div className="flex gap-3 mt-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex-1 py-4 bg-gray-200 text-gray-600 rounded-full font-medium hover:bg-gray-300 transition-colors"
        >
          이전
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: isValid ? 1.05 : 1 }}
          whileTap={{ scale: isValid ? 0.95 : 1 }}
          onClick={handleSubmit}
          disabled={!isValid}
          className={`
            flex-[2] py-4 rounded-full font-medium transition-all duration-300
            ${isValid
              ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white shadow-lg'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          다음
        </motion.button>
      </div>

      {/* 글자 수 표시 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={`text-center text-sm mt-4 ${
          isValid ? 'text-purple-600 font-medium' : 'text-gray-400'
        }`}
      >
        {reason.length}자 {!isValid && '(최소 10자 이상)'}
      </motion.p>
    </div>
  );
}