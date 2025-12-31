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

export default function MonthSelector({ 
  selectedMonths = [], 
  onSelect, 
  maxSelection = 1,
  disabled = false 
}) {
  const handleMonthClick = (monthNum) => {
    if (disabled) return;

    if (maxSelection === 1) {
      // 단일 선택
      onSelect([monthNum]);
    } else {
      // 다중 선택
      if (selectedMonths.includes(monthNum)) {
        // 이미 선택된 달이면 제거
        onSelect(selectedMonths.filter(m => m !== monthNum));
      } else {
        // 새로 선택
        if (selectedMonths.length < maxSelection) {
          onSelect([...selectedMonths, monthNum]);
        }
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 선택 안내 */}
      {maxSelection > 1 && (
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600">
            {selectedMonths.length}/{maxSelection}개 선택됨
          </p>
        </div>
      )}

      {/* 달력 그리드 */}
      <div className="grid grid-cols-3 gap-4">
        {months.map((month, index) => {
          const isSelected = selectedMonths.includes(month.num);
          
          return (
            <motion.button
              key={month.num}
              onClick={() => handleMonthClick(month.num)}
              disabled={disabled}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300
                ${isSelected 
                  ? 'bg-gradient-to-br from-purple-100 to-blue-100 border-purple-400 shadow-lg' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* 선택 체크 표시 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}

              {/* 이모티콘 */}
              <div className="text-3xl mb-2">{month.emoji}</div>
              
              {/* 달 이름 */}
              <div className={`text-sm font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                {month.name}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 선택 제한 안내 */}
      {maxSelection > 1 && selectedMonths.length === maxSelection && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-purple-600 font-medium">
            ✅ {maxSelection}개를 모두 선택했습니다
          </p>
        </motion.div>
      )}
    </div>
  );
}