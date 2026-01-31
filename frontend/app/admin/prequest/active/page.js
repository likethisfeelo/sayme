'use client';

import { useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import PrequestActiveSelector from '@/components/admin/prequest/PrequestActiveSelector';

export default function PrequestActivePage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return <PrequestActiveSelector />;
}
