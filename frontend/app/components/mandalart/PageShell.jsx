'use client';

import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';

const BACKGROUND =
  'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED';

/**
 * 만다라트 화면 공통 레이아웃 (모바일 430px 기본, 필요 시 넓게)
 */
export default function PageShell({ subtitle, backTo, maxWidthClass = 'max-w-[430px]', children, bottomPadding = 'pb-10', showMenuButton = true }) {
  const router = useRouter();

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", ui-sans-serif, system-ui, sans-serif',
        background: BACKGROUND,
        color: '#2A2725',
      }}
    >
      <div className={`${maxWidthClass} mx-auto min-h-screen flex flex-col`}>
        <Header
          subtitle={subtitle}
          showMenuButton={showMenuButton}
          maxWidthClass={maxWidthClass}
          zIndexClass="z-30"
          leadingAction={
            backTo ? (
              <button
                type="button"
                onClick={() => router.push(backTo)}
                className="w-[30px] h-[30px] rounded-[9px] border border-[#E6E0DA] bg-white/65 grid place-items-center text-[#2A2725]"
                aria-label="뒤로"
              >
                ‹
              </button>
            ) : null
          }
        />
        <main className={`flex-1 px-4 py-4 ${bottomPadding} flex flex-col gap-3`}>{children}</main>
      </div>
    </div>
  );
}

export const Card = ({ children, className = '', style }) => (
  <section className={`bg-white/75 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${className}`} style={style}>
    {children}
  </section>
);

export const Spinner = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin" />
  </div>
);
