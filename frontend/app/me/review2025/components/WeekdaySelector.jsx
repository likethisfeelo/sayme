'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const weekdays = [
  { key: 'mon', name: '월', color: 'from-red-400 to-red-500' },
  { key: 'tue', name: '화', color: 'from-orange-400 to-orange-500' },
  { key: 'wed', name: '수', color: 'from-yellow-400 to-yellow-500' },
  { key: 'thu', name: '목', color: 'from-green-400 to-green-500' },
  { key: 'fri', name: '금', color: 'from-blue-400 to-blue-500' },
  { key: 'sat', name: '토', color: 'from-indigo-400 to-indigo-500' },
  { key: 'sun', name: '일', color: 'from-purple-400 to-purple-500' }
];

export default function WeekdaySelector({ answers, onNext, onBack }) {
  const [selectedWeekdays, setSelectedWeekdays] = useState(answers.selectedWeekdays || []);

  const handleToggle = (dayName) => {
    if (selectedWeekdays.includes(dayName)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== dayName));
    } else {
      if (selectedWeekdays.length < 3) {
        setSelectedWeekdays([...selectedWeekdays, dayName]);
      }
    }
  };

  const handleNext = () => {
    if (selectedWeekdays.length === 0) {
      alert('최소 1개의 요일을 선택해주세요');
      return;
    }

    onNext({
      selectedWeekdays
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
          이제부터는
          <br />
          당신을 위한 맞춤 질문을
          <br />
          보내드려요 💌
        </h2>
        <p className="text-gray-600 text-center mb-8">
          일주일 중 질문을 받고 싶은
          <br />
          요일을 선택해주세요
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-purple-700 text-center font-semibold">
            최대 3일까지 선택 가능
            <br />
            <span className="text-purple-600">
              현재 {selectedWeekdays.length}/3개 선택됨
            </span>
          </p>
        </div>

        {/* 요일 버튼 그리드 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {weekdays.slice(0, 6).map((day, index) => {
            const isSelected = selectedWeekdays.includes(day.name);
            const isDisabled = !isSelected && selectedWeekdays.length >= 3;

            return (
              <motion.button
                key={day.key}
                onClick={() => handleToggle(day.name)}
                disabled={isDisabled}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                className={`
                  relative p-6 rounded-2xl font-bold text-lg transition-all
                  ${isSelected 
                    ? `bg-gradient-to-br ${day.color} text-white shadow-lg` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
                {day.name}
              </motion.button>
            );
          })}
        </div>

        {/* 일요일 (별도 행) */}
        <div className="grid grid-cols-3 gap-4">
          <div></div>
          {(() => {
            const day = weekdays[6]; // 일요일
            const isSelected = selectedWeekdays.includes(day.name);
            const isDisabled = !isSelected && selectedWeekdays.length >= 3;

            return (
              <motion.button
                key={day.key}
                onClick={() => handleToggle(day.name)}
                disabled={isDisabled}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                className={`
                  relative p-6 rounded-2xl font-bold text-lg transition-all
                  ${isSelected 
                    ? `bg-gradient-to-br ${day.color} text-white shadow-lg` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
                {day.name}
              </motion.button>
            );
          })()}
          <div></div>
        </div>

        {/* 선택된 요일 표시 */}
        {selectedWeekdays.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-600 mb-2">선택한 요일:</p>
            <p className="text-lg font-semibold text-purple-600">
              {selectedWeekdays.join(', ')}
            </p>
          </motion.div>
        )}
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
          className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedWeekdays.length === 0}
        >
          완료하기 ✨
        </button>
      </div>
    </div>
  );
}