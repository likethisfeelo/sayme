'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ❌ 이전: Named import
// import { questAdminApi } from '@/lib/api/quest';

// ✅ 변경: 직접 정의
const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const getAuthHeaders = () => {
  const idToken = localStorage.getItem('idToken');
  return {
    'Content-Type': 'application/json',
    ...(idToken && { 'Authorization': idToken })
  };
};

const questAdminApi = {
  listContents: async () => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
  
  deleteContent: async (contentId) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents/${contentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

export default function ContentList() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    console.log('[ContentList] Component mounted'); // 디버그 로그
    loadContents();
  }, []);

  const loadContents = async () => {
    console.log('[ContentList] Loading contents...'); // 디버그 로그
    setLoading(true);
    try {
      const data = await questAdminApi.listContents();
      console.log('[ContentList] Loaded:', data); // 디버그 로그
      setContents(data.contents || []);
    } catch (error) {
      console.error('[ContentList] Failed to load contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await questAdminApi.deleteContent(contentId);
      loadContents();
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('삭제 실패');
    }
  };

  const filteredContents = contents.filter(c => 
    filter === 'all' ? true : c.type === filter
  );

  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">콘텐츠 라이브러리</h1>
        <Link href="/admin/quest/contents/new">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            + 새 콘텐츠
          </button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('template')}
          className={`px-4 py-2 rounded ${filter === 'template' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          공용 템플릿
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded ${filter === 'draft' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          임시 보관함
        </button>
      </div>

      <div className="grid gap-4">
        {filteredContents.map((content) => (
          <div key={content.contentId} className="border rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{content.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    content.type === 'template' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {content.type === 'template' ? '공용' : '임시'}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{content.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>⏱️ {content.metadata?.estimatedTime || '10분'}</span>
                  <span>📊 사용: {content.usage?.userCount || 0}명</span>
                  <span>⭐ 만족도: {content.usage?.avgSatisfaction?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(content.contentId)}
                  className="text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredContents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          콘텐츠가 없습니다.
        </div>
      )}
    </div>
  );
}