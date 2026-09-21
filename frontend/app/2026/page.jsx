'use client';

import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import PremiumOnlyCard from '../components/PremiumOnlyCard';

export default function Year2026Page() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        color: '#2A2725',
      }}
    >
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
        <Header
          subtitle="2026 연간"
          showMenuButton
          zIndexClass="z-50"
          leadingAction={
            <button type="button" onClick={() => router.back()} className="text-[#2A2725] hover:text-[#BFA7FF] transition-colors text-sm">
              ← 뒤로
            </button>
          }
        />

        <main className="flex-1 flex items-center justify-center px-4 pb-[86px]">
          <PremiumOnlyCard
            icon="🔮"
            title="연간 리포트 준비 중입니다"
            description={'프리미엄 회원을 위한 서비스입니다.\n상담 신청은 아래 카카오톡으로 문의해 주세요.'}
          />
        </main>

        <BottomNav active="2026" />
      </div>
    </div>
  );
}
