'use client';

import { useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import UserAssignmentList from '@/components/admin/quest/UserAssignmentList';

export default function AssignmentsPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return <UserAssignmentList />;
}