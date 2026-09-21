'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getAccessToken } from '@/app/utils/auth';
import { SERVICE_NAME, WORKSHEETS, loadDraft, draftProgress } from '@/lib/mandalart';

/**
 * 메인 상단 배너: 나의 만다라트 진입점
 * - 비로그인: 가입 페이지로
 * - 로그인 + 임시저장 있음: 이어서 작성
 * - 로그인: 시작하기
 */
function MiniGrid({ theme, delay = 0 }) {
  return (
    <div className="grid grid-cols-3 gap-[3px] w-[54px] h-[54px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.span
          key={i}
          className="rounded-[3px]"
          style={{ background: i === 4 ? theme.accln : theme.accbg, border: `1px solid ${i === 4 ? theme.accln : theme.soft}` }}
          initial={{ opacity: 0.4, scale: 0.8 }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1, 0.85] }}
          transition={{ duration: 3, repeat: Infinity, delay: delay + i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// localStorage(로그인 토큰, 임시저장) 를 외부 스토어로 구독 - SSR 에서는 비로그인 스냅샷 사용
const subscribe = (cb) => {
  window.addEventListener('storage', cb);
  window.addEventListener('focus', cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener('focus', cb);
  };
};
const getSnapshot = () => {
  const loggedIn = !!getAccessToken();
  const progress = draftProgress(loadDraft());
  return `${loggedIn ? 1 : 0}|${progress}`;
};
const getServerSnapshot = () => '0|0';

export default function MandalartBanner({ className = '' }) {
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [loggedInFlag, progressStr] = snapshot.split('|');
  const progress = Number(progressStr) || 0;
  const state = { loggedIn: loggedInFlag === '1', progress, hasDraft: progress > 0 };

  const go = () => {
    if (!state.loggedIn) {
      router.push('/signup');
      return;
    }
    router.push('/mandalart');
  };

  const cta = !state.loggedIn ? '가입하고 시작하기' : state.hasDraft ? `이어서 작성하기 · ${state.progress}%` : '시작하기';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`relative overflow-hidden rounded-[18px] border border-[rgba(230,224,218,0.85)] bg-white/75 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.06)] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(225,245,238,0.9)] via-white/40 to-[rgba(250,236,231,0.9)]" />
      <motion.div
        aria-hidden
        className="absolute -inset-y-6 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-18deg]"
        animate={{ x: ['-140%', '420%'] }}
        transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
      />
      <button type="button" onClick={go} className="relative z-10 w-full text-left p-4 active:scale-[0.99] transition-transform">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 shrink-0">
            <MiniGrid theme={WORKSHEETS[0].theme} />
            <MiniGrid theme={WORKSHEETS[1].theme} delay={0.6} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] tracking-[0.12em] uppercase text-[#6B6662] mb-0.5">New · 누구나 무료</div>
            <div className="text-[16px] font-bold text-[#2A2725] leading-tight">{SERVICE_NAME}</div>
            <div className="text-[12px] text-[#5f5e5a] mt-1 leading-snug">
              Chp #.1 나를 완성시켜주는 것들 · Chp #.2 나를 괴롭히는 것들.<br className="hidden sm:block" /> 챕터별로 정리하고 파고들면 분석 보고서를 보내드려요.
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          {state.hasDraft ? (
            <div className="flex-1 h-[6px] rounded-full bg-[#E6E0DA] overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-[#1D9E75] to-[#D85A30]" initial={{ width: 0 }} animate={{ width: `${state.progress}%` }} transition={{ duration: 0.8 }} />
            </div>
          ) : (
            <div className="text-[11px] text-[#94928b]">약 10분 · 자동 저장 · 모바일 OK</div>
          )}
          <span className="shrink-0 text-[13px] font-bold px-4 py-2 rounded-full bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] shadow-[0_8px_18px_rgba(123,203,255,0.25)]">
            {cta} →
          </span>
        </div>
      </button>
    </motion.section>
  );
}
