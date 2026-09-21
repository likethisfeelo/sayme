'use client';

import { useRouter } from 'next/navigation';

/**
 * 하단 탭 메뉴 (연간 · 이번달 · 홈 · 우주 · 나)
 * active: '2026' | 'quest' | 'home' | 'fortune' | 'me'
 * 홈은 '/' 로 보내면 회원 등급에 맞는 홈으로 자동 이동
 */
const ITEMS = [
  { key: '2026', icon: '2026', label: '연간', path: '/2026' },
  { key: 'quest', icon: '🐇', label: '이번달', path: '/quest' },
  { key: 'home', icon: '●', label: '홈', path: '/' },
  { key: 'fortune', icon: '✦', label: '우주', path: '/fortune' },
  { key: 'me', icon: '☺', label: '나', path: '/me' },
];

export default function BottomNav({ active, homePath = '/' }) {
  const router = useRouter();
  return (
    <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-[rgba(245,241,237,0.78)] backdrop-blur-[14px] border-t border-[rgba(230,224,218,0.9)] px-2.5 py-2.5 pb-3 z-20">
      <div className="grid grid-cols-5 gap-1.5">
        {ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => router.push(item.key === 'home' ? homePath : item.path)}
              className={`flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px] border ${isActive ? 'border-[rgba(191,167,255,0.35)] bg-white/45' : 'border-transparent'}`}
            >
              <div
                className={`w-[34px] h-7 rounded-xl grid place-items-center text-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.92)] border-transparent text-[rgba(31,31,31,0.92)]'
                    : 'bg-white/55 border border-[rgba(230,224,218,0.9)]'
                }`}
              >
                {item.icon}
              </div>
              <div className={`text-[11px] tracking-tight ${isActive ? 'text-[rgba(42,39,37,0.92)] font-bold' : 'text-[rgba(42,39,37,0.70)]'}`}>{item.label}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
