'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { isAdmin } from '../../lib/auth/checkAdmin';

const menuItems = [
  {
    title: 'Quest 관리',
    description: '퀘스트 생성 및 관리',
    path: '/admin/quest',
    icon: '🎯',
  },
  {
    title: '사용자 목표 관리',
    description: '사용자별 월간/주간 목표 설정',
    path: '/admin/goals',
    icon: '📅',
  },
  {
    title: '티켓 부여',
    description: '사용자에게 티켓 부여',
    path: '/admin/tickets',
    icon: '🎫',
  },
  {
    title: '상담 요청 목록',
    description: '상담 요청 확인 및 관리',
    path: '/admin/consultations',
    icon: '💬',
  },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/me');
      return;
    }
    setLoading(false);
  }, [router]);

  const backgroundStyle = {
    background:
      'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
    color: '#2A2725',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
        <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
        <Header
          subtitle="관리자 메뉴"
          showBackButton
          onBack={() => router.push('/me')}
        />

        <main className="flex-1 px-4 py-4 pb-8 flex flex-col gap-3">
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <h2 className="text-sm font-bold text-[#2A2725] mb-4">관리자 메뉴</h2>

            <div className="flex flex-col gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className="w-full p-4 bg-white/80 hover:bg-white border border-[#E6E0DA] hover:border-[rgba(191,167,255,0.5)] rounded-xl text-left transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-[#2A2725]">{item.title}</div>
                      <div className="text-xs text-[#6B6662] mt-0.5">{item.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
