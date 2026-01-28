'use client';

import { useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import ContentList from '@/components/admin/quest/ContentList';

export default function ContentsPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return <ContentList />;
}