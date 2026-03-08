'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const getAuthHeaders = () => {
  const idToken = localStorage.getItem('idToken');
  return {
    'Content-Type': 'application/json',
    ...(idToken && { Authorization: idToken }),
  };
};

export default function QuestResponsesByUser() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch(`${API_BASE_URL}/quest/admin/users/premium`, {
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load users:', error);
        alert('사용자 목록 조회에 실패했습니다.');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const loadUserResponses = async (userId) => {
    if (!userId) {
      setAssignments([]);
      return;
    }

    setLoadingResponses(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quest/admin/assignments/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Failed to load user assignments:', error);
      alert('사용자별 질문/응답 조회에 실패했습니다.');
    } finally {
      setLoadingResponses(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사용자별 질문 · 응답 조회</h1>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">사용자 선택</label>
        <select
          value={selectedUserId}
          onChange={(event) => {
            const nextUserId = event.target.value;
            setSelectedUserId(nextUserId);
            loadUserResponses(nextUserId);
          }}
          className="w-full max-w-md border rounded px-3 py-2"
          disabled={loadingUsers}
        >
          <option value="">사용자를 선택하세요</option>
          {users.map((user) => (
            <option key={user.username} value={user.username}>
              {user.name || user.username} ({user.email || '이메일 없음'})
            </option>
          ))}
        </select>
      </div>

      {loadingResponses ? (
        <div className="text-gray-600">조회 중...</div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment, index) => {
            const questionItems = (assignment.sourceContent?.contentItems || []).filter(
              (item) => item.type === 'question_subjective' || item.type === 'question_objective'
            );
            const responses = assignment.progress?.responses || [];

            return (
              <div key={assignment.assignmentId || `${assignment.contentId}-${index}`} className="border rounded-lg p-4 bg-white">
                <div className="mb-3">
                  <h2 className="font-semibold text-lg">{assignment.sourceContent?.title || '제목 없음'}</h2>
                  <p className="text-sm text-gray-600">상태: {assignment.progress?.status || 'waiting'}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded p-3 bg-gray-50">
                    <h3 className="font-semibold mb-2">할당된 질문</h3>
                    {questionItems.length === 0 ? (
                      <p className="text-sm text-gray-500">질문 데이터가 없습니다.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {questionItems.map((item, itemIndex) => (
                          <li key={`${assignment.contentId}-q-${itemIndex}`}>
                            <span className="font-semibold">Q{itemIndex + 1}.</span> {item.question || '질문 없음'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="border rounded p-3 bg-gray-50">
                    <h3 className="font-semibold mb-2">사용자 응답</h3>
                    {responses.length === 0 ? (
                      <p className="text-sm text-gray-500">아직 응답이 없습니다.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {responses
                          .slice()
                          .sort((a, b) => (a.itemIndex || 0) - (b.itemIndex || 0))
                          .map((responseItem, responseIndex) => (
                            <li key={`${assignment.assignmentId}-r-${responseIndex}`}>
                              <span className="font-semibold">Q{(responseItem.itemIndex || 0) + 1}.</span>{' '}
                              {responseItem.answer || (responseItem.read ? '읽음' : responseItem.watched ? '시청 완료' : '응답 없음')}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {selectedUserId && assignments.length === 0 && (
            <div className="text-gray-500">선택한 사용자에게 할당된 질문이 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
