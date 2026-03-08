'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const getAuthHeaders = (useBearer = false) => {
  const idToken = localStorage.getItem('idToken');
  return {
    'Content-Type': 'application/json',
    ...(idToken && { Authorization: useBearer ? `Bearer ${idToken}` : idToken }),
  };
};

const fetchWithAuthRetry = async (url, options = {}) => {
  const baseOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...getAuthHeaders(false),
    },
  };

  let response = await fetch(url, baseOptions);

  if (response.status === 401) {
    response = await fetch(url, {
      ...baseOptions,
      headers: {
        ...(options.headers || {}),
        ...getAuthHeaders(true),
      },
    });
  }

  return response;
};

const QUESTION_TYPES = new Set(['question_subjective', 'question_objective']);

const QUESTION_TYPE_LABEL = {
  question_subjective: '주관식',
  question_objective: '객관식',
};

const getAssignmentKey = (assignment) =>
  assignment?.contentId || assignment?.sourceContentId || assignment?.assignmentId || '';

const formatQuestionTypeLabel = (type) => QUESTION_TYPE_LABEL[type] || type || '기타';

const resolveObjectiveAnswer = (responseItem, questionItem) => {
  const options = Array.isArray(questionItem?.options) ? questionItem.options : [];
  if (options.length === 0) return responseItem.answer;

  const indexCandidates = [
    responseItem?.selectedOptionIndex,
    responseItem?.optionIndex,
    typeof responseItem?.answer === 'number' ? responseItem.answer : null,
    typeof responseItem?.answer === 'string' && /^\d+$/.test(responseItem.answer.trim())
      ? Number(responseItem.answer.trim())
      : null,
  ].filter((value) => Number.isInteger(value));

  for (const index of indexCandidates) {
    if (index >= 0 && index < options.length) {
      return options[index];
    }
  }

  return responseItem.answer;
};


const prettifyAnswerText = (answer) => {
  if (!answer) return '';
  const parsed = tryParseJson(answer);

  if (typeof parsed === 'string') return parsed;
  if (Array.isArray(parsed)) return parsed.join(', ');

  if (parsed && typeof parsed === 'object') {
    return parsed.answer || parsed.value || parsed.text || parsed.response || JSON.stringify(parsed);
  }

  return String(parsed);
};

const getResponseDisplayText = (responseItem, questionItem) => {
  if (!responseItem) return '응답 없음';

  if (questionItem?.type === 'question_objective') {
    const resolvedObjectiveAnswer = resolveObjectiveAnswer(responseItem, questionItem);
    if (resolvedObjectiveAnswer) return resolvedObjectiveAnswer;
  }

  if (responseItem.answer) return prettifyAnswerText(responseItem.answer);
  if (responseItem.read) return '읽음';
  if (responseItem.watched) return '시청 완료';
  return '응답 없음';
};


const toItemIndex = (value, fallbackIndex = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);

    const match = trimmed.match(/(\d+)/);
    if (match) return Number(match[1]);
  }

  return fallbackIndex;
};

const normalizeResponseEntry = (item, index, objectKey) => {
  const objectKeyHasIndex = objectKey !== undefined && objectKey !== null && /^\d+$/.test(String(objectKey));

  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const hasExplicitIndex = item.itemIndex !== undefined || item.index !== undefined || objectKeyHasIndex;
    const derivedIndex = item.itemIndex ?? item.index ?? objectKey ?? index;

    return {
      itemIndex: toItemIndex(derivedIndex, index),
      hasExplicitIndex,
      answer: item.answer ?? item.value ?? item.text ?? item.response ?? item.selectedOption ?? '',
      selectedOptionIndex: item.selectedOptionIndex ?? item.optionIndex,
      selectedOptionId: item.selectedOptionId,
      read: item.read,
      watched: item.watched,
    };
  }

  return {
    itemIndex: toItemIndex(objectKey, index),
    hasExplicitIndex: objectKeyHasIndex,
    answer: typeof item === 'string' ? item : JSON.stringify(item),
  };
};



