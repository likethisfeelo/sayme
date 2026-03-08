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

const QUESTION_TYPES = new Set(['question_subjective', 'question_objective']);

const normalizeResponses = (assignment) => {
  const candidates = [
    assignment?.progress?.responses,
    assignment?.progress?.answers,
    assignment?.userResponse?.responses,
    assignment?.userResponse?.response,
    assignment?.userResponse?.answers,
    assignment?.response?.responses,
    assignment?.response,
    assignment?.responses,
    assignment?.answers,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (Array.isArray(candidate)) {
      return candidate.map((item, index) => {
        if (item && typeof item === 'object') {
          return {
            itemIndex: item.itemIndex ?? item.index ?? index,
            answer: item.answer ?? item.value ?? item.text ?? item.response ?? item.selectedOption ?? '',
            read: item.read,
            watched: item.watched,
          };
        }

        return {
          itemIndex: index,
          answer: typeof item === 'string' ? item : JSON.stringify(item),
        };
      });
    }

    if (typeof candidate === 'string') {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') {
          return Object.entries(parsed).map(([itemIndex, answer]) => ({
            itemIndex: Number(itemIndex),
            answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
          }));
        }
      } catch {
        // 문자열이 JSON이 아니면 응답 본문 텍스트로 취급
        return [{ itemIndex: 0, answer: candidate }];
      }
    }

    if (typeof candidate === 'object') {
      return Object.entries(candidate).map(([itemIndex, answer]) => {
        if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
          return {
            itemIndex: Number(itemIndex),
            answer: answer.answer ?? answer.value ?? answer.text ?? answer.response ?? JSON.stringify(answer),
            read: answer.read,
            watched: answer.watched,
          };
        }

        return {
          itemIndex: Number(itemIndex),
          answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        };
      });
    }
  }

  return [];
};

const normalizeQuestionItems = (assignment) => {
  const candidates = [
    assignment?.sourceContent?.contentItems,
    assignment?.content?.contentItems,
    assignment?.contentItems,
    assignment?.questions,
  ];

  const items = candidates.find((candidate) => Array.isArray(candidate)) || [];
  return items.filter((item) => QUESTION_TYPES.has(item?.type));
};

export default function QuestResponsesByUser() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAltUserId, setSelectedAltUserId] = useState('');
  const [selectedExtraUserIds, setSelectedExtraUserIds] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');

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

  const loadUserResponses = async (userId, altUserId = '', extraUserIds = '', assignmentId = '') => {
    if (!userId) {
      setAssignments([]);
      setLastLoadedAt(null);
      return;
    }

    setLoadingResponses(true);
    try {
      const query = new URLSearchParams({ includeResponses: 'true' });
      if (altUserId) query.set('altUserId', altUserId);
      if (extraUserIds) query.set('extraUserIds', extraUserIds);
      if (assignmentId) query.set('assignmentId', assignmentId);

      const response = await fetch(`${API_BASE_URL}/quest/admin/assignments/user/${userId}?${query.toString()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const nextAssignments = data.assignments || [];
      setAssignments(nextAssignments);
      setSelectedAssignmentId((prev) => {
        if (!nextAssignments.length) return '';
        if (prev && nextAssignments.some((assignment) => assignment.contentId === prev)) return prev;
        return nextAssignments[0].contentId;
      });
      setLastLoadedAt(new Date());
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

      <div className="mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-2">사용자 선택</label>
          <select
            value={selectedUserId}
            onChange={(event) => {
              const selected = users.find((user) => (user.sub || user.username) === event.target.value);
              const nextUserId = selected?.sub || selected?.username || '';
              const nextAltUserId = selected?.sub ? selected.username : '';
              const nextExtraUserIds = [selected?.email, selected?.username, selected?.sub]
                .filter(Boolean)
                .join(',');

              setSelectedUserId(nextUserId);
              setSelectedAltUserId(nextAltUserId);
              setSelectedExtraUserIds(nextExtraUserIds);
              loadUserResponses(nextUserId, nextAltUserId, nextExtraUserIds);
            }}
            className="w-full min-w-[320px] border rounded px-3 py-2"
            disabled={loadingUsers}
          >
            <option value="">사용자를 선택하세요</option>
            {users.map((user) => (
              <option key={user.username} value={user.sub || user.username}>
                {user.name || user.username} ({user.email || '이메일 없음'})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => loadUserResponses(selectedUserId, selectedAltUserId, selectedExtraUserIds)}
          disabled={!selectedUserId || loadingResponses}
          className="px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50"
        >
          {loadingResponses ? '새로고침 중...' : '응답 새로고침'}
        </button>
      </div>

      {lastLoadedAt && (
        <p className="text-xs text-gray-500 mb-4">
          마지막 조회: {lastLoadedAt.toLocaleString('ko-KR')}
        </p>
      )}

      {loadingResponses ? (
        <div className="text-gray-600">조회 중...</div>
      ) : (
        <div className="space-y-4">
          {assignments.length > 0 && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <label className="block text-sm font-medium mb-2">질문(할당) 선택</label>
              <select
                value={selectedAssignmentId}
                onChange={(event) => setSelectedAssignmentId(event.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {assignments.map((assignment, index) => (
                  <option key={assignment.assignmentId || assignment.contentId || index} value={assignment.contentId}>
                    {(assignment.sourceContent?.title || assignment.content?.title || `질문 ${index + 1}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {assignments.map((assignment, index) => {
            if (selectedAssignmentId && assignment.contentId !== selectedAssignmentId) {
              return null;
            }

            const questionItems = normalizeQuestionItems(assignment);
            const responses = normalizeResponses(assignment);

            return (
              <div key={assignment.assignmentId || `${assignment.contentId}-${index}`} className="border rounded-lg p-4 bg-white">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                  <h2 className="font-semibold text-lg">{assignment.sourceContent?.title || assignment.content?.title || '제목 없음'}</h2>
                  <p className="text-sm text-gray-600">상태: {assignment.progress?.status || assignment.status || 'waiting'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadUserResponses(selectedUserId, selectedAltUserId, selectedExtraUserIds, assignment.contentId)}
                    className="text-xs px-3 py-1 rounded border bg-gray-50 hover:bg-gray-100"
                  >
                    이 질문 응답 새로고침
                  </button>
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
