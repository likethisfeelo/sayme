'use client';

import { useState, useEffect } from 'react';
import AssignmentManager from './AssignmentManager';

const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const getAuthHeaders = () => {
  const idToken = localStorage.getItem('idToken');
  return {
    'Content-Type': 'application/json',
    ...(idToken && { 'Authorization': idToken })
  };
};

export default function UserAssignmentList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    console.log('[UserAssignmentList] Loading premium users...');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quest/admin/users/premium`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[UserAssignmentList] Loaded users:', data);
      setUsers(data.users || []);
    } catch (error) {
      console.error('[UserAssignmentList] Failed to load users:', error);
      alert('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }

  // 사용자가 선택되면 AssignmentManager 표시
  if (selectedUserId) {
    return (
      <div className="p-8">
        <button
          onClick={() => setSelectedUserId(null)}
          className="mb-4 text-blue-500 hover:underline"
        >
          ← 사용자 목록으로 돌아가기
        </button>
        <AssignmentManager userId={selectedUserId} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Premium 사용자 목록</h2>

      <input
        type="text"
        placeholder="이메일 또는 이름으로 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border rounded px-4 py-2 mb-6"
      />

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <div key={user.username} className="border rounded-lg p-4 hover:shadow-lg transition">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>
              <button
                onClick={() => setSelectedUserId(user.username)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                콘텐츠 관리
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {users.length === 0 ? 'Premium 사용자가 없습니다.' : '사용자를 찾을 수 없습니다.'}
        </div>
      )}
    </div>
  );
}