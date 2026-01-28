'use client';

import { useState } from 'react';
import { questAdminApi } from '@/lib/api/quest';
import { useRouter } from 'next/navigation';

export default function ContentForm({ initialData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'template',
    estimatedTime: initialData?.metadata?.estimatedTime || '10분',
    difficulty: initialData?.metadata?.difficulty || 'medium',
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
        type: formData.type,
        contentItems,
        metadata: {
          estimatedTime: formData.estimatedTime,
          difficulty: formData.difficulty,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        },
        feedbackOptions: {
          enableReaction: true,
          enableComment: true,
          enableSatisfaction: true,
        },
        isPublic: formData.type === 'template',
      };

      if (initialData?.contentId) {
        await questAdminApi.updateContent(initialData.contentId, data);
      } else {
        await questAdminApi.createContent(data);
      }

      alert('저장되었습니다!');
      router.push('/admin/quest/contents');
    } catch (error) {
      console.error('Failed to save content:', error);
      alert('저장 실패');
    } finally {
      setLoading(false);
    }
  };

  const addContentItem = (type) => {
    const newItem = { type };
    
    // 객관식 질문의 경우 기본 옵션 2개 추가
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
    if (!updated[itemIndex].options) {
      updated[itemIndex].options = [];
    }
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

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">미리보기</h1>
            <button
              onClick={() => setShowPreview(false)}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              편집으로 돌아가기
            </button>
          </div>

          {/* 진행률 바 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{formData.title}</span>
              <span>1 / {contentItems.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }} />
            </div>
          </div>

          {/* 첫 번째 콘텐츠 아이템 미리보기 */}
          {contentItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {contentItems[0].type === 'youtube' && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{contentItems[0].title || '제목 없음'}</h2>
                  <p className="text-gray-600 mb-6">{contentItems[0].description || '설명 없음'}</p>
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">YouTube 영상 영역</span>
                  </div>
                </div>
              )}

              {contentItems[0].type === 'text' && (
                <div className="prose max-w-none whitespace-pre-wrap">
                  {contentItems[0].description || '내용이 없습니다.'}
                </div>
              )}

              {contentItems[0].type === 'question_subjective' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">{contentItems[0].question || '질문을 입력하세요'}</h2>
                  <textarea
                    placeholder={contentItems[0].placeholder || '자유롭게 작성해주세요...'}
                    className="w-full border-2 rounded-lg p-4 min-h-[200px]"
                    disabled
                  />
                </div>
              )}

              {contentItems[0].type === 'question_objective' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">{contentItems[0].question || '질문을 입력하세요'}</h2>
                  <div className="space-y-3">
                    {(contentItems[0].options || []).map((option, idx) => (
                      <label key={idx} className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="preview-option" className="mr-3" disabled />
                        <span>{option || `옵션 ${idx + 1}`}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium">
                  다음 →
                </button>
              </div>
            </div>
          )}

          {contentItems.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
              콘텐츠를 추가해주세요
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        {initialData ? '콘텐츠 수정' : '새 콘텐츠 만들기'}
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
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">설명</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">유형</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="template">공용 템플릿</option>
              <option value="draft">임시 보관</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">예상 시간</label>
            <input
              type="text"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="10분"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">난이도</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="easy">가벼운</option>
              <option value="medium">중간</option>
              <option value="hard">깊은</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">태그 (쉼표로 구분)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="성찰, 목표, 습관"
          />
        </div>
      </div>

      {/* 콘텐츠 구성 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">콘텐츠 구성</h2>

        {contentItems.map((item, index) => (
          <div key={index} className="border rounded p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">단계 {index + 1} - {
                item.type === 'youtube' ? '유튜브 영상' :
                item.type === 'text' ? '직접 작성 글' :
                item.type === 'question_subjective' ? '주관식 질문' :
                item.type === 'question_objective' ? '객관식 질문' : ''
              }</h3>
              <button
                type="button"
                onClick={() => removeContentItem(index)}
                className="text-red-500 hover:underline"
              >
                삭제
              </button>
            </div>

            {item.type === 'youtube' && (
              <>
                <input
                  type="text"
                  placeholder="제목"
                  value={item.title || ''}
                  onChange={(e) => updateContentItem(index, 'title', e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-2"
                />
                <input
                  type="url"
                  placeholder="YouTube URL"
                  value={item.url || ''}
                  onChange={(e) => updateContentItem(index, 'url', e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-2"
                />
                <textarea
                  placeholder="설명"
                  value={item.description || ''}
                  onChange={(e) => updateContentItem(index, 'description', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </>
            )}

            {item.type === 'question_subjective' && (
              <>
                <textarea
                  placeholder="질문"
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
                  placeholder="질문"
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
              <textarea
                placeholder="직접 작성 글"
                value={item.description || ''}
                onChange={(e) => updateContentItem(index, 'description', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={5}
              />
            )}
          </div>
        ))}

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => addContentItem('youtube')}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            + 유튜브 영상
          </button>
          <button
            type="button"
            onClick={() => addContentItem('text')}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            + 직접 작성 글
          </button>
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
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePreview}
          className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600"
        >
          미리보기
        </button>
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