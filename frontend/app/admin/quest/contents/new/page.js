'use client';

import { useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import ContentForm from '@/components/admin/quest/ContentForm';

export default function NewContentPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return <ContentForm />;
}