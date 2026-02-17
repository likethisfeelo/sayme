'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/checkAdmin';

const menuCards = [
  {
    title: '퀘스트 생성',
    description: '퀘스트 콘텐츠를 생성하고 수정합니다',
    href: '/admin/quest/contents',
    icon: '📝',
  },
  {
    title: '퀘스트 할당',
    description: '사용자별 퀘스트를 할당하고 관리합니다',
    href: '/admin/quest/assignments',
    icon: '🎯',
  },
];

export default function AdminQuestPage() {
  useEffect(() => {
    requireAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">퀘스트 관리</h1>
          <span className="text-sm text-gray-500">👑 관리자 모드</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer h-full">
                <h2 className="text-2xl font-bold mb-2">
                  {card.icon} {card.title}
                </h2>
                <p className="text-gray-600">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/admin" className="text-blue-500 hover:underline text-sm">
            ← 관리자 메뉴로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
