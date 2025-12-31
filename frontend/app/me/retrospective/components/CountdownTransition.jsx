'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function CountdownTransition({ onNext }) {
  const [count, setCount] = useState(5);
  const hasCalledNext = useRef(false); // 중복 호출 방지

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else if (count === 0 && !hasCalledNext.current) {
      hasCalledNext.current = true;
      onNext({});
    }
  }, [count, onNext]);

  const handleSkip = () => {
    if (!hasCalledNext.current) {
      hasCalledNext.current = true;
      onNext({});
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 카운트다운 숫자 */}
      <motion.div
        key={count}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mb-12"
      >
        {count > 0 ? (
          <div className="text-9xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {count}
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="text-8xl"
          >
            ✨
          </motion.div>
        )}
      </motion.div>

      {/* 안내 메시지 */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-gray-600 mb-8"
      >
        잠시 숨을 고르세요...
      </motion.p>

      {/* 건너뛰기 버튼 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSkip}
        className="px-6 py-3 bg-white/50 backdrop-blur-sm border-2 border-purple-300 text-purple-600 rounded-full font-medium hover:bg-white/70 transition-all"
      >
        건너뛰기 →
      </motion.button>
    </div>
  );
}