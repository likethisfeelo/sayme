'use client';

import { motion } from 'framer-motion';

export default function WelcomeScreen({ onNext }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 전체 화면 그라데이션 배경 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #E879F9 0%, #C084FC 30%, #818CF8 60%, #60A5FA 100%)',
        }}
      >
        {/* 배경 애니메이션 효과들 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 큰 원형 그라데이션 1 */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-20 -left-20 w-96 h-96 bg-white/20 rounded-full blur-3xl"
          />
          
          {/* 큰 원형 그라데이션 2 */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -40, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl"
          />

          {/* 중간 크기 원 */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.6, 0.4],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-200/20 rounded-full blur-2xl"
          />

          {/* 추가 원형들 */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.45, 0.25],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl"
          />

          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.2, 0.35, 0.2],
              x: [0, -25, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 3,
            }}
            className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-pink-300/20 rounded-full blur-3xl"
          />

          {/* 반짝이는 작은 점들 */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                top: `${15 + (i * 7)}%`,
                left: `${10 + (i * 8)}%`,
              }}
            />
          ))}

          {/* 별 이모지 장식 */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-[15%] right-[15%] text-5xl opacity-40"
          >
            ✨
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -15, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            className="absolute bottom-[20%] left-[12%] text-6xl opacity-30"
          >
            💫
          </motion.div>

          <motion.div
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="absolute top-[35%] left-[10%] text-4xl opacity-40"
          >
            ⭐
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 20, 0],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.5,
            }}
            className="absolute top-[60%] right-[18%] text-5xl opacity-35"
          >
            ✨
          </motion.div>

          <motion.div
            animate={{
              y: [0, 15, 0],
              x: [0, -10, 0],
              opacity: [0.45, 0.75, 0.45],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            className="absolute bottom-[35%] right-[25%] text-4xl opacity-40"
          >
            💫
          </motion.div>
        </div>
      </div>

      {/* 콘텐츠 (배경 위에) */}
      <div className="relative z-10 text-center text-white px-6 max-w-2xl">
        {/* 메인 타이틀 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 drop-shadow-2xl"
        >
          2025년 어땠나요?
        </motion.h1>

        {/* 서브 타이틀 */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-2xl md:text-3xl lg:text-4xl mb-12 drop-shadow-lg font-medium"
        >
          2026의 방향을 잘 설정해보아요.
        </motion.p>

        {/* 시작 버튼 */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNext({})}
          className="inline-flex items-center gap-3 px-10 py-5 bg-white/25 backdrop-blur-md text-white rounded-full font-bold text-xl shadow-2xl hover:bg-white/35 transition-all border-2 border-white/30"
        >
          <span>회고 시작하기</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.button>

        {/* 하단 안내 텍스트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-12"
        >
          <p className="text-white/80 text-lg">
            지난 한 해를 돌아보고<br />
            새로운 나를 발견하는 시간
          </p>
        </motion.div>
      </div>

      {/* Sayme 로고 (상단) */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg"
        >
          Sayme
        </motion.h2>
      </div>
    </div>
  );
}