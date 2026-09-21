'use client';

import { useRouter } from 'next/navigation';

export const KAKAO_CHAT_URL = 'https://pf.kakao.com/_xjwsxfb/chat';

/**
 * 프리미엄 전용 안내 카드 (+ 카카오톡 상담 신청)
 */
export default function PremiumOnlyCard({ icon = '🔮', title, description = '프리미엄 회원을 위한 서비스입니다.', showIntro = true }) {
  const router = useRouter();
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] text-center w-full">
      <div className="text-5xl mb-4">{icon}</div>
      {title && <h2 className="text-lg font-bold text-[#2A2725] mb-2">{title}</h2>}
      <p className="text-sm text-[#6B6662] leading-relaxed mb-5 whitespace-pre-line">{description}</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => window.open(KAKAO_CHAT_URL, '_blank', 'noopener')}
          className="w-full py-3 rounded-[14px] font-bold text-sm bg-[#FEE500] text-[#1f1f1f] active:scale-[0.98] transition-transform"
        >
          상담 신청 · 카카오톡 문의 💬
        </button>
        {showIntro && (
          <button
            type="button"
            onClick={() => router.push('/introduction_premium')}
            className="w-full py-3 rounded-[14px] font-bold text-sm bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] active:scale-[0.98] transition-transform"
          >
            프리미엄 서비스 알아보기 →
          </button>
        )}
      </div>
    </div>
  );
}