const tryParseJson = (value) => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  if (!['{', '['].includes(trimmed[0])) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const unwrapResponseCandidate = (candidate, depth = 0) => {
  if (depth > 4 || candidate === null || candidate === undefined) {
    return candidate;
  }

  const parsedCandidate = tryParseJson(candidate);

  if (Array.isArray(parsedCandidate)) {
    return parsedCandidate;
  }

  if (!parsedCandidate || typeof parsedCandidate !== 'object') {
    return parsedCandidate;
  }

  const nestedCandidates = [
    parsedCandidate.responses,
    parsedCandidate.response,
    parsedCandidate.answers,
    parsedCandidate.answer,
    parsedCandidate.data,
    parsedCandidate.payload,
    parsedCandidate.result,
  ].filter((value) => value !== undefined && value !== null);

  for (const nested of nestedCandidates) {
    const unwrapped = unwrapResponseCandidate(nested, depth + 1);
    if (hasMeaningfulResponseCandidate(unwrapped)) {
      return unwrapped;
    }
  }

  return parsedCandidate;
};

const hasMeaningfulResponseCandidate = (candidate) => {
  if (candidate === null || candidate === undefined) return false;

  if (Array.isArray(candidate)) return candidate.length > 0;

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (!trimmed) return false;
    if (trimmed === '[]' || trimmed === '{}') return false;
    return true;
  }

  if (typeof candidate === 'object') {
    return Object.keys(candidate).length > 0;
  }

  return true;
};


const findResponseForQuestion = (responses, questionItem, questionOrderIndex) => {
  const questionItemIndex = toItemIndex(questionItem.itemIndex, -1);

  const matchedByExplicitIndex = responses.find(
    (candidate) => candidate?.hasExplicitIndex && toItemIndex(candidate.itemIndex, -2) === questionItemIndex
  );
  if (matchedByExplicitIndex) return matchedByExplicitIndex;

  const responseByOrder = responses[questionOrderIndex];
  if (responseByOrder && !responseByOrder.hasExplicitIndex) return responseByOrder;

  return responses.find((candidate) => toItemIndex(candidate.itemIndex, -2) === questionItemIndex) || null;
};

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
    const normalizedCandidate = unwrapResponseCandidate(candidate);
    if (!hasMeaningfulResponseCandidate(normalizedCandidate)) continue;

    if (Array.isArray(normalizedCandidate)) {
      return normalizedCandidate.map((item, index) => normalizeResponseEntry(item, index));
    }

    if (typeof normalizedCandidate === 'string') {
      try {
        const parsed = JSON.parse(normalizedCandidate);
        if (Array.isArray(parsed)) {
          return parsed.map((item, index) => normalizeResponseEntry(item, index));
        }

        if (parsed && typeof parsed === 'object') {
          return Object.entries(parsed).map(([itemIndex, answer], index) =>
            normalizeResponseEntry(answer, index, itemIndex)
          );
        }
      } catch {
        // 문자열이 JSON이 아니면 응답 본문 텍스트로 취급
        return [{ itemIndex: 0, answer: normalizedCandidate }];
      }
    }

    if (typeof normalizedCandidate === 'object') {
      return Object.entries(normalizedCandidate).map(([itemIndex, answer], index) =>
        normalizeResponseEntry(answer, index, itemIndex)
      );
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

  return items
    .map((item, index) => ({
      ...item,
      itemIndex: toItemIndex(item?.itemIndex ?? item?.index, index),
    }))
    .filter((item) => QUESTION_TYPES.has(item?.type));
};

