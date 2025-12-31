'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function CompletionScreen() {
  const router = useRouter();

  const handleApply = () => {
    window.open('https://pf.kakao.com/_xjwsxfb/chat', '_blank');
  };

  const handleGoHome = () => {
    // router.push 사용 (토큰 유지)
    router.push('/me');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* 완료 아이콘 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-pastel-purple via-pastel-pink to-pastel-blue rounded-full flex items-center justify-center shadow-2xl"
            >
              <span className="text-5xl">🎉</span>
            </motion.div>
            {/* 반짝이는 효과 */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute -top-2 -right-2 text-3xl"
            >
              ✨
            </motion.div>
          </div>
        </div>

        {/* 완료 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            2025년 회고를<br />
            완료하셨습니다!
          </h1>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
            세이미 파이널에 참여하시면 회고를 사주와 점성술로 같이 분석 피드백해드립니다.<br />
            신청하지 않으셔도 2025년의 나에 대해 생각해볼 수 있는 시간이 되셨기를 바랍니다.
          </p>
        </motion.div>

        {/* 정보 박스 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-pastel-lavender/20 to-pastel-blue/20 rounded-3xl p-6 mb-6 border border-pastel-purple/20"
        >
          <p className="text-gray-700 text-sm md:text-base text-center leading-relaxed mb-4">
            일주일 후 26대에도 이어갈<br />
            나의 생각과 나다움에 대해 점검할 수 있는
          </p>
          <p className="text-center">
            <span className="text-pastel-purple font-bold text-lg">진정한 나를 발견하고 말할 수 있는</span><br />
            <span className="text-pastel-blue font-bold text-xl">SAY ME SPIRIT LAB 2025-2026</span>
          </p>
        </motion.div>

        {/* CTA 버튼들 */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleApply}
            className="w-full py-4 bg-gradient-to-r from-pastel-purple via-pastel-pink to-pastel-blue text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            신청하기
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={handleGoHome}
            className="w-full py-4 bg-white border-2 border-pastel-purple text-pastel-purple rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          >
            마이페이지로 돌아가기
          </motion.button>
        </div>

        {/* 장식 효과 */}
        <div className="mt-8 flex justify-center gap-2 opacity-30">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="text-2xl"
            >
              ✨
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}