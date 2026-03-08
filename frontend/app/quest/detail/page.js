'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuestDetail from '@/components/quest/QuestDetail';

function QuestDetailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('id');
  const isReadonly = searchParams.get('mode') === 'readonly';

  if (!assignmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#2A2725] font-semibold mb-3">잘못된 접근입니다.</p>
          <button
            onClick={() => router.push('/quest')}
            className="px-4 py-2 rounded-lg bg-[#2A2725] text-white text-sm"
          >
            퀘스트 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return <QuestDetail assignmentId={assignmentId} readonlyMode={isReadonly} />;
}

export default function QuestDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <QuestDetailPageContent />
    </Suspense>
  );
}