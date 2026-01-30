'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { questUserApi } from '@/lib/api/quest';

const buildMonthLabel = () => `${new Date().getMonth() + 1}월`;

const getStatusConfig = (status) => {
  const configs = {
    completed: {
      dot: 'bg-[rgba(46,139,87,0.85)] border-[rgba(46,139,87,0.35)]',
      badge: 'text-[rgba(46,139,87,0.95)] border-[rgba(46,139,87,0.25)]',
      label: '답변 완료',
    },
    progress: {
      dot: 'bg-[rgba(191,167,255,0.95)] border-[rgba(191,167,255,0.35)]',
      badge: 'text-[rgba(123,203,255,0.95)] border-[rgba(123,203,255,0.25)]',
      label: '진행 중',
    },
    waiting: {
      dot: 'bg-white/90 border-[rgba(42,39,37,0.18)]',
      badge: 'text-[#6B6662] border-[#E6E0DA]',
      label: '대기',
    },
  };
  return configs[status] || configs.waiting;
};

const mapQuestStatus = (status) => {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'progress';
  return 'waiting';
};

export default function PremiumHomePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportEnabled, setReportEnabled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const idToken = localStorage.getItem('idToken');
        if (!idToken) {
          router.push('/login');
          return;
        }

        const questData = await questUserApi.getMyContents(idToken);
        const assignments = questData?.contents || [];

        const mappedQuestions = assignments.map((quest, index) => {
          const content = quest?.content || {};
          return {
            id: quest.assignmentId || `${index}`,
            assignmentId: quest.assignmentId,
            number: `Q${index + 1}`,
            title: content.title || content.question || content.description || '제목 없음',
            status: mapQuestStatus(quest?.progress?.status),
            hasFeedback: Boolean(quest?.feedbackCount),
          };
        });

        setQuestions(mappedQuestions);

        setUserData({
          month: buildMonthLabel(),
          goals: {
            keyword: '명료함',
            direction: '흐트러진 생각을 정리하는',
          },
          todayFlow: {
            text: `오늘은 속도를 내기보다 리듬을 회복하는 날입니다.
작은 선택 하나에 에너지를 과하게 쓰지 않아도 됩니다.`,
          },
          todayLuck: {
            keyword: '정리, 미세한 선택, 한 번의 거절',
            place: '조용한 책상, 창가, 물 근처',
            avoid: '즉답을 요구하는 대화',
          },
          event: {
            title: '오늘의 깜짝 이벤트 🎁',
            description: '무료 타로 질문 1회가 도착했습니다.',
            isNew: true,
          },
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const goToQuestDetail = (assignmentId) => {
    if (!assignmentId) return;
    router.push(`/quest/detail?id=${assignmentId}`);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
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
      className="max-w-[430px] mx-auto min-h-screen flex flex-col"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", Segoe UI, Roboto, Arial, sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        color: '#2A2725',
      }}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex flex-col gap-0.5 leading-none">
            <div className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
              Sayme · Spirit Lab
            </div>
            <div className="text-xs text-[#6B6662]">Premium · 메인 홈</div>
          </div>

          <div className="flex gap-2.5 items-center">
            <div className="text-xs px-2.5 py-2 rounded-full border border-[#E6E0DA] bg-white/65 text-[#2A2725]">
              이번달 · {userData?.month}
            </div>
            <button
              onClick={() => router.push('/me')}
              className="w-[34px] h-[34px] rounded-[10px] border border-[#E6E0DA] bg-white/65 grid place-items-center cursor-pointer"
              aria-label="상담/예약 메뉴"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-3.5 pb-[86px] flex flex-col gap-3.5">
        {/* HERO - Today Alignment */}
        <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          <div className="p-4">
            <div className="text-xs tracking-[0.12em] text-[#6B6662] uppercase mb-2.5">
              Today Alignment
            </div>

            <div className="flex flex-col gap-2.5 mb-3.5">
              <div className="text-base leading-[1.45] tracking-tight">
                당신은 오늘{' '}
                <span className="inline-block px-0.5 border-b border-dashed border-[rgba(42,39,37,0.35)] min-w-[120px] text-[rgba(42,39,37,0.9)] font-[650]">
                  {userData?.goals.keyword}
                </span>
                을 향해 가고 있는 사람입니다.
              </div>
              <div className="text-base leading-[1.45] tracking-tight">
                오늘, 당신의 방향은{' '}
                <span className="inline-block px-0.5 border-b border-dashed border-[rgba(42,39,37,0.35)] min-w-[120px] text-[rgba(42,39,37,0.9)] font-[650]">
                  {userData?.goals.direction}
                </span>{' '}
                입니다.
              </div>
            </div>

            <div className="text-xs text-[#6B6662] leading-relaxed mb-3">
              * 이 문장은 1:1 상담에서 설정한 목표(키워드)와 연결됩니다. 예언이 아니라, 오늘의 태도를 정렬합니다.
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => router.push('/monthly-questions')}
                className="flex-1 appearance-none border-0 cursor-pointer rounded-[14px] px-3.5 py-3 font-[650] text-sm tracking-tight inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] text-[#1f1f1f] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] shadow-[0_10px_22px_rgba(123,203,255,0.18)]"
              >
                질문과 함께 생각하기 →
              </button>
              <button
                className="w-11 appearance-none border-0 cursor-pointer rounded-[14px] px-3.5 py-3 bg-white/75 border border-[#E6E0DA] text-[#2A2725] transition-transform active:scale-[0.98]"
                title="오늘의 문장 새로고침"
              >
                ⟲
              </button>
            </div>
          </div>
        </section>

        {/* THIS MONTH QUESTIONS */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
            <div>
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">이번 달의 생각할 거리</div>
              <div className="text-xs text-[#6B6662]">최대 10개 · 일반적으로 7개</div>
            </div>
            <div className="text-xs text-[#6B6662]">{userData?.month}</div>
          </div>

          <div className="flex flex-col p-2.5 pb-3 gap-2">
            {questions.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#6B6662]">
                아직 할당된 Quest가 없습니다.
              </div>
            ) : (
              questions.map((q) => {
                const config = getStatusConfig(q.status);
                return (
                  <div
                    key={q.id}
                    className="bg-white/75 border border-[rgba(230,224,218,0.9)] rounded-[14px] p-3 flex gap-2.5 items-start cursor-pointer"
                    onClick={() => goToQuestDetail(q.assignmentId)}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border ${config.dot}`} />

                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#6B6662]">
                        <span className={`text-[11px] px-2 py-1 rounded-full border ${config.badge}`}>
                          {config.label}
                        </span>
                        <span>{q.number}</span>
                      </div>

                      <div className="text-sm font-[680] leading-[1.35] tracking-tight whitespace-normal break-keep">
                        {q.title}
                      </div>

                      <div className="flex gap-2 mt-0.5">
                        {q.status === 'completed' && (
                          <>
                            <button
                              className="text-xs border border-[#E6E0DA] bg-white/80 text-[#2A2725] px-2.5 py-1.5 rounded-xl cursor-pointer"
                              onClick={(event) => {
                                event.stopPropagation();
                                goToQuestDetail(q.assignmentId);
                              }}
                            >
                              답변 보기
                            </button>
                            {q.hasFeedback && (
                              <button
                                className="text-xs border border-[#E6E0DA] bg-white/80 text-[#2A2725] px-2.5 py-1.5 rounded-xl cursor-pointer"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  goToQuestDetail(q.assignmentId);
                                }}
                              >
                                피드백
                              </button>
                            )}
                          </>
                        )}
                        {q.status === 'progress' && (
                          <>
                            <button
                              className="text-xs bg-[rgba(42,39,37,0.92)] border-[rgba(42,39,37,0.10)] text-[rgba(245,241,237,0.98)] px-2.5 py-1.5 rounded-xl cursor-pointer"
                              onClick={(event) => {
                                event.stopPropagation();
                                goToQuestDetail(q.assignmentId);
                              }}
                            >
                              계속 생각하기 →
                            </button>
                            <button
                              className="text-xs border border-[#E6E0DA] bg-white/80 text-[#2A2725] px-2.5 py-1.5 rounded-xl cursor-pointer"
                              onClick={(event) => {
                                event.stopPropagation();
                                goToQuestDetail(q.assignmentId);
                              }}
                            >
                              메모
                            </button>
                          </>
                        )}
                        {q.status === 'waiting' && (
                          <button
                            className="text-xs bg-[rgba(42,39,37,0.92)] border-[rgba(42,39,37,0.10)] text-[rgba(245,241,237,0.98)] px-2.5 py-1.5 rounded-xl cursor-pointer"
                            onClick={(event) => {
                              event.stopPropagation();
                              goToQuestDetail(q.assignmentId);
                            }}
                          >
                            열기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* MONTHLY REPORT */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
            <div>
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">이번 달 분석 리포트</div>
              <div className="text-xs text-[#6B6662]">관리자 업로드 후 활성화</div>
            </div>
            <div className="text-xs text-[#6B6662]">PDF</div>
          </div>

          <div className="p-4 flex flex-col gap-2.5">
            <div
              className={`p-3.5 rounded-[14px] border border-[rgba(230,224,218,0.9)] bg-white/70 flex gap-3 items-start ${
                !reportEnabled ? 'opacity-60' : ''
              }`}
            >
              <div className="w-[34px] h-[34px] rounded-xl bg-[rgba(191,167,255,0.22)] border border-[rgba(191,167,255,0.20)] grid place-items-center flex-shrink-0">
                🗂️
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-[750] text-sm m-0 mb-1">
                  {reportEnabled ? '이번 달 리포트가 준비되었습니다' : '아직 준비 중입니다'}
                </p>
                <p className="text-xs text-[#6B6662] m-0 leading-relaxed">
                  질문과 기록이 충분히 쌓이면 리포트가 열립니다.
                  <br />
                  결과는 '정답'이 아니라, 당신의 선택 기준을 남기는 문서입니다.
                </p>
              </div>
            </div>

            <button
              disabled={!reportEnabled}
              className={`w-full px-3 py-3 rounded-[14px] border font-bold text-sm ${
                reportEnabled
                  ? 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] border-transparent text-[rgba(31,31,31,0.95)] cursor-pointer'
                  : 'border-[rgba(230,224,218,0.9)] bg-white/65 text-[rgba(42,39,37,0.65)]'
              }`}
            >
              {reportEnabled ? '리포트 열기 →' : '리포트가 업로드되면 여기가 활성화됩니다'}
            </button>
          </div>
        </section>

        {/* TODAY FLOW */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
            <div>
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">오늘의 흐름</div>
              <div className="text-xs text-[#6B6662]">짧게 소개 · 여백을 남깁니다</div>
            </div>
            <div className="text-xs text-[#6B6662]">D-0</div>
          </div>

          <div className="px-4 py-3.5 flex flex-col gap-2">
            <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0 whitespace-pre-line">
              {userData?.todayFlow.text}
            </p>
            <div className="h-px bg-[#E6E0DA] my-1.5" />
            <p className="text-xs text-[#6B6662] m-0">* "자세히 보기" 없이, 오늘의 방향만 제시합니다.</p>
          </div>
        </section>

        {/* TODAY LUCK */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
            <div>
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">오늘의 행운</div>
              <div className="text-xs text-[#6B6662]">가벼운 힌트</div>
            </div>
            <div className="text-xs">🍀</div>
          </div>

          <div className="px-4 py-3.5 flex flex-col gap-2">
            <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0">
              <b>행운 키워드:</b> {userData?.todayLuck.keyword}
            </p>
            <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0">
              <b>좋은 장소:</b> {userData?.todayLuck.place}
            </p>
            <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0">
              <b>피하면 좋은 것:</b> {userData?.todayLuck.avoid}
            </p>
          </div>
        </section>

        {/* EVENT */}
        {userData?.event && (
          <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(255,193,217,0.18)] to-[rgba(123,203,255,0.15)] bg-white/70 border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <strong className="text-sm tracking-tight block mb-1.5">{userData.event.title}</strong>
                  <p className="text-xs text-[#6B6662] leading-relaxed m-0">{userData.event.description}</p>
                </div>
                {userData.event.isNew && (
                  <div className="flex-shrink-0 text-xs px-2.5 py-2 rounded-full border border-[#E6E0DA] bg-white/65">
                    NEW
                  </div>
                )}
              </div>
              <button className="w-full mt-3 rounded-[14px] px-3 py-3 border-0 font-[750] cursor-pointer bg-[rgba(42,39,37,0.92)] text-[rgba(245,241,237,0.98)] text-sm">
                이벤트 열기 →
              </button>
              <p className="text-xs text-[#6B6662] mt-2.5 m-0 leading-relaxed">
                * 이벤트는 관리자가 개인별로 배포합니다. 쿠폰/선물처럼 "도착"합니다.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-[rgba(245,241,237,0.78)] backdrop-blur-[14px] border-t border-[rgba(230,224,218,0.9)] px-2.5 py-2.5 pb-3 z-20">
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { icon: '2026', label: '연간', path: '/spirit-lab' },
            { icon: '🐇', label: '이번달', path: '/quest' },
            { icon: '●', label: '홈', path: '/premium-home', active: true },
            { icon: '✦', label: '우주', path: '/cosmos' },
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
