'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { questUserApi } from '@/lib/api/quest';
import Header from '../components/Header';

const mapQuestStatus = (status) => {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'active';
  return 'active';
};

const getStatusConfig = (status) => {
  const configs = {
    active: {
      badge: 'bg-[rgba(123,203,255,0.15)] text-[rgba(123,203,255,0.95)] border-[rgba(123,203,255,0.25)]',
      label: '진행 중',
      icon: '▶️',
    },
    completed: {
      badge: 'bg-[rgba(46,139,87,0.15)] text-[rgba(46,139,87,0.95)] border-[rgba(46,139,87,0.25)]',
      label: '완료',
      icon: '✅',
    },
    locked: {
      badge: 'bg-[rgba(107,102,98,0.15)] text-[rgba(107,102,98,0.95)] border-[rgba(107,102,98,0.25)]',
      label: '잠김',
      icon: '🔒',
    },
  };
  return configs[status] || configs.locked;
};

const isCurrentMonth = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
};

export default function QuestPage() {
  const router = useRouter();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('idToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchQuests(token);
  }, [router]);

  const fetchQuests = async (token) => {
    try {
      const data = await questUserApi.getMyContents(token);
      const assignments = data?.contents || [];

      const mapped = assignments.map((quest, index) => {
        const content = quest?.content || {};
        return {
          questId: quest.assignmentId || `${index}`,
          title: content.title || content.question || content.description || '제목 없음',
          description: content.description || content.question || '',
          status: mapQuestStatus(quest?.progress?.status),
          progress: quest?.progress?.percent,
          reward: content.reward,
          assignedAt: quest?.assignedAt,
          completedAt: quest?.progress?.completedAt,
        };
      });

      setQuests(mapped);
    } catch (error) {
      console.error('Quest fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 이번 달 어사인된 퀘스트만 필터
  const thisMonthQuests = quests.filter((quest) => isCurrentMonth(quest.assignedAt));

  const filteredQuests = thisMonthQuests.filter((quest) => {
    if (filter === 'all') return true;
    if (filter === 'active') return quest.status === 'active';
    if (filter === 'completed') return quest.status === 'completed';
    return true;
  });

  const stats = {
    total: thisMonthQuests.length,
    completed: thisMonthQuests.filter((quest) => quest.status === 'completed').length,
    active: thisMonthQuests.filter((quest) => quest.status === 'active').length,
  };

  const monthLabel = `${new Date().getMonth() + 1}월`;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
        }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6662]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        color: '#2A2725',
      }}
    >
      <Header
        subtitle={`Quest · ${monthLabel} 도전 과제`}
        showMenuButton
        zIndexClass="z-50"
        leadingAction={
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[#2A2725] hover:text-[#BFA7FF] transition-colors text-sm"
          >
            ← 뒤로
          </button>
        }
      />

      {/* Main Content */}
      <main className="px-4 py-6 pb-[86px] max-w-[430px] mx-auto">
        {/* Stats Summary */}
        <section className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <h2 className="text-lg font-bold text-[#2A2725] mb-4">나의 이번달 Quest 현황</h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-[rgba(191,167,255,0.05)] rounded-xl border border-[rgba(191,167,255,0.15)]">
                <div className="text-2xl font-bold text-[#2A2725] mb-1">{stats.total}</div>
                <div className="text-xs text-[#6B6662]">전체</div>
              </div>

              <div className="text-center p-3 bg-[rgba(123,203,255,0.05)] rounded-xl border border-[rgba(123,203,255,0.15)]">
                <div className="text-2xl font-bold text-[rgba(123,203,255,0.95)] mb-1">{stats.active}</div>
                <div className="text-xs text-[#6B6662]">진행 중</div>
              </div>

              <div className="text-center p-3 bg-[rgba(46,139,87,0.05)] rounded-xl border border-[rgba(46,139,87,0.15)]">
                <div className="text-2xl font-bold text-[rgba(46,139,87,0.95)] mb-1">{stats.completed}</div>
                <div className="text-xs text-[#6B6662]">완료</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="mb-4">
          <div className="flex gap-2 bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[14px] p-1">
            {[
              { key: 'all', label: '전체' },
              { key: 'active', label: '진행 중' },
              { key: 'completed', label: '완료' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 py-2 px-3 rounded-[10px] text-sm font-semibold transition-all ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] shadow-sm'
                    : 'text-[#6B6662] hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Quest List */}
        <section className="space-y-3">
          {filteredQuests.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-[#6B6662] text-sm">
                {filter === 'all'
                  ? `이번 달 Quest가 없습니다`
                  : filter === 'active'
                  ? '진행 중인 Quest가 없습니다'
                  : '완료한 Quest가 없습니다'}
              </p>
            </div>
          ) : (
            filteredQuests.map((quest, index) => {
              const config = getStatusConfig(quest.status);

              return (
                <button
                  key={quest.questId || index}
                  onClick={() => router.push(`/quest/detail?id=${quest.questId}`)}
                  className="w-full text-left transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <div className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-lg transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${config.badge} font-medium`}>
                            {config.label}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#2A2725] mb-1 leading-tight">{quest.title}</h3>
                        <p className="text-sm text-[#6B6662] leading-relaxed line-clamp-2">{quest.description}</p>
                      </div>
                    </div>

                    {/* Progress Bar (for active quests) */}
                    {quest.status === 'active' && quest.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#6B6662]">진행률</span>
                          <span className="text-xs font-semibold text-[#2A2725]">{quest.progress}%</span>
                        </div>
                        <div className="h-2 bg-[rgba(230,224,218,0.5)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] transition-all duration-500"
                            style={{ width: `${quest.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Reward Info */}
                    {quest.reward && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#A9B4A0]">
                        <span>🎁</span>
                        <span>{quest.reward}</span>
                      </div>
                    )}

                    {/* Date Info */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-[#6B6662]">
                      {quest.assignedAt && (
                        <span>할당: {formatDate(quest.assignedAt)}</span>
                      )}
                      {quest.status === 'completed' && quest.completedAt && (
                        <>
                          <span className="text-[#E6E0DA]">|</span>
                          <span>완료: {formatDate(quest.completedAt)}</span>
                        </>
                      )}
                    </div>

                    {/* Action Hint */}
                    <div className="mt-3 flex items-center gap-1 text-xs text-[#A9B4A0] font-medium">
                      {quest.status === 'completed' ? '자세히 보기' : '계속하기'} →
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </section>

        {/* Empty State Illustration */}
        {thisMonthQuests.length === 0 && (
          <section className="mt-8">
            <div className="bg-gradient-to-br from-[rgba(232,223,245,0.3)] to-[rgba(255,232,214,0.3)] bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6 text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-[#2A2725] mb-2">이번 달 Quest</h3>
              <p className="text-sm text-[#6B6662] leading-relaxed mb-4">
                아직 이번 달 할당된 Quest가 없습니다.
                <br />
                관리자가 곧 새로운 질문을 보내드릴게요.
              </p>
              <button
                onClick={() => router.push('/premium-home')}
                className="px-6 py-2.5 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold text-sm"
              >
                홈으로 이동
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-[rgba(245,241,237,0.78)] backdrop-blur-[14px] border-t border-[rgba(230,224,218,0.9)] px-2.5 py-2.5 pb-3 z-20">
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { icon: '2026', label: '연간', path: '/2026' },
            { icon: '🐇', label: '이번달', path: '/quest', active: true },
            { icon: '●', label: '홈', path: '/premium-home' },
            { icon: '✦', label: '우주', path: '/premium-fortune' },
            { icon: '☺', label: '나', path: '/me' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px] border ${
                item.active ? 'border-[rgba(191,167,255,0.35)] bg-white/45' : 'border-transparent'
              }`}
            >
              <div
                className={`w-[34px] h-7 rounded-xl grid place-items-center text-sm ${
                  item.active
                    ? 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.92)] border-transparent text-[rgba(31,31,31,0.92)]'
                    : 'bg-white/55 border border-[rgba(230,224,218,0.9)]'
                }`}
              >
                {item.icon}
              </div>
              <div
                className={`text-[11px] tracking-tight ${
                  item.active ? 'text-[rgba(42,39,37,0.92)] font-bold' : 'text-[rgba(42,39,37,0.70)]'
                }`}
              >
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}