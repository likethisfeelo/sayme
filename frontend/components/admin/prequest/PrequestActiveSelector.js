/**
 * File: frontend/components/admin/prequest/PrequestActiveSelector.js
 * Description: 활성 사전질문 2개 선택 컴포넌트
 * Used in: /admin/prequest/active
 */
 
'use client';
 
import { useState, useEffect } from 'react';
import { prequestAdminApi } from '@/lib/api/prequest';
import Link from 'next/link';
 
export default function PrequestActiveSelector() {
  const [contents, setContents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentActive, setCurrentActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
 
  useEffect(() => {
    fetchData();
  }, []);
 
  const fetchData = async () => {
    try {
      const [contentsData, activeData] = await Promise.all([
        prequestAdminApi.listContents(),
        prequestAdminApi.getActiveQuestions()
      ]);
      setContents(contentsData.contents || []);
      if (activeData.config) {
        setCurrentActive(activeData.config);
        setSelectedIds(activeData.config.contentIds || []);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const toggleSelect = (contentId) => {
    if (selectedIds.includes(contentId)) {
      setSelectedIds(selectedIds.filter(id => id !== contentId));
    } else {
      if (selectedIds.length >= 2) {
        alert('최대 2개까지만 선택할 수 있습니다');
        return;
      }
      setSelectedIds([...selectedIds, contentId]);
    }
  };
 
  const handleSave = async () => {
    if (selectedIds.length === 0) {
      alert('최소 1개 이상 선택해주세요');
      return;
    }
    setSaving(true);
    try {
      const result = await prequestAdminApi.setActiveQuestions(selectedIds);
      setCurrentActive(result.config);
      alert('활성 사전질문이 설정되었습니다!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold mb-2">활성 사전질문 설정</h1>
        <p className="text-gray-600 mb-6">
          trial-home에 노출할 사전질문을 최대 <strong>2개</strong> 선택하세요.
        </p>
 
        {/* 현재 활성 상태 */}
        {currentActive && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">현재 활성 질문</h3>
            <div className="space-y-1">
              {(currentActive.contents || []).map((c, i) => (
                <p key={c.contentId} className="text-sm text-green-700">
                  {i + 1}. {c.title}
                </p>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-2">
              마지막 수정: {new Date(currentActive.updatedAt).toLocaleString('ko-KR')}
            </p>
          </div>
        )}
 
        {/* 선택 영역 */}
        <div className="mb-4 text-sm text-gray-500">
          선택됨: {selectedIds.length} / 2
        </div>
 
        {contents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            사전질문이 없습니다.{' '}
            <Link href="/admin/prequest/contents/new" className="text-blue-500 hover:underline">
              먼저 만들어주세요
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {contents.map((content) => {
              const isSelected = selectedIds.includes(content.contentId);
              const questionCount = (content.contentItems || []).filter(i => i.type?.startsWith('question')).length;
 
              return (
                <div
                  key={content.contentId}
                  onClick={() => toggleSelect(content.contentId)}
                  className={`
                    bg-white rounded-lg shadow p-5 cursor-pointer transition-all border-2
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'}
                    `}>
                      {isSelected && '✓'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{content.title}</h3>
                      <p className="text-sm text-gray-500">{content.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        질문 {questionCount}개 | {new Date(content.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
 
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving || selectedIds.length === 0}
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {saving ? '저장 중...' : '활성 질문 저장'}
          </button>
          <Link
            href="/admin/prequest"
            className="bg-gray-200 px-6 py-3 rounded hover:bg-gray-300 inline-flex items-center"
          >
            돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}