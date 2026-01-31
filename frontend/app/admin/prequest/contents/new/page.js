'use client';

import { useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import PrequestContentForm from '@/components/admin/prequest/PrequestContentForm';

export default function NewPrequestContentPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return <PrequestContentForm />;
}