export default function QuestResponsesByUser() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAltUserId, setSelectedAltUserId] = useState('');
  const [selectedExtraUserIds, setSelectedExtraUserIds] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState('');

  const copyJsonToClipboard = async (payload) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert('JSON을 클립보드에 복사했습니다.');
    } catch (error) {
      console.error('Failed to copy JSON:', error);
      alert('JSON 복사에 실패했습니다.');
    }
  };

  const downloadJson = (payload, fileName) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetchWithAuthRetry(`${API_BASE_URL}/quest/admin/users/premium`);
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
    setErrorMessage('');
    try {
      const query = new URLSearchParams({ includeResponses: 'true' });
      if (altUserId) query.set('altUserId', altUserId);
      if (extraUserIds) query.set('extraUserIds', extraUserIds);
      if (assignmentId) query.set('assignmentId', assignmentId);

      const response = await fetchWithAuthRetry(`${API_BASE_URL}/quest/admin/assignments/user/${userId}?${query.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const message = response.status === 401
          ? '인증이 만료되었거나 권한이 없습니다. 다시 로그인 후 시도해주세요.'
          : `HTTP ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      const nextAssignments = data.assignments || [];
      setAssignments(nextAssignments);
      setSelectedAssignmentKey((prev) => {
        if (!nextAssignments.length) return '';
        if (prev && nextAssignments.some((assignment) => getAssignmentKey(assignment) === prev)) return prev;
        return getAssignmentKey(nextAssignments[0]);
      });
      setLastLoadedAt(new Date());
    } catch (error) {
      console.error('Failed to load user assignments:', error);
      setErrorMessage(`사용자별 질문/응답 조회에 실패했습니다. ${error.message || ''}`.trim());
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

      {errorMessage && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {loadingResponses ? (
        <div className="text-gray-600">조회 중...</div>
      ) : (
        <div className="space-y-4">
          {assignments.length > 0 && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <label className="block text-sm font-medium mb-2">질문(할당) 선택</label>
              <select
                value={selectedAssignmentKey}
                onChange={(event) => setSelectedAssignmentKey(event.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {assignments.map((assignment, index) => (
                  <option key={assignment.assignmentId || assignment.contentId || index} value={getAssignmentKey(assignment)}>
                    {(assignment.sourceContent?.title || assignment.content?.title || `질문 ${index + 1}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {assignments.map((assignment, index) => {
            const assignmentKey = getAssignmentKey(assignment);
            if (selectedAssignmentKey && assignmentKey !== selectedAssignmentKey) {
              return null;
            }

            const questionItems = normalizeQuestionItems(assignment);
            const questionMap = new Map(questionItems.map((item) => [toItemIndex(item.itemIndex, -1), item]));
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
                    onClick={() => loadUserResponses(selectedUserId, selectedAltUserId, selectedExtraUserIds, assignment.contentId || assignment.sourceContentId)}
                    className="text-xs px-3 py-1 rounded border bg-gray-50 hover:bg-gray-100"
                  >
                    이 질문 응답 새로고침
                  </button>
                  <button
                    type="button"
                    onClick={() => copyJsonToClipboard(assignment)}
                    className="text-xs px-3 py-1 rounded border bg-gray-50 hover:bg-gray-100"
                  >
                    JSON 복사
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadJson(assignment, `quest-response-${assignmentKey || index}.json`)}
                    className="text-xs px-3 py-1 rounded border bg-gray-50 hover:bg-gray-100"
                  >
                    JSON 다운로드
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
                          <li key={`${assignment.contentId}-q-${itemIndex}`} className="rounded border bg-white p-2">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-semibold">Q{itemIndex + 1}.</span>
                              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                                {formatQuestionTypeLabel(item.type)}
                              </span>
                            </div>
                            <p>{item.question || '질문 없음'}</p>
                            {item.type === 'question_objective' && (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                                {(item.options || []).map((option, optionIndex) => (
                                  <li key={`${assignment.contentId}-q-${itemIndex}-o-${optionIndex}`}>
                                    {optionIndex + 1}. {option}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="border rounded p-3 bg-gray-50">
                    <h3 className="font-semibold mb-2">사용자 응답</h3>
                    {questionItems.length === 0 ? (
                      <p className="text-sm text-gray-500">질문 데이터가 없습니다.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {questionItems.map((questionItem, questionIndex) => {
                          const responseItem = findResponseForQuestion(responses, questionItem, questionIndex);
                          const answerText = getResponseDisplayText(responseItem, questionItem);
                          const isNoResponse = answerText === '응답 없음';

                          return (
                            <li key={`${assignment.assignmentId}-response-by-question-${questionIndex}`} className="rounded border bg-white p-2">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="font-semibold">Q{questionIndex + 1}.</span>
                                {questionItem?.type && (
                                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                                    {formatQuestionTypeLabel(questionItem.type)}
                                  </span>
                                )}
                                {isNoResponse && (
                                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">응답 없음</span>
                                )}
                              </div>
                              <p className={isNoResponse ? 'text-sm text-red-600' : ''}>{answerText}</p>
                            </li>
                          );
                        })}

                        {responses
                          .filter((responseItem) => !questionMap.has(toItemIndex(responseItem.itemIndex, -1)))
                          .map((responseItem, extraIndex) => (
                            <li key={`${assignment.assignmentId}-orphan-response-${extraIndex}`} className="rounded border border-amber-200 bg-amber-50 p-2">
                              <div className="mb-1 text-xs text-amber-700">질문 매핑 실패 응답</div>
                              <p>
                                Q{(responseItem.itemIndex || 0) + 1}. {getResponseDisplayText(responseItem)}
                              </p>
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

          {assignments.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => downloadJson(assignments, `quest-responses-${selectedUserId}.json`)}
                className="text-xs px-3 py-1 rounded border bg-gray-50 hover:bg-gray-100"
              >
                전체 JSON 다운로드
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
