'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

const API_BASE = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

export default function PremiumFortunePage() {
  const router = useRouter();
  const [fortune, setFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1:1 상담 요청 상태
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [consultDate1, setConsultDate1] = useState('');
  const [consultTime1, setConsultTime1] = useState('');
  const [consultDate2, setConsultDate2] = useState('');
  const [consultTime2, setConsultTime2] = useState('');
  const [consultSending, setConsultSending] = useState(false);
  const [consultMessage, setConsultMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchFortune();
  }, []);

  const fetchFortune = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/public/fortune`);

      if (!response.ok) {
        throw new Error('운세를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setFortune(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConsultSubmit = async () => {
    if (!consultDate1 || !consultTime1 || !consultDate2 || !consultTime2) {
      setConsultMessage({ type: 'error', text: '희망 일시 2개를 모두 입력해주세요.' });
      return;
    }

    setConsultSending(true);
    setConsultMessage({ type: '', text: '' });

    try {
      const idToken = localStorage.getItem('idToken');
      const response = await fetch(`${API_BASE}/consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          preferredDate1: consultDate1,
          preferredTime1: consultTime1,
          preferredDate2: consultDate2,
          preferredTime2: consultTime2,
          isPaidOk: true,
          memo: '프리미엄 우주의 흐름 페이지에서 유료 상담 요청',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConsultMessage({ type: 'success', text: '상담 요청이 접수되었습니다. 확인 후 연락드리겠습니다.' });
        setShowConsultForm(false);
        setConsultDate1('');
        setConsultTime1('');
        setConsultDate2('');
        setConsultTime2('');
      } else {
        setConsultMessage({ type: 'error', text: data.message || '요청에 실패했습니다.' });
      }
    } catch (err) {
      console.error('Consultation request error:', err);
      setConsultMessage({ type: 'error', text: '요청에 실패했습니다.' });
    } finally {
      setConsultSending(false);
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
          <p className="text-[#6B6662]">오늘의 운세를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-semibold text-[#2A2725] mb-2">오류가 발생했습니다</h2>
          <p className="text-[#6B6662] mb-6">{error}</p>
          <button
            onClick={fetchFortune}
            className="px-6 py-3 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] font-[650] rounded-[14px] transition-transform active:scale-[0.98]"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
        <Header
          subtitle="우주의 흐름"
          showMenuButton
          zIndexClass="z-50"
          maxWidthClass="max-w-[430px]"
        />

        <main className="px-4 py-3.5 pb-[86px] flex flex-col gap-3.5">
          {/* Date Display */}
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-[#E6E0DA]">
              <p className="text-xs text-[#6B6662] m-0">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Fortune Card */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="p-4">
              {/* Icon */}
              <div className="text-center mb-4">
                <div className="inline-block text-5xl">
                  {fortune?.category === 'reflection' && '🌙'}
                  {fortune?.category === 'gratitude' && '🙏'}
                  {fortune?.category === 'growth' && '🌱'}
                </div>
              </div>

              {/* Category Badge */}
              <div className="flex justify-center mb-4">
                <span className="inline-block px-3.5 py-1.5 text-xs font-[650] rounded-full border border-[rgba(191,167,255,0.35)] text-[#6B6662] bg-[rgba(191,167,255,0.12)]">
                  {fortune?.category === 'reflection' && '성찰의 시간'}
                  {fortune?.category === 'gratitude' && '감사의 시간'}
                  {fortune?.category === 'growth' && '성장의 시간'}
                </span>
              </div>

              {/* Fortune Text */}
              <p className="text-base leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight text-center m-0 mb-4">
                {fortune?.fortuneText}
              </p>

              {/* Question */}
              <div className="bg-gradient-to-br from-[rgba(191,167,255,0.15)] via-[rgba(123,203,255,0.12)] to-[rgba(255,193,217,0.10)] rounded-[14px] p-4 border border-[rgba(230,224,218,0.85)]">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💭</div>
                  <div>
                    <h3 className="text-xs font-[750] tracking-tight text-[#2A2725] mb-1.5 m-0">
                      오늘의 질문
                    </h3>
                    <p className="text-sm text-[rgba(42,39,37,0.92)] leading-[1.55] tracking-tight m-0">
                      {fortune?.questionPrompt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 1:1 Consultation Request */}
          <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
            <div className="p-4">
              <h3 className="text-sm font-[750] tracking-tight text-[#2A2725] mb-2">1:1 상담 요청</h3>
              <p className="text-xs text-[#6B6662] leading-relaxed mb-3 m-0">
                더 깊은 상담이 필요하시면 요청해주세요. (유료)
              </p>

              {consultMessage.text && (
                <div
                  className={`p-3 rounded-xl mb-3 text-xs ${
                    consultMessage.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {consultMessage.text}
                </div>
              )}

              {!showConsultForm ? (
                <button
                  onClick={() => setShowConsultForm(true)}
                  className="w-full py-3 rounded-xl text-sm font-bold border-0 cursor-pointer bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] transition-transform active:scale-[0.98]"
                >
                  💬 1:1 상담 요청하기
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="bg-[rgba(191,167,255,0.08)] rounded-xl p-3 border border-[rgba(191,167,255,0.2)]">
                    <div className="text-xs font-medium text-[#2A2725] mb-2">희망 일시 1</div>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={consultDate1}
                        onChange={(e) => setConsultDate1(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-[#E6E0DA] bg-white/80 text-sm"
                      />
                      <input
                        type="time"
                        value={consultTime1}
                        onChange={(e) => setConsultTime1(e.target.value)}
                        className="w-[120px] p-2 rounded-lg border border-[#E6E0DA] bg-white/80 text-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-[rgba(123,203,255,0.08)] rounded-xl p-3 border border-[rgba(123,203,255,0.2)]">
                    <div className="text-xs font-medium text-[#2A2725] mb-2">희망 일시 2</div>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={consultDate2}
                        onChange={(e) => setConsultDate2(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-[#E6E0DA] bg-white/80 text-sm"
                      />
                      <input
                        type="time"
                        value={consultTime2}
                        onChange={(e) => setConsultTime2(e.target.value)}
                        className="w-[120px] p-2 rounded-lg border border-[#E6E0DA] bg-white/80 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConsultForm(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#E6E0DA] bg-white/80 text-[#6B6662] cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleConsultSubmit}
                      disabled={consultSending}
                      className={`flex-[2] py-2.5 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all ${
                        consultSending
                          ? 'bg-[#E6E0DA] text-[#6B6662]'
                          : 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f]'
                      }`}
                    >
                      {consultSending ? '전송 중...' : '상담 요청 보내기'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Update Notice */}
          <div className="text-center py-4">
            <p className="text-xs text-[#9B9590] m-0">업데이트 예정입니다.</p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-[rgba(245,241,237,0.78)] backdrop-blur-[14px] border-t border-[rgba(230,224,218,0.9)] px-2.5 py-2.5 pb-3 z-20">
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { icon: '2026', label: '연간', path: '/2026' },
              { icon: '🐇', label: '이번달', path: '/quest' },
              { icon: '●', label: '홈', path: '/premium-home' },
              { icon: '✦', label: '우주', path: '/premium-fortune', active: true },
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
  );
}
