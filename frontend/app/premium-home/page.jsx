'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { questUserApi } from '@/lib/api/quest';
import Header from '../components/Header';

// 나눔명조 폰트 로드 (Google Fonts)
const NANUM_MYEONGJO_URL = 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap';

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

// 월간 정렬 문장 3개 (랜덤 2개 선택용)
const MONTHLY_ALIGNMENTS = [
  {
    keyword: '명료함',
    sentence: '당신은 오늘 명료함을 향해 가고 있는 사람입니다.',
  },
  {
    keyword: '방향',
    sentence: '오늘, 당신의 방향은 흐트러진 생각을 정리하는 것입니다.',
  },
  {
    keyword: '균형',
    sentence: '당신은 오늘 내면의 균형을 찾아가는 여정 위에 있습니다.',
  },
];

// 배열에서 n개 랜덤 선택
const getRandomItems = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

export default function PremiumHomePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reportEnabled, setReportEnabled] = useState(false);
  const [alignmentSlide, setAlignmentSlide] = useState(0);
  const [selectedAlignments, setSelectedAlignments] = useState(() =>
    getRandomItems(MONTHLY_ALIGNMENTS, 2)
  );

  // 새로고침 시 랜덤 재선택
  const refreshAlignments = () => {
    setSelectedAlignments(getRandomItems(MONTHLY_ALIGNMENTS, 2));
    setAlignmentSlide(0);
  };

  // 터치 스와이프 지원
  const [touchStart, setTouchStart] = useState(null);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && alignmentSlide < selectedAlignments.length - 1) {
        setAlignmentSlide(alignmentSlide + 1);
      } else if (diff < 0 && alignmentSlide > 0) {
        setAlignmentSlide(alignmentSlide - 1);
      }
    }
    setTouchStart(null);
  };

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

  const backgroundStyle = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", Segoe UI, Roboto, Arial, sans-serif',
    background:
      'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
    color: '#2A2725',
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={backgroundStyle}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6662]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 나눔명조 폰트 로드 */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={NANUM_MYEONGJO_URL} rel="stylesheet" />

      <div
        className="min-h-screen"
        style={backgroundStyle}
      >
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
          <Header
          subtitle="Premium · 메인 홈"
          showMenuButton
          showMonthChip
          monthLabel={userData?.month}
          menuAriaLabel="상담/예약 메뉴"
        />

      {/* Main Content */}
      <main className="px-4 py-3.5 pb-[86px] flex flex-col gap-3.5">
        {/* HERO - Today Alignment (슬라이드형) */}
        <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          {/* 라벨 + 새로고침 버튼 */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="text-xs tracking-[0.12em] text-[#6B6662] uppercase">
              Today Alignment
            </div>
            <button
              onClick={refreshAlignments}
              className="w-6 h-6 flex items-center justify-center text-xs text-[#6B6662] hover:text-[#2A2725] bg-white/60 rounded-full border border-[#E6E0DA] transition-all hover:bg-white/80 active:scale-95"
              title="오늘의 문장 새로고침"
            >
              ⟲
            </button>
          </div>

          {/* 슬라이드 카드 영역 */}
          <div
            className="relative h-[120px] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-300 ease-out h-full"
              style={{ transform: `translateX(-${alignmentSlide * 100}%)` }}
            >
              {selectedAlignments.map((alignment, index) => (
                <div
                  key={index}
                  className="min-w-full h-full flex items-center justify-center px-6"
                >
                  <p
                    className="text-[21px] leading-[1.7] tracking-tight text-center text-[#2A2725]"
                    style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                  >
                    {alignment.sentence.split(alignment.keyword).map((part, i, arr) =>
                      i < arr.length - 1 ? (
                        <span key={i}>
                          {part}
                          <span className="font-bold text-[rgba(42,39,37,0.95)]">
                            {alignment.keyword}
                          </span>
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dot Indicator */}
          <div className="flex items-center justify-center gap-2 pb-4">
            {selectedAlignments.map((_, index) => (
              <button
                key={index}
                onClick={() => setAlignmentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  alignmentSlide === index
                    ? 'bg-[rgba(123,203,255,0.95)] w-4'
                    : 'bg-[#D1CCC6]'
                }`}
                aria-label={`슬라이드 ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* THIS MONTH QUESTIONS */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
          <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
            <div>
              <div className="text-sm font-[750] tracking-tight text-[#2A2725]">
                {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
              </div>
              <div className="text-xs text-[#6B6662]">나다움을 찾기 위한 질문들</div>
            </div>
          </div>

          <div className="flex flex-col p-2.5 pb-3 gap-2">
            {/* 답변해야 할 질문만 필터링 (completed 제외) */}
            {questions.filter(q => q.status !== 'completed').length === 0 ? (
              <div
                className="p-4 flex flex-col items-center gap-3 cursor-pointer"
                onClick={() => router.push('/premium_memo')}
              >
                <div className="w-12 h-12 rounded-2xl bg-[rgba(191,167,255,0.15)] border border-[rgba(191,167,255,0.25)] grid place-items-center text-2xl">
                  📝
                </div>
                <p className="text-sm text-[#6B6662] text-center m-0">
                  오늘의 나다움에 대한 생각을 남겨보세요
                </p>
              </div>
            ) : (
              questions.filter(q => q.status !== 'completed').map((q) => {
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
              <div className="text-xs text-[#6B6662]">오늘의 우주에너지</div>
            </div>
            <div className="text-xs text-[#6B6662]">D-0</div>
          </div>

          <div className="px-4 py-3.5 flex flex-col gap-2">
            <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0 whitespace-pre-line">
              {userData?.todayFlow.text}
            </p>
            <div className="h-px bg-[#E6E0DA] my-1.5" />
            <p className="text-xs text-[#6B6662] m-0">* 개인별 맞춤 정보로 업데이트 예정입니다.</p>
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
              <button
                onClick={() => router.push('/tickets')}
                className="w-full mt-3 rounded-[14px] px-3 py-3 border-0 font-[750] cursor-pointer bg-[rgba(42,39,37,0.92)] text-[rgba(245,241,237,0.98)] text-sm transition-transform active:scale-[0.98]"
              >
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
            { icon: '2026', label: '연간', path: '/2026' },
            { icon: '🐇', label: '이번달', path: '/quest' },
            { icon: '●', label: '홈', path: '/premium-home', active: true },
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
      </div>
    </>
  );
}