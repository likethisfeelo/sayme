/**
 * File: frontend/app/admin/prequest/contents/page.js
 * Description: 사전질문 콘텐츠 목록 페이지
 * Route: /admin/prequest/contents
 */

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