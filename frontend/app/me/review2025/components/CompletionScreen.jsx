'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function CompletionScreen() {
  const router = useRouter();

  useEffect(() => {
    // 폭죽 효과
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleGoHome = () => {
    router.push('/me');
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="text-center"
      >
        {/* 축하 아이콘 */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-8xl mb-6"
        >
          ✨
        </motion.div>

        {/* 타이틀 */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
        >
          수고하셨어요!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-lg text-gray-600 mb-8"
        >
          2025년을 돌아보는 시간을
          <br />
          가져주셔서 감사합니다
        </motion.p>

        {/* 구분선 */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto mb-8 rounded-full"
        />

        {/* 안내 메시지 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 mb-8"
        >
          <p className="text-gray-700 mb-4">
            앞으로 선택하신 요일에
            <br />
            맞춤형 질문을 보내드릴게요 💌
          </p>
          <div className="text-sm text-purple-600">
            <p className="mb-2">🎁 완료 보상</p>
            <ul className="space-y-1">
              <li>• 회고 결산서 준비 중</li>
              <li>• 다음 퀘스트 해금</li>
            </ul>
          </div>
        </motion.div>

        {/* 홈 버튼 */}
        <motion.button
          onClick={handleGoHome}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          홈으로 돌아가기 →
        </motion.button>

        {/* 추가 안내 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-sm text-gray-500 mt-6"
        >
          마이페이지에서 언제든지
          <br />
          작성한 내용을 확인할 수 있어요
        </motion.p>
      </motion.div>
    </div>
  );
}