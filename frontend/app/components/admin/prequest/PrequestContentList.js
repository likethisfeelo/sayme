/**
 * File: frontend/components/admin/prequest/PrequestContentList.js
 * Description: 사전질문 콘텐츠 목록 컴포넌트
 * Used in: /admin/prequest/contents
 */

'use client';
 
import { useState, useEffect } from 'react';
import { prequestAdminApi } from '@/lib/api/prequest';
import Link from 'next/link';
 
export default function PrequestContentList() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetchContents();
  }, []);
 
  const fetchContents = async () => {
    try {
      const data = await prequestAdminApi.listContents();
      setContents(data.contents || []);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleDelete = async (contentId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await prequestAdminApi.deleteContent(contentId);
      setContents(contents.filter(c => c.contentId !== contentId));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제 실패');
    }
  };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">사전질문 라이브러리</h1>
          <Link
            href="/admin/prequest/contents/new"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            + 새 사전질문 만들기
          </Link>
        </div>
 
        {contents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            아직 사전질문이 없습니다. 새로 만들어보세요!
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((content) => (
              <div key={content.contentId} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{content.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{content.description}</p>
                    <div className="text-xs text-gray-400">
                      ID: {content.contentId} |
                      질문 수: {(content.contentItems || []).filter(i => i.type?.startsWith('question')).length}개 |
                      생성: {new Date(content.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDelete(content.contentId)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
 
        <div className="mt-6">
          <Link href="/admin/prequest" className="text-blue-500 hover:underline text-sm">
            ← 사전질문 관리로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}