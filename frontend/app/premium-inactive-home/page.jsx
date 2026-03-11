'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { getAccessToken } from '../utils/auth';
import { questUserApi } from '@/lib/api/quest';
import { resolveAssignmentProgressStatus } from '@/lib/questStatus';
import { premiumRegistrationApi } from '@/lib/api/premium-registration';

const NANUM_MYEONGJO_URL = 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap';

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

const mapQuestStatus = (assignment) => {
  const status = resolveAssignmentProgressStatus(assignment);
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'progress';
  return 'waiting';
};

const formatPhone = (value) => {
  const nums = value.replace(/[^0-9]/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
};

export default function PremiumInactiveHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questionRefreshing, setQuestionRefreshing] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const waitForIdToken = async () => {
      for (let i = 0; i < 12; i += 1) {
        const token = localStorage.getItem('idToken');
        if (token) return token;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      return null;
    };

    const fetchData = async () => {
      try {
        const idToken = await waitForIdToken();
        if (!idToken) {
          router.push('/login');
          return;
        }

        const questData = await questUserApi.getMyContents(idToken, { noStore: true });
        if (cancelled) return;

        const assignments = questData?.contents || [];
        const mappedQuestions = assignments.map((quest, index) => {
          const content = quest?.content || {};
          return {
            id: quest.assignmentId || `${index}`,
            assignmentId: quest.assignmentId,
            number: `Q${index + 1}`,
            title: content.title || content.question || content.description || '제목 없음',
            status: mapQuestStatus(quest),
          };
        });

        setQuestions(mappedQuestions);
      } catch (error) {
        console.error('Failed to fetch inactive home data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const refreshQuestions = async () => {
    try {
      setQuestionRefreshing(true);
      const idToken = localStorage.getItem('idToken');
      if (!idToken) {
        router.push('/login');
        return;
      }

      const questData = await questUserApi.getMyContents(idToken, { noStore: true });
      const assignments = questData?.contents || [];
      const mappedQuestions = assignments.map((quest, index) => {
        const content = quest?.content || {};
        return {
          id: quest.assignmentId || `${index}`,
          assignmentId: quest.assignmentId,
          number: `Q${index + 1}`,
          title: content.title || content.question || content.description || '제목 없음',
          status: mapQuestStatus(quest),
        };
      });

      setQuestions(mappedQuestions);
    } catch (error) {
      console.error('Failed to refresh questions:', error);
    } finally {
      setQuestionRefreshing(false);
    }
  };

  const goToQuestDetail = (assignmentId) => {
    if (!assignmentId) return;
    sessionStorage.setItem('activeQuestAssignmentId', assignmentId);
    router.push(`/quest/detail?id=${assignmentId}`);
  };

  const handleSubmit = async () => {
    if (!privacyConsent || submitting || phoneNumber.replace(/[^0-9]/g, '').length < 10) return;

    setSubmitting(true);
    setSubmitMessage('');

    try {
      const token = getAccessToken();
      await premiumRegistrationApi.submit(token, {
        phoneNumber: phoneNumber.replace(/[^0-9]/g, ''),
        gender: 'unknown',
        birthYear: null,
        birthMonth: null,
        birthDay: null,
        birthHour: null,
        birthMinute: null,
        birthTimeCertainty: 'unknown',
        birthCity: null,
        marketingConsent: false,
        requestSource: 'premium_inactive_home',
      });
      setSubmitMessage('전환 신청이 접수되었습니다. 관리자가 순차적으로 연락드립니다.');
      setPhoneNumber('');
      setPrivacyConsent(false);
    } catch (error) {
      setSubmitMessage(error.message || '신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
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
      <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6662]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={NANUM_MYEONGJO_URL} rel="stylesheet" />

      <div className="min-h-screen" style={backgroundStyle}>
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
          <Header subtitle="스피릿랩 · 재참여 홈" showMenuButton showMonthChip menuAriaLabel="상담/신청 메뉴" />

          <main className="px-4 py-3.5 pb-[96px] flex flex-col gap-3.5">
            <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] px-5 py-7 min-h-[180px] flex flex-col justify-center">
              <div className="text-xs tracking-[0.12em] text-[#6B6662] uppercase mb-2">Spirit Lab</div>
              <h2
                className="text-[30px] leading-[1.25] font-bold tracking-tight"
                style={{ fontFamily: '"Nanum Myeongjo", "AppleMyungjo", serif' }}
              >
                지금 어디로 향하고 있나요?
              </h2>
            </section>

            <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
              <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
                <div>
                  <div className="text-sm font-[750] tracking-tight text-[#2A2725]">
                    2026년 스피릿랩 질문들
                  </div>
                  <div className="text-xs text-[#6B6662]">그동안 할당된 전체 질문 조회</div>
                </div>
                <button
                  type="button"
                  onClick={refreshQuestions}
                  disabled={questionRefreshing}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[#D8D1CB] bg-white/80 text-[#6B6662] disabled:opacity-50"
                >
                  {questionRefreshing ? '조회 중...' : '질문 새로고침'}
                </button>
              </div>

            <div className="flex flex-col p-2.5 pb-3 gap-2">
              {questions.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#6B6662]">아직 할당된 질문이 없습니다.</div>
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
                          <span className={`text-[11px] px-2 py-1 rounded-full border ${config.badge}`}>{config.label}</span>
                          <span>{q.number}</span>
                        </div>

                        <div className="text-sm font-[680] leading-[1.35] tracking-tight whitespace-normal break-keep">{q.title}</div>

                        <button
                          className="w-fit text-xs bg-[rgba(42,39,37,0.92)] border-[rgba(42,39,37,0.10)] text-[rgba(245,241,237,0.98)] px-2.5 py-1.5 rounded-xl cursor-pointer mt-0.5"
                          onClick={(event) => {
                            event.stopPropagation();
                            goToQuestDetail(q.assignmentId);
                          }}
                        >
                          {q.status === 'completed' ? '답변 보기' : q.status === 'progress' ? '이어서 답변하기 →' : '질문 보기'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <h3 className="text-sm font-bold text-[#2A2725] mb-1">정회원 전환 신청</h3>
            <p className="text-xs text-[#6B6662] mb-3">연락처만 남겨주시면 관리자 확인 후 안내드립니다.</p>

            <div className="flex flex-col gap-2.5">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                placeholder="연락처 (예: 010-1234-5678)"
                className="w-full p-3 rounded-xl border border-[#E6E0DA] bg-white/85 text-sm"
              />

              <label className="flex items-start gap-2 text-xs text-[#6B6662] leading-relaxed">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-[2px]"
                />
                <span>개인정보 수집/이용에 동의합니다. (신청 안내 연락 목적)</span>
              </label>

              <button
                onClick={handleSubmit}
                disabled={submitting || !privacyConsent || phoneNumber.replace(/[^0-9]/g, '').length < 10}
                className="w-full px-4 py-3 bg-white border-2 border-[rgba(99,102,241,1)] text-[rgba(99,102,241,1)] rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? '신청 중...' : '전환 신청하기'}
              </button>

              {!!submitMessage && (
                <p className="text-xs text-[#6B6662] leading-relaxed">{submitMessage}</p>
              )}
            </div>
          </section>

          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] p-4">
            <h3 className="text-sm font-bold text-[#2A2725] mb-2">1:1 상담 문의</h3>
            <button
              onClick={() => window.open('https://pf.kakao.com/_xjwsxfb/chat', '_blank')}
              className="w-full px-4 py-3 bg-[#FEE500] text-[#000000] rounded-xl text-sm font-semibold hover:bg-[#FDD835] transition-all"
            >
              카카오 채널로 문의하기 💬
            </button>
          </section>
          </main>
        </div>
      </div>
    </>
  );
}
