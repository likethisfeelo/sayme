'use client';

import { useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import PrequestContentList from '@/components/admin/prequest/PrequestContentList';

export default function PrequestContentsPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return <PrequestContentList />;
}
