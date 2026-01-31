/**
 * File: frontend/app/admin/prequest/contents/new/page.js
 * Description: 사전질문 콘텐츠 생성 페이지
 * Route: /admin/prequest/contents/new
 */

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