'use client';

import { useEffect } from 'react';
import { requireAdmin } from '@/lib/auth/checkAdmin';
import Link from 'next/link';

export default function AdminQuestPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Quest 관리</h1>
          <span className="text-sm text-gray-500">👑 관리자 모드</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Link href="/admin/quest/contents">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">📚 콘텐츠 라이브러리</h2>
              <p className="text-gray-600">콘텐츠를 생성하고 관리합니다</p>
            </div>
          </Link>

          <Link href="/admin/quest/assignments">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">👥 사용자 할당</h2>
              <p className="text-gray-600">사용자별로 콘텐츠를 할당합니다</p>
            </div>
          </Link>
        </div>

        <div className="mt-6">
          <Link href="/admin/prequest">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-dashed border-purple-300">
              <h2 className="text-2xl font-bold mb-2">📋 사전질문 관리</h2>
              <p className="text-gray-600">trial-home에 노출할 사전질문을 관리합니다</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
