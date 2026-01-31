/**
 * File: frontend/components/admin/prequest/PrequestContentForm.js
 * Description: 사전질문 콘텐츠 생성/수정 폼 (주관식, 객관식, 텍스트)
 * Used in: /admin/prequest/contents/new
 */

'use client';
 
import { useState } from 'react';
import { prequestAdminApi } from '@/lib/api/prequest';
import { useRouter } from 'next/navigation';
 
export default function PrequestContentForm({ initialData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
 
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    tags: initialData?.metadata?.tags?.join(', ') || '',
  });
 
  const [contentItems, setContentItems] = useState(
    initialData?.contentItems || []
  );
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
 
    try {
      const data = {
        title: formData.title,
        description: formData.description,
        contentItems,
        metadata: {
          estimatedTime: '5분',
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        },
      };
 
      if (initialData?.contentId) {
        await prequestAdminApi.updateContent(initialData.contentId, data);
      } else {
        await prequestAdminApi.createContent(data);
      }
 
      alert('저장되었습니다!');
      router.push('/admin/prequest/contents');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장 실패');
    } finally {
      setLoading(false);
    }
  };
 
  const addContentItem = (type) => {
    const newItem = { type };
    if (type === 'question_objective') {
      newItem.options = ['', ''];
    }
    setContentItems([...contentItems, newItem]);
  };
 
  const removeContentItem = (index) => {
    setContentItems(contentItems.filter((_, i) => i !== index));
  };
 
  const updateContentItem = (index, field, value) => {
    const updated = [...contentItems];
    updated[index] = { ...updated[index], [field]: value };
    setContentItems(updated);
  };
 
  const addOption = (itemIndex) => {
    const updated = [...contentItems];
    if (!updated[itemIndex].options) updated[itemIndex].options = [];
    updated[itemIndex].options.push('');
    setContentItems(updated);
  };
 
  const removeOption = (itemIndex, optionIndex) => {
    const updated = [...contentItems];
    updated[itemIndex].options = updated[itemIndex].options.filter((_, i) => i !== optionIndex);
    setContentItems(updated);
  };
 
  const updateOption = (itemIndex, optionIndex, value) => {
    const updated = [...contentItems];
    updated[itemIndex].options[optionIndex] = value;
    setContentItems(updated);
  };
 
  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        {initialData ? '사전질문 수정' : '새 사전질문 만들기'}
      </h1>
 
      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
 
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">제목</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="예: 2월의 사전질문"
            required
          />
        </div>
 
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">설명</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={2}
            placeholder="이 사전질문에 대한 간단한 설명"
          />
        </div>
 
        <div>
          <label className="block text-sm font-medium mb-2">태그 (쉼표로 구분)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="성찰, 자기이해"
          />
        </div>
      </div>
 
      {/* 콘텐츠 구성 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">질문 구성</h2>
 
        {contentItems.map((item, index) => (
          <div key={index} className="border rounded p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">
                항목 {index + 1} -{' '}
                {item.type === 'text' ? '안내 텍스트' :
                 item.type === 'question_subjective' ? '주관식 질문' :
                 item.type === 'question_objective' ? '객관식 질문' : ''}
              </h3>
              <button
                type="button"
                onClick={() => removeContentItem(index)}
                className="text-red-500 hover:underline"
              >
                삭제
              </button>
            </div>
 
            {item.type === 'question_subjective' && (
              <>
                <textarea
                  placeholder="질문 내용"
                  value={item.question || ''}
                  onChange={(e) => updateContentItem(index, 'question', e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-2"
                  rows={3}
                />
                <input
                  type="text"
                  placeholder="placeholder (선택)"
                  value={item.placeholder || ''}
                  onChange={(e) => updateContentItem(index, 'placeholder', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </>
            )}
 
            {item.type === 'question_objective' && (
              <>
                <textarea
                  placeholder="질문 내용"
                  value={item.question || ''}
                  onChange={(e) => updateContentItem(index, 'question', e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-3"
                  rows={3}
                />
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-2">선택지</label>
                  {(item.options || []).map((option, optIdx) => (
                    <div key={optIdx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`옵션 ${optIdx + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, optIdx, e.target.value)}
                        className="flex-1 border rounded px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index, optIdx)}
                        className="text-red-500 px-3"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(index)}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    + 선택지 추가
                  </button>
                </div>
              </>
            )}
 
            {item.type === 'text' && (
              <>
                <input
                  type="text"
                  placeholder="제목 (선택)"
                  value={item.title || ''}
                  onChange={(e) => updateContentItem(index, 'title', e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-2"
                />
                <textarea
                  placeholder="안내 텍스트"
                  value={item.description || ''}
                  onChange={(e) => updateContentItem(index, 'description', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </>
            )}
          </div>
        ))}
 
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => addContentItem('question_subjective')}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            + 주관식 질문
          </button>
          <button
            type="button"
            onClick={() => addContentItem('question_objective')}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            + 객관식 질문
          </button>
          <button
            type="button"
            onClick={() => addContentItem('text')}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            + 안내 텍스트
          </button>
        </div>
      </div>
 
      {/* 버튼 */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '저장 중...' : '저장하기'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-200 px-6 py-3 rounded hover:bg-gray-300"
        >
          취소
        </button>
      </div>
    </form>
  );
}