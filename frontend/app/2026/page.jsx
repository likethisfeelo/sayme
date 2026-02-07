'use client';

import { useRouter } from 'next/navigation';
import Header from '../components/Header';

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
            <button
              type="button"
              onClick={() => router.back()}
              className="text-[#2A2725] hover:text-[#BFA7FF] transition-colors text-sm"
            >
              ← 뒤로
            </button>
          }
        />

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] text-center w-full">
            <div className="text-5xl mb-4">🔮</div>
            <h2 className="text-lg font-bold text-[#2A2725] mb-3">2026 연간 리포트</h2>
            <p className="text-sm text-[#6B6662] leading-relaxed">
              준비 중입니다.
            </p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-[rgba(245,241,237,0.78)] backdrop-blur-[14px] border-t border-[rgba(230,224,218,0.9)] px-2.5 py-2.5 pb-3 z-20">
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { icon: '2026', label: '연간', path: '/2026', active: true },
              { icon: '🐇', label: '이번달', path: '/quest' },
              { icon: '●', label: '홈', path: '/premium-home' },
              { icon: '✦', label: '우주', path: '/premium-fortune' },
              { icon: '☺', label: '나', path: '/me' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px] border ${
                  item.active ? 'border-[rgba(191,167,255,0.35)] bg-white/45' : 'border-transparent'
                }`}
              >
                <div
                  className={`w-[34px] h-7 rounded-xl grid place-items-center text-sm ${
                    item.active
                      ? 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.92)] border-transparent text-[rgba(31,31,31,0.92)]'
                      : 'bg-white/55 border border-[rgba(230,224,218,0.9)]'
                  }`}
                >
                  {item.icon}
                </div>
                <div
                  className={`text-[11px] tracking-tight ${
                    item.active ? 'text-[rgba(42,39,37,0.92)] font-bold' : 'text-[rgba(42,39,37,0.70)]'
                  }`}
                >
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}