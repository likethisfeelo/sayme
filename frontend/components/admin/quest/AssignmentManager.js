'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const getAuthHeaders = () => {
  const idToken = localStorage.getItem('idToken');
  return {
    'Content-Type': 'application/json',
    ...(idToken && { 'Authorization': idToken })
  };
};

const questAdminApi = {
  getUserAssignments: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/assignments/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  listContents: async () => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/contents`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  assignContent: async (data) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  unassignContent: async (userId, contentId) => {
    const response = await fetch(`${API_BASE_URL}/quest/admin/assignments`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, contentId }),
    });
    return response.json();
  }
};

export default function AssignmentManager({ userId }) {
  const [assignments, setAssignments] = useState([]);
  const [allContents, setAllContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');

  useEffect(() => {
    console.log('[AssignmentManager] Mounted with userId:', userId);
    loadData();
  }, [userId]);

  const loadData = async () => {
    console.log('[AssignmentManager] Loading data for userId:', userId);
    setLoading(true);
    try {
      const [assignmentsData, contentsData] = await Promise.all([
        questAdminApi.getUserAssignments(userId),
        questAdminApi.listContents(),
      ]);
      console.log('[AssignmentManager] Loaded assignments:', assignmentsData);
      console.log('[AssignmentManager] Loaded contents:', contentsData);
      setAssignments(assignmentsData.assignments || []);
      setAllContents(contentsData.contents || []);
    } catch (error) {
      console.error('[AssignmentManager] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedContent) return;

    try {
      await questAdminApi.assignContent({
        userId,
        sourceContentId: selectedContent,
        orderIndex: assignments.length + 1,
        isCustomized: false,
      });
      setShowAddModal(false);
      setSelectedContent('');
      loadData();
    } catch (error) {
      console.error('Failed to assign content:', error);
      alert('할당 실패');
    }
  };

  const handleUnassign = async (contentId) => {
    if (!confirm('정말 할당을 취소하시겠습니까?')) return;

    try {
      await questAdminApi.unassignContent(userId, contentId);
      loadData();
    } catch (error) {
      console.error('Failed to unassign content:', error);
      alert('취소 실패');
    }
  };

  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">할당된 콘텐츠 (사용자 ID: {userId})</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + 콘텐츠 할당
        </button>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment, index) => (
          <div key={assignment.contentId} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">#{index + 1}</span>
                <h3 className="font-semibold">{assignment.sourceContent?.title}</h3>
                {assignment.isCustomized && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    커스텀
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-1">{assignment.sourceContent?.description}</p>
            </div>
            <button
              onClick={() => handleUnassign(assignment.contentId)}
              className="text-red-500 hover:underline"
            >
              할당 취소
            </button>
          </div>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          할당된 콘텐츠가 없습니다.
        </div>
      )}

      {/* 할당 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">콘텐츠 할당</h3>
            
            <select
              value={selectedContent}
              onChange={(e) => setSelectedContent(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">콘텐츠 선택...</option>
              {allContents.map((content) => (
                <option key={content.contentId} value={content.contentId}>
                  {content.title}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={handleAssign}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={!selectedContent}
              >
                할당하기
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedContent('');
                }}
                className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}