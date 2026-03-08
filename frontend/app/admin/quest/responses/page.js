'use client';

import { useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import QuestResponsesByUser from '@/components/admin/quest/QuestResponsesByUser';

export default function QuestResponsesPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return <QuestResponsesByUser />;
}
