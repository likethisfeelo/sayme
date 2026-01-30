'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../utils/auth';

export default function TrialHomePage() {
  const router = useRouter();
  const [todayFortune, setTodayFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Intent Selection State
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showIntentResult, setShowIntentResult] = useState(false);

  const maxSelection = 3;

  const categories = [
    { id: 'love', icon: '💖', label: '사랑', message: '마음껏 사랑을 나누는', question: '지금 당신의 관계에서 가장 크게 달라진 점은 무엇인가요?' },
    { id: 'work', icon: '💼', label: '직업', message: '능력을 자신있게 펼치는', question: '당신이 일을 통해 진짜 얻고 싶은 것은 무엇인가요?' },
    { id: 'daily', icon: '🌱', label: '일상', message: '매일 나에게 만족하는', question: '오늘 하루에서 가장 감사했던 순간은 언제였나요?' },
    { id: 'self', icon: '✨', label: '나 자신', message: '내면의 목소리에 귀 기울이며 나를 이해하는', question: '지금의 나와 비교했을 때, 가장 크게 달라진 점은?' },
    { id: 'habit', icon: '🎯', label: '습관', message: '하루하루 의도를 가지고 살아가는', question: '매일 반복하고 싶은 것과 멈추고 싶은 것은 각각 무엇인가요?' },
    { id: 'relationship', icon: '🤝', label: '관계', message: '주변 사람들과 깊이 있는 관계를 만들어가는', question: '당신에게 가장 소중한 관계는 무엇이며, 그 이유는 무엇인가요?' },
  ];

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTodayFortune();
  }, [router]);

  const fetchTodayFortune = async () => {
    try {
      const response = await fetch(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/public/fortune'
      );
      const data = await response.json();
      if (data.success) {
        setTodayFortune(data.fortune);
      }
    } catch (error) {
      console.error('Fortune fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      if (selectedCategories.length < maxSelection) {
        setSelectedCategories([...selectedCategories, categoryId]);
      }
    }
  };

  const handleMakeChange = () => {
    if (selectedCategories.length > 0) {
      setShowIntentResult(true);
    }
  };

  const getSelectedCategoryData = () => {
    return selectedCategories.map(id => categories.find(cat => cat.id === id));
  };

  const getIntentMessage = (category, index) => {
    const endings = ['바랍니다', '꿈꿉니다', '싶습니다'];
    return `나는 ${category.message} 사람이 되기를 ${endings[index % 3]}.`;
  };

  return (
    <div className="min-h-screen" style={{
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
      background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
    }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
          <div className="flex flex-col gap-0.5 leading-none">
            <div className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
              Sayme · Spirit Lab
            </div>
            <div className="text-xs text-[#6B6662]">Trial · 체험 중</div>
          </div>
          
          <button 
            onClick={() => router.push('/me')}
            className="w-[34px] h-[34px] rounded-[10px] border border-[#E6E0DA] bg-white/65 grid place-items-center cursor-pointer"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-[86px] flex flex-col gap-4 max-w-[430px] mx-auto">
        
        {/* Welcome Message */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
          <h2 className="text-2xl font-bold text-[#2A2725] mb-3">
            환영합니다! 👋
          </h2>
          <p className="text-[#6B6662] leading-relaxed mb-4">
            Spirit Lab의 일부 콘텐츠를 체험해보세요.
            <br />
            프리미엄 회원이 되시면 모든 기능을 이용하실 수 있습니다.
          </p>
          <button
            onClick={() => router.push('/payment')}
            className="w-full px-4 py-3 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-[14px] font-bold"
          >
            프리미엄 시작하기 →
          </button>
        </section>

        {/* 2026년 2월의 나다움 섹션 */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#2A2725]">2026년 2월의 나다움</h3>
          </div>

          {!showIntentResult ? (
            <>
              <p className="text-center text-base text-[#2A2725] leading-relaxed mb-4">
                2026년 2월,<br />
                당신은 어떤 변화를 꿈꾸고 있나요?
              </p>

              <div className="text-center text-xs text-[rgba(191,167,255,0.95)] mb-4">
                최대 3개까지 선택할 수 있어요
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  const isDisabled = !isSelected && selectedCategories.length >= maxSelection;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      disabled={isDisabled}
                      className={`
                        border-2 rounded-xl p-3 text-center transition-all
                        ${isSelected 
                          ? 'bg-[rgba(245,243,255,1)] border-[rgba(99,102,241,1)]' 
                          : 'bg-[rgba(249,249,255,1)] border-transparent'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[rgba(167,139,250,1)]'}
                      `}
                    >
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="text-sm font-semibold text-[#2A2725]">{category.label}</div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleMakeChange}
                disabled={selectedCategories.length === 0}
                className={`
                  w-full px-4 py-4 rounded-xl font-semibold transition-all
                  ${selectedCategories.length > 0
                    ? 'bg-gradient-to-r from-[rgba(167,139,250,1)] to-[rgba(99,102,241,1)] text-white cursor-pointer hover:shadow-lg'
                    : 'bg-[#E8E5F5] text-[#999] cursor-not-allowed'
                  }
                `}
              >
                Make Change
              </button>
            </>
          ) : (
            <div className="animate-fadeIn">
              <div className="flex flex-col gap-4 mb-6">
                {getSelectedCategoryData().map((category, index) => {
                  const gradients = [
                    'linear-gradient(90deg, rgba(244,114,182,1) 0%, rgba(236,72,153,1) 100%)',
                    'linear-gradient(90deg, rgba(96,165,250,1) 0%, rgba(59,130,246,1) 100%)',
                    'linear-gradient(90deg, rgba(52,211,153,1) 0%, rgba(16,185,129,1) 100%)',
                  ];
                  
                  return (
                    <div
                      key={category.id}
                      className="bg-gradient-to-r from-white to-[rgba(249,249,255,1)] rounded-2xl p-6 shadow-md border-2 border-transparent relative overflow-hidden"
                      style={{
                        animation: `slideIn 0.5s ease-out ${0.1 * (index + 1)}s both`
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ background: gradients[index % 3] }}
                      />
                      <div className="text-center">
                        <div className="text-5xl mb-4 animate-float">{category.icon}</div>
                        <p className="text-lg leading-relaxed text-[#2A2725] font-medium">
                          {getIntentMessage(category, index)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-base font-semibold text-[#2A2725] leading-relaxed p-6 bg-gradient-to-r from-[rgba(245,243,255,1)] to-[rgba(252,231,243,1)] rounded-xl">
                2026년 2월, 당신은 이렇게 변화합니다.
              </div>

              {selectedCategories.length > 0 && (
                <div className="mt-4 p-4 bg-[rgba(255,249,230,1)] border-l-4 border-[#FBBF24] rounded-lg">
                  <h4 className="text-sm text-[#92400E] font-semibold mb-2 flex items-center gap-2">
                    💭 오늘의 질문
                  </h4>
                  <p className="text-sm text-[#78350F] leading-relaxed">
                    {categories.find(c => c.id === selectedCategories[0])?.question}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2025 돌아보기 + 전문 분석 서비스 */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
          <h3 className="text-lg font-bold text-[#2A2725] mb-3">
            2025 돌아보기
          </h3>
          <p className="text-sm text-[#6B6662] mb-4 leading-relaxed">
            일 년을 돌아보며 콘텐츠로 담은 회고 페이지를 보실 수 있습니다.
          </p>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => router.push('/me/retrospective')}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-[#E6E0DA] text-[#2A2725] rounded-xl text-sm font-semibold hover:border-[rgba(167,139,250,1)] transition-all"
            >
              회고하기
            </button>
            <button
              onClick={() => router.push('/me/review2025')}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-[#E6E0DA] text-[#2A2725] rounded-xl text-sm font-semibold hover:border-[rgba(167,139,250,1)] transition-all"
            >
              돌아보기
            </button>
          </div>

          <div className="pt-6 border-t border-[#E8E5F5]">
            <h4 className="text-base font-semibold text-[#2A2725] mb-2">
              전문 분석 서비스 받기
            </h4>
            <p className="text-sm text-[#6B6662] mb-4 leading-relaxed">
              프리미엄 회원이 되시면 1:1 맞춤 상담과<br />
              매주 개인화된 심층 리포트를 받으실 수 있습니다.
            </p>
            <button
              onClick={() => router.push('/payment')}
              className="w-full px-4 py-3 bg-white border-2 border-[rgba(99,102,241,1)] text-[rgba(99,102,241,1)] rounded-xl text-sm font-semibold mb-2 hover:bg-[rgba(99,102,241,0.05)] transition-all"
            >
              분석 신청하기
            </button>
            <button
              onClick={() => window.open('https://pf.kakao.com/_xoMxbdG', '_blank')}
              className="w-full px-4 py-3 bg-[#FEE500] text-[#000000] rounded-xl text-sm font-semibold hover:bg-[#FDD835] transition-all"
            >
              서비스 문의하기 💬
            </button>
          </div>
        </section>

        {/* 사전 질문 */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
            <div className="text-sm font-bold text-[#2A2725]">사전 질문</div>
            <div className="text-xs text-[rgba(139,125,216,0.95)]">누구나 체험할 수 있어요</div>
          </div>
          
          <div className="p-4 bg-[rgba(249,249,255,1)] rounded-xl m-3">
            <p className="text-xs text-[#6B6662] leading-relaxed mb-2">
              질문을 통해 자신을 돌아보는 시간을 가져보세요.
            </p>
            <p className="text-xs text-[#6B6662] leading-relaxed">
              모든 질문에 대한 답변은 저장되며,<br />
              프리미엄 회원은 전문가의 심층 분석을 받으실 수 있습니다.
            </p>
          </div>

          <div className="p-3 flex flex-col gap-2">
            <div className="bg-white border border-[rgba(230,224,218,0.9)] rounded-[14px] p-4">
              <div className="text-xs text-[rgba(139,125,216,0.95)] mb-2">체험 질문 1</div>
              <p className="text-sm font-semibold text-[#2A2725] mb-3">
                오늘 하루 중 가장 기억에 남는 순간?
              </p>
              <button className="w-full px-3 py-2 bg-[#2A2725] text-white rounded-xl text-sm font-semibold">
                답변 작성하기 →
              </button>
            </div>

            <div className="bg-white border border-[rgba(230,224,218,0.9)] rounded-[14px] p-4">
              <div className="text-xs text-[rgba(139,125,216,0.95)] mb-2">체험 질문 2</div>
              <p className="text-sm font-semibold text-[#2A2725] mb-3">
                올해 나에게 가장 큰 변화는 무엇인가요?
              </p>
              <button className="w-full px-3 py-2 bg-[#2A2725] text-white rounded-xl text-sm font-semibold">
                답변 작성하기 →
              </button>
            </div>
          </div>
          
          <div className="px-4 py-3 text-center bg-[rgba(249,249,255,1)]">
            <p className="text-xs text-[rgba(139,125,216,0.95)]">
              📌 체험 질문 답변은 작성할 수 있습니다
            </p>
          </div>
        </section>

        {/* 오늘의 우주 일기예보 */}
        <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
          <h3 className="text-lg font-bold text-[#2A2725] mb-5 flex items-center gap-2">
            오늘의 우주 일기예보 🔭
          </h3>

          <div className="text-center mb-4">
            <div className="inline-block bg-[rgba(245,243,255,1)] px-4 py-2 rounded-full text-sm text-[rgba(139,125,216,0.95)] mb-5">
              2026년 1월 31일
            </div>
            
            <div className="text-5xl mb-5">🌱</div>
            
            <div className="bg-[#E8E5F5] px-5 py-2 rounded-xl inline-block mb-5">
              <span className="text-base font-semibold text-[rgba(99,102,241,1)]">성장의 시간</span>
            </div>
          </div>

          <div className="text-center leading-relaxed mb-6">
            <p className="text-[#2A2725] mb-4">
              새로운 목표와 관점을 위한 나를 세우고, 주변을 돌아보아야 하는 날입니다.
            </p>
            <p className="text-[#2A2725]">
              내가 얼마나 성장했는지 돌아보세요. 당신의 모든 생각과 행동이 바로 이 세계의 씨앗입니다. 아름드리 나무의 위용을 펼처주세요.
            </p>
          </div>

          <div className="bg-[rgba(249,249,255,1)] p-5 rounded-xl">
            <h4 className="text-sm text-[rgba(139,125,216,0.95)] font-semibold mb-2">🔮 오늘의 질문</h4>
            <p className="text-sm text-[#2A2725] leading-relaxed">
              작년의 나와 비교했을 때, 가장 크게 달라진 점은?<br />
              목표하고 계신가요?
            </p>
          </div>
        </section>

      </main>

      {/* Bottom Nav */}
      <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-[rgba(245,241,237,0.78)] backdrop-blur-[14px] border-t border-[rgba(230,224,218,0.9)] px-2.5 py-2.5 pb-3 z-20">
        <div className="grid grid-cols-4 gap-1.5">
          <button className="flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px]">
            <div className="w-[34px] h-7 rounded-xl grid place-items-center text-sm bg-white/55 border border-[rgba(230,224,218,0.9)]">
              📅
            </div>
            <div className="text-[11px] text-[rgba(42,39,37,0.70)]">연간</div>
          </button>

          <button className="flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px] border border-[rgba(191,167,255,0.35)] bg-white/45">
            <div className="w-[34px] h-7 rounded-xl grid place-items-center text-sm bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.92)] text-[rgba(31,31,31,0.92)]">
              🏠
            </div>
            <div className="text-[11px] text-[rgba(42,39,37,0.92)] font-bold">이달 중</div>
          </button>

          <button className="flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px]">
            <div className="w-[34px] h-7 rounded-xl grid place-items-center text-sm bg-white/55 border border-[rgba(230,224,218,0.9)]">
              ➕
            </div>
            <div className="text-[11px] text-[rgba(42,39,37,0.70)]">추가</div>
          </button>

          <button 
            onClick={() => router.push('/me')}
            className="flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-[14px]"
          >
            <div className="w-[34px] h-7 rounded-xl grid place-items-center text-sm bg-white/55 border border-[rgba(230,224,218,0.9)]">
              👤
            </div>
            <div className="text-[11px] text-[rgba(42,39,37,0.70)]">나</div>
          </button>
        </div>
      </nav>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}