'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PeopleQuestion({ answers, onNext, onBack }) {
  const [people, setPeople] = useState({
    firstHalf: answers.firstHalfPeople || '',
    secondHalf: answers.secondHalfPeople || ''
  });

  const handleSubmit = () => {
    onNext({
      firstHalfPeople: people.firstHalf,
      secondHalfPeople: people.secondHalf
    });
  };

  const isValid = people.firstHalf.trim().length >= 10 && people.secondHalf.trim().length >= 10;

  return (
    <div className="py-12 px-6">
      {/* 질문 제목 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          2025년 상반기·하반기로 나누어
          <br />
          가장 많이 어울리거나 만난 사람들을
          <br />
          떠올려주세요
        </h2>
        <p className="text-sm text-gray-400">
          간단한 이름이나 관계만 적어주세요
        </p>
      </motion.div>

      {/* 상반기 입력 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📅</span>
          <h3 className="font-semibold text-gray-700">상반기 (1~6월)</h3>
        </div>
        <input
          type="text"
          value={people.firstHalf}
          onChange={(e) => setPeople({ ...people, firstHalf: e.target.value })}
          placeholder="예: 회사 동료들, 대학 친구 지영이, 운동 모임"
          className="w-full p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-pink-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all duration-300 text-gray-700 placeholder:text-gray-400"
          style={{ fontSize: '16px' }}
        />
        <p className={`text-xs mt-2 ${
          people.firstHalf.trim().length >= 10 ? 'text-pink-600 font-medium' : 'text-gray-400'
        }`}>
          {people.firstHalf.length}자 {people.firstHalf.trim().length < 10 && '(최소 10자 이상)'}
        </p>
      </motion.div>

      {/* 하반기 입력 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📅</span>
          <h3 className="font-semibold text-gray-700">하반기 (7~12월)</h3>
        </div>
        <input
          type="text"
          value={people.secondHalf}
          onChange={(e) => setPeople({ ...people, secondHalf: e.target.value })}
          placeholder="예: 새로 만난 프로젝트 팀원들, 가족"
          className="w-full p-4 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-gray-700 placeholder:text-gray-400"
          style={{ fontSize: '16px' }}
        />
        <p className={`text-xs mt-2 ${
          people.secondHalf.trim().length >= 10 ? 'text-blue-600 font-medium' : 'text-gray-400'
        }`}>
          {people.secondHalf.length}자 {people.secondHalf.trim().length < 10 && '(최소 10자 이상)'}
        </p>
      </motion.div>

      {/* 버튼 그룹 */}
      <div className="flex gap-3">
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
    </div>
  );
}