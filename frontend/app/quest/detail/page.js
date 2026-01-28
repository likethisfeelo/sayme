'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QuestDetail from '@/components/quest/QuestDetail';

function QuestDetailContent() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('id');
  
  if (!assignmentId) {
    return <div className="min-h-screen flex items-center justify-center">잘못된 접근입니다.</div>;
  }
  
  return <QuestDetail assignmentId={assignmentId} />;
}

export default function QuestDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <QuestDetailContent />
    </Suspense>
  );
}