'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/app/components/mandalart/PageShell';
import { STATUS_STEPS, statusIndex, formatDateTime } from '@/lib/mandalart';

export const KAKAO_CHAT_URL = 'https://pf.kakao.com/_xjwsxfb/chat';

/**
 * 서비스 상태 카드
 *  - 제출 전: 안내 + 제출 버튼(두 챕터 완료 시 활성)
 *  - 제출 후: 정보 접수됨 → 관리자 확인 → 작성 중 → 보고서 조회 단계 표시
 *  - 보고서 조회 버튼: 관리자가 보고서를 전송하면 활성화
 */
export default function ServiceStatusCard({ request, ready, showSubmit = true, loading = false, title = '최종 보고서 신청', compact = false, missingTitles = [] }) {
  const router = useRouter();
  const current = request ? statusIndex(request.status) : -1;
  const reportReady = request?.status === 'sent';

  const steps = [
    { key: 'submitted', label: '정보 접수됨' },
    { key: 'confirmed', label: '관리자 확인' },
    { key: 'writing', label: '작성 중' },
    { key: 'sent', label: '보고서 조회' },
  ];

  return (
    <Card className={`${reportReady ? '!border-[#BFA7FF]' : ''} ${compact ? '!p-3.5 !shadow-none' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[14px] font-bold">{title}</h2>
        {request && <span className="text-[11px] text-[#94928b]">접수 {formatDateTime(request.createdAt)}</span>}
      </div>
      <p className="text-[12px] text-[#5f5e5a] mb-3">
        {loading
          ? '상태를 불러오는 중…'
          : !request
            ? ready
              ? '두 챕터가 모두 완료되었어요. 제출하면 접수되고, 관리자가 두 장을 함께 분석해 보고서를 보내드려요.'
              : '보고서는 두 챕터(완성 · 괴롭힘)를 모두 완료한 뒤 한 번에 신청해요.'
            : STATUS_STEPS[current]?.description}
      </p>

      {!request && !ready && missingTitles.length > 0 && (
        <div className="mb-3 rounded-[12px] border border-[#F0C36D] bg-[#FFF7E6] px-3 py-2.5 text-[12px] text-[#7A4B00] leading-relaxed">
          아직 남은 챕터: <b>{missingTitles.join(', ')}</b><br />
          남은 챕터를 완료한 뒤 아래에서 최종 보고서를 신청해 주세요.
        </div>
      )}

      <ol className="grid grid-cols-4 gap-1 mb-3">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.key} className="flex flex-col items-center gap-1">
              <motion.span
                initial={false}
                animate={active && !reportReady ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ repeat: active && !reportReady ? Infinity : 0, duration: 1.8 }}
                className={`w-[28px] h-[28px] rounded-full grid place-items-center text-[12px] border-2 ${
                  done || active
                    ? 'bg-gradient-to-br from-[#BFA7FF] to-[#7BCBFF] border-transparent text-white'
                    : 'bg-white border-[#E6E0DA] text-[#b3b0a6]'
                }`}
              >
                {done ? '✓' : i + 1}
              </motion.span>
              <span className={`text-[10px] leading-tight text-center ${active ? 'font-bold text-[#2A2725]' : done ? 'text-[#5f5e5a]' : 'text-[#b3b0a6]'}`}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!reportReady}
          onClick={() => router.push(`/mandalart/report/?id=${encodeURIComponent(request.requestId)}`)}
          className="w-full py-3 rounded-[14px] font-bold text-[14px] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] disabled:opacity-40 disabled:grayscale active:scale-[0.98] transition-transform"
        >
          {reportReady ? '보고서 조회 →' : request ? '보고서 조회 (준비 중)' : '보고서 조회 (제출 후 활성화)'}
        </button>

        {showSubmit && (
          <button
            type="button"
            disabled={!ready}
            onClick={() => router.push('/mandalart/submit')}
            className={`w-full py-2.5 rounded-[14px] text-[13px] font-semibold border disabled:opacity-40 ${request ? 'bg-white border-[#E6E0DA] text-[#5f5e5a]' : 'bg-[#2A2725] border-[#2A2725] text-white'}`}
          >
            {request ? '수정한 내용으로 다시 제출' : '최종 보고서 신청하기 →'}
          </button>
        )}
      </div>
    </Card>
  );
}

/** 개인 상담 서비스 신청 CTA (카카오톡 문의) */
export function ConsultCard() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl bg-[rgba(255,232,214,0.9)]" />
      <div className="relative">
        <div className="text-[10px] tracking-[0.12em] uppercase text-[#6B6662] mb-1">Personal Session</div>
        <h2 className="text-[16px] font-bold leading-tight mb-1">개인 상담 서비스 신청</h2>
        <p className="text-[13px] text-[#2A2725] leading-relaxed mb-3">
          사주 + 타로 + 점성술로<br />
          나다움에 집중하며 인사이트를 얻는 시간을 가져보세요.
        </p>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-[22px] font-bold text-[#2A2725] leading-none">월 15만원</span>
          <span className="text-[12px] text-[#5f5e5a] pb-0.5">3회 상담 + 1회 보고서</span>
        </div>
        <button
          type="button"
          onClick={() => window.open(KAKAO_CHAT_URL, '_blank', 'noopener')}
          className="w-full py-3 rounded-[14px] font-bold text-[14px] bg-[#FEE500] text-[#1f1f1f] active:scale-[0.98] transition-transform"
        >
          카카오톡으로 문의하기 💬
        </button>
      </div>
    </Card>
  );
}
