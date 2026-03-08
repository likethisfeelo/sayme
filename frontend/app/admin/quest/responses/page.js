'use client';

import { Suspense, useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import QuestResponsesByUser from '@/components/admin/quest/QuestResponsesByUser';

export default function QuestResponsesPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return (
    <Suspense fallback={<div className="p-8">로딩 중...</div>}>
      <QuestResponsesByUser />
    </Suspense>
  );
}
