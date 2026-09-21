'use client';

import { motion } from 'framer-motion';
import { STATUS_STEPS, statusIndex } from '@/lib/mandalart';

/**
 * 처리 상태 표시: 접수 → 관리자 확인 → 작성 중 → 전송 완료
 */
export default function StatusStepper({ status, compact = false }) {
  const current = statusIndex(status);
  const progress = (current / (STATUS_STEPS.length - 1)) * 100;

  return (
    <div>
      <div className="relative">
        <div className="absolute left-[12%] right-[12%] top-[14px] h-[3px] bg-[#E6E0DA] rounded-full" />
        <motion.div
          className="absolute left-[12%] top-[14px] h-[3px] rounded-full bg-gradient-to-r from-[#BFA7FF] to-[#7BCBFF]"
          initial={{ width: 0 }}
          animate={{ width: `calc(76% * ${progress / 100})` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <div className="relative grid grid-cols-4">
          {STATUS_STEPS.map((step, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={false}
                  animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ repeat: active && status !== 'sent' ? Infinity : 0, duration: 1.8, ease: 'easeInOut' }}
                  className={`w-[30px] h-[30px] rounded-full grid place-items-center text-[13px] border-2 ${
                    done || active
                      ? 'bg-gradient-to-br from-[#BFA7FF] to-[#7BCBFF] border-transparent text-white shadow-[0_6px_14px_rgba(123,203,255,0.35)]'
                      : 'bg-white border-[#E6E0DA] text-[#b3b0a6]'
                  }`}
                >
                  {done ? '✓' : step.icon}
                </motion.div>
                <div className={`text-center leading-tight ${compact ? 'text-[10px]' : 'text-[11px]'} ${active ? 'font-bold text-[#2A2725]' : done ? 'text-[#5f5e5a]' : 'text-[#b3b0a6]'}`}>
                  {compact ? step.short : step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {!compact && (
        <p className="mt-3 text-[13px] text-[#5f5e5a] text-center bg-[#F9F6F3] border border-[#E6E0DA] rounded-[12px] px-3 py-2">
          {STATUS_STEPS[current]?.description}
        </p>
      )}
    </div>
  );
}
