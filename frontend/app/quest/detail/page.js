'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import QuestDetail from '@/components/quest/QuestDetail';

export default function QuestDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = useMemo(() => searchParams.get('id') || '', [searchParams]);

  if (!assignmentId) {
    return (
      <div
        className="min-h-screen"
        style={{
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
        }}
      >
        <Header
          subtitle="Quest"
          leadingAction={
            <button onClick={() => router.push('/quest')} className="text-sm text-[#6B6662]">
              ← 돌아가기
            </button>
          }
        />

        <main className="px-4 py-6 max-w-[430px] mx-auto">
          <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 text-center">
            <p className="text-sm text-[#6B6662] mb-3">퀘스트 정보를 찾지 못했습니다.</p>
            <button
              onClick={() => router.push('/quest')}
              className="px-4 py-2 bg-[#2A2725] text-white rounded-lg text-sm font-semibold"
            >
              퀘스트 목록으로 이동
            </button>
          </div>
        </main>
      </div>
    );
  }

  return <QuestDetail assignmentId={assignmentId} />;
}
