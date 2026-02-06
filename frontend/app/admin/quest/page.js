'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import { isAdmin } from '@/lib/auth/checkAdmin';

export default function AdminQuestPage() {
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
          subtitle="관리자 · Quest 관리"
          showBackButton
          onBack={() => router.push('/admin')}
        />

        <main className="flex-1 px-4 py-4 pb-8">
          <div className="flex flex-col gap-3">
            <Link href="/admin/quest/contents">
              <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] hover:border-[rgba(191,167,255,0.5)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4 transition-all hover:shadow-md active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <h2 className="font-semibold text-[#2A2725]">콘텐츠 라이브러리</h2>
                    <p className="text-xs text-[#6B6662] mt-0.5">콘텐츠를 생성하고 관리합니다</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/quest/assignments">
              <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] hover:border-[rgba(191,167,255,0.5)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4 transition-all hover:shadow-md active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h2 className="font-semibold text-[#2A2725]">사용자 할당</h2>
                    <p className="text-xs text-[#6B6662] mt-0.5">사용자별로 콘텐츠를 할당합니다</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/prequest">
              <div className="bg-gradient-to-br from-[rgba(191,167,255,0.15)] to-[rgba(123,203,255,0.1)] backdrop-blur-sm border border-[rgba(191,167,255,0.3)] hover:border-[rgba(191,167,255,0.5)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4 transition-all hover:shadow-md active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <h2 className="font-semibold text-[#2A2725]">사전질문 관리</h2>
                    <p className="text-xs text-[#6B6662] mt-0.5">trial-home에 노출할 사전질문을 관리합니다</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}