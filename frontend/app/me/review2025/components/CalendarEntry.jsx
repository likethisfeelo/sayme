'use client';

import { motion } from 'framer-motion';

const months = [
  { num: 1, name: '1월', emoji: '❄️' },
  { num: 2, name: '2월', emoji: '💝' },
  { num: 3, name: '3월', emoji: '🌸' },
  { num: 4, name: '4월', emoji: '🌷' },
  { num: 5, name: '5월', emoji: '🌺' },
  { num: 6, name: '6월', emoji: '☀️' },
  { num: 7, name: '7월', emoji: '🌊' },
  { num: 8, name: '8월', emoji: '🍉' },
  { num: 9, name: '9월', emoji: '🍂' },
  { num: 10, name: '10월', emoji: '🎃' },
  { num: 11, name: '11월', emoji: '🍁' },
  { num: 12, name: '12월', emoji: '🎄' }
];

export default function CalendarEntry({ onNext }) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100">
      {/* 타이틀 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          2025년,
          <br />
          당신의 이야기를
          <br />
          함께 돌아봐요 ✨
        </h1>
        <p className="text-gray-600 text-lg">
          지난 1년의 순간들을
          <br />
          천천히 회상해볼까요?
        </p>
      </motion.div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {months.map((month, index) => (
          <motion.div
            key={month.num}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 100 }}
            className="aspect-square bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl flex flex-col items-center justify-center border-2 border-purple-200/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-1">{month.emoji}</div>
            <div className="text-xs font-semibold text-gray-700">{month.name}</div>
          </motion.div>
        ))}
      </div>

      {/* 시작 버튼 */}
      <motion.button
        onClick={onNext}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
      >
        시작하기 →
      </motion.button>

      {/* 안내 문구 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="text-center text-sm text-gray-500 mt-6"
      >
        약 5분 정도 소요됩니다
      </motion.p>
    </div>
  );
}