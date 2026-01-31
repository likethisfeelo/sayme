/**
 * File: frontend/app/admin/prequest/active/page.js
 * Description: 활성 사전질문 선택 페이지 (최대 2개)
 * Route: /admin/prequest/active
 */

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