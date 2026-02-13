'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../utils/auth';
import { premiumRegistrationApi } from '@/lib/api/premium-registration';

const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const KAKAO_CHAT_URL = 'https://pf.kakao.com/_xjwsxfb/chat';
const SHOW_PREMIUM_NOTICE = true;
const REQUEST_SOURCE = 'hinewmember';

export default function HiNewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');
  const [birthTimeCertainty, setBirthTimeCertainty] = useState('');
  const [birthCity, setBirthCity] = useState('');
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [serviceRequired, setServiceRequired] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [allChecked, setAllChecked] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/signup');
      return;
    }
    fetchUser(token);
  }, [router]);

  const fetchUser = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        router.push('/signup');
        return;
      }
      const data = await res.json();
      const u = data.user;

      // premium 유저 처리
      const status = (u.paymentStatus || '').toLowerCase();
      const premiumUser = status === 'completed' || status === 'premium' || u.preSurveyCompleted;
      if (premiumUser) {
        if (!SHOW_PREMIUM_NOTICE) {
          router.push('/premium-home');
          return;
        }
        setIsPremiumUser(true);
      }

      // 이미 신청 완료 상태
      if (u.consultationStatus === 'requested') {
        setSubmitted(true);
      }

      // 기존 정보 prefill
      if (u.phoneNumber) setPhoneNumber(u.phoneNumber);
      if (u.gender) setGender(u.gender);
      if (u.birthDate) {
        const parts = u.birthDate.split('-');
        if (parts.length === 3) {
          setBirthYear(parts[0]);
          setBirthMonth(String(parseInt(parts[1])));
          setBirthDay(String(parseInt(parts[2])));
        }
      }
      if (u.birthTime) {
        const timeParts = u.birthTime.split(':');
        if (timeParts.length === 2) {
          setBirthHour(timeParts[0]);
          setBirthMinute(timeParts[1]);
        }
      }
      if (u.birthTimeCertainty) {
        setBirthTimeCertainty(u.birthTimeCertainty);
      }
      if (u.birthCity) setBirthCity(u.birthCity);

      setUser(u);
    } catch {
      router.push('/signup');
    } finally {
      setLoading(false);
    }
  };

  const handleAllCheck = (checked) => {
    setAllChecked(checked);
    setPrivacyRequired(checked);
    setServiceRequired(checked);
    setMarketingConsent(checked);
  };

  const handleIndividualCheck = (setter, value) => {
    setter(value);
    // Sync allChecked after state update
    setTimeout(() => {
      const all = document.querySelectorAll('input[data-consent]:not([data-all])');
      const allCheckedNow = Array.from(all).every(cb => cb.checked);
      setAllChecked(allCheckedNow);
    }, 0);
  };

  const isStep1Valid = phoneNumber.trim() && gender;
  const hasPreciseTime = birthHour !== '' && birthMinute !== '';
  const isStep2Valid = birthYear && birthMonth && birthDay && birthTimeCertainty && (
    birthTimeCertainty === 'unknown' || hasPreciseTime
  );
  const isStep3Valid = privacyRequired && serviceRequired;
  const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid;

  const formatPhone = (value) => {
    const nums = value.replace(/[^0-9]/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const token = getAccessToken();
      await premiumRegistrationApi.submit(token, {
        phoneNumber: phoneNumber.replace(/[^0-9]/g, ''),
        gender,
        birthYear: parseInt(birthYear),
        birthMonth: parseInt(birthMonth),
        birthDay: parseInt(birthDay),
        birthHour: birthTimeCertainty === 'unknown' ? null : (birthHour !== '' ? parseInt(birthHour) : null),
        birthMinute: birthTimeCertainty === 'unknown' ? null : (birthMinute !== '' ? parseInt(birthMinute) : null),
        birthTimeCertainty,
        birthCity: birthCity || null,
        marketingConsent,
        requestSource: REQUEST_SOURCE,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert(error.message || '신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate year options (1950-2010)
  const years = Array.from({ length: 61 }, (_, i) => 1950 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const progressPercent = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
      }}>
        <div className="text-[#6B6662] text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", sans-serif',
      background: 'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED',
    }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-10 backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-[430px] mx-auto">
          <div className="flex flex-col gap-0.5">
            <div className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
              Sayme · Spirit Lab
            </div>
            <div className="text-xs text-[#6B6662]">Premium Registration</div>
          </div>
          <button
            onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] border border-[#E6E0DA] bg-[rgba(255,255,255,0.65)] flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>
      </header>

      <main className="px-4 py-6 pb-12 max-w-[430px] mx-auto space-y-6">

        {/* 신청 완료 화면 */}
        {submitted ? (
          <section
            className="relative overflow-hidden bg-white/75 backdrop-blur-sm border border-[#E6E0DA] rounded-[22px] p-7 shadow-[0_20px_45px_rgba(99,102,241,0.12)]"
            style={{ animation: 'fadeInUp 0.5s ease-out' }}
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(500px_250px_at_10%_-20%,rgba(191,167,255,0.28),transparent_70%),radial-gradient(500px_250px_at_90%_-10%,rgba(123,203,255,0.22),transparent_70%)]" />

            <div className="relative"> 
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(99,102,241,0.12)] text-[rgba(99,102,241,1)] text-xs font-semibold mb-4">
                <span>✨</span>
                <span>등록 완료</span>
              </div>

              <h2 className="text-[24px] leading-tight font-bold text-[#2A2725] mb-3">신청이 접수되었어요</h2>
              <p className="text-sm text-[#6B6662] leading-relaxed mb-6">
                이제 당신만의 분석 리듬을 준비하고 있습니다.
                <br />
                입력해주신 연락처로 빠르게 안내드릴게요.
              </p>

              <div className="bg-white/85 border border-[rgba(99,102,241,0.2)] rounded-2xl p-4 mb-4">
                <div className="text-xs font-semibold text-[rgba(99,102,241,1)] mb-2">다음 진행</div>
                <ul className="text-xs text-[#2A2725] leading-6 list-disc pl-4">
                  <li>관리자가 신청 정보를 확인합니다.</li>
                  <li>카카오톡 또는 전화로 결제/이용 안내를 드립니다.</li>
                  <li>보통 24시간 내 첫 안내가 진행됩니다.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.open(KAKAO_CHAT_URL, '_blank')}
                  className="py-3 bg-[#FEE500] text-[#000000] rounded-xl text-sm font-semibold transition-transform active:scale-[0.98]"
                >
                  카카오 문의 💬
                </button>
                <button
                  onClick={() => router.push('/trial-home')}
                  className="py-3 bg-white border border-[#D9D4FF] text-[rgba(99,102,241,1)] rounded-xl text-sm font-semibold hover:bg-[rgba(245,243,255,0.65)] transition-colors"
                >
                  홈으로 이동
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Welcome Section */}
            <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
              <h1 className="text-lg font-bold text-[#2A2725] mb-2">프리미엄 회원 가입 🎯</h1>
              <p className="text-sm text-[#6B6662] leading-relaxed mb-5">
                스피릿랩 프리미엄 서비스를 시작하기 위해<br />
                몇 가지 정보가 필요합니다.<br /><br />
                사주와 점성술 기반의 개인 맞춤 질문을 설계하기 위한<br />
                정보이며, 안전하게 보관됩니다.
              </p>

              {isPremiumUser && SHOW_PREMIUM_NOTICE && (
                <div className="mb-5 bg-[rgba(255,243,205,0.85)] border border-[rgba(245,158,11,0.35)] rounded-xl p-3.5">
                  <p className="text-xs text-[#7C4A03] leading-relaxed">
                    ✅ 이미 프리미엄 회원입니다. 별도의 가입 절차는 필수가 아닙니다.
                    <br />
                    다만 원하시면 아래 정보를 다시 입력해 신청 흐름을 확인하실 수 있습니다.
                  </p>
                </div>
              )}

              {/* Step Indicator */}
              <div className="flex justify-between mb-4">
                {[
                  { num: 1, label: '기본정보' },
                  { num: 2, label: '생년월일' },
                  { num: 3, label: '동의·신청' },
                ].map((s) => (
                  <div key={s.num} className="flex flex-col items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep > s.num
                        ? 'bg-[rgba(22,163,74,1)] text-white'
                        : currentStep === s.num
                        ? 'bg-[rgba(99,102,241,1)] text-white'
                        : 'bg-[#E6E0DA] text-[#6B6662]'
                    }`}>
                      {currentStep > s.num ? '✓' : s.num}
                    </div>
                    <div className="text-xs text-[#6B6662]">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-[#E6E0DA] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[rgba(167,139,250,1)] to-[rgba(99,102,241,1)] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </section>

            {/* Step 1: 기본 정보 */}
            {currentStep >= 1 && (
              <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
                <h2 className="text-lg font-bold text-[#2A2725] mb-5">기본 정보</h2>

                {/* 이메일 (읽기 전용) */}
                {user?.email && (
                  <div className="mb-5">
                    <label className="flex items-center gap-1 text-sm font-semibold text-[#2A2725] mb-2">
                      이메일
                    </label>
                    <div className="w-full px-4 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-[rgba(245,241,237,0.5)] text-[#6B6662]">
                      {user.email}
                    </div>
                  </div>
                )}

                {/* 전화번호 */}
                <div className="mb-5">
                  <label className="flex items-center gap-1 text-sm font-semibold text-[#2A2725] mb-2">
                    전화번호
                    <span className="text-xs text-red-600">*필수</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] transition-all"
                  />
                  <p className="text-xs text-[#6B6662] mt-1.5 leading-relaxed">
                    상담 일정 조율 및 서비스 안내를 위해 필요합니다
                  </p>
                </div>

                {/* 성별 */}
                <div className="mb-2">
                  <label className="flex items-center gap-1 text-sm font-semibold text-[#2A2725] mb-2">
                    성별
                    <span className="text-xs text-red-600">*필수</span>
                  </label>
                  <div className="flex gap-3">
                    {['남성', '여성'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g === '남성' ? 'male' : 'female')}
                        className={`flex-1 py-3 border-2 rounded-xl text-sm font-semibold text-center transition-all ${
                          gender === (g === '남성' ? 'male' : 'female')
                            ? 'border-[rgba(99,102,241,1)] bg-[rgba(245,243,255,1)] text-[rgba(99,102,241,1)]'
                            : 'border-[#E6E0DA] bg-white text-[#2A2725]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {currentStep === 1 && (
                  <button
                    onClick={() => isStep1Valid && setCurrentStep(2)}
                    disabled={!isStep1Valid}
                    className={`w-full mt-5 py-3.5 rounded-[14px] text-sm font-bold transition-all ${
                      isStep1Valid
                        ? 'bg-gradient-to-r from-[rgba(167,139,250,1)] to-[rgba(99,102,241,1)] text-white'
                        : 'bg-[#E8E5F5] text-[#999] cursor-not-allowed'
                    }`}
                  >
                    다음 단계 →
                  </button>
                )}
              </section>
            )}

            {/* Step 2: 생년월일 */}
            {currentStep >= 2 && (
              <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
                <h2 className="text-lg font-bold text-[#2A2725] mb-5">생년월일 정보</h2>

                {/* 태어난 날짜 */}
                <div className="mb-5">
                  <label className="flex items-center gap-1 text-sm font-semibold text-[#2A2725] mb-2">
                    태어난 날짜
                    <span className="text-xs text-red-600">*필수</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full px-3 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] appearance-none"
                    >
                      <option value="">년</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}년</option>
                      ))}
                    </select>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="w-full px-3 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] appearance-none"
                    >
                      <option value="">월</option>
                      {months.map((m) => (
                        <option key={m} value={m}>{m}월</option>
                      ))}
                    </select>
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="w-full px-3 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] appearance-none"
                    >
                      <option value="">일</option>
                      {days.map((d) => (
                        <option key={d} value={d}>{d}일</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 태어난 시간 */}
                <div className="mb-5">
                  <label className="flex items-center gap-1 text-sm font-semibold text-[#2A2725] mb-2">
                    태어난 시간
                    <span className="text-xs text-[rgba(99,102,241,1)]">선택</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={birthHour}
                      onChange={(e) => { setBirthHour(e.target.value); if (birthTimeCertainty !== 'approximate') setBirthTimeCertainty('approximate'); }}
                      className="w-full px-3 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] appearance-none disabled:bg-[rgba(245,241,237,0.7)] disabled:text-[#A8A39F]"
                      disabled={birthTimeCertainty === 'unknown'}
                    >
                      <option value="">시</option>
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}시</option>
                      ))}
                    </select>
                    <select
                      value={birthMinute}
                      onChange={(e) => { setBirthMinute(e.target.value); if (birthTimeCertainty !== 'approximate') setBirthTimeCertainty('approximate'); }}
                      className="w-full px-3 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] appearance-none disabled:bg-[rgba(245,241,237,0.7)] disabled:text-[#A8A39F]"
                      disabled={birthTimeCertainty === 'unknown'}
                    >
                      <option value="">분</option>
                      {minutes.map((m) => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-[#6B6662] mt-1.5 leading-relaxed">
                    시간 정보가 있으면 더 정밀한 분석이 가능합니다.
                  </p>

                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => setBirthTimeCertainty('approximate')}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                        birthTimeCertainty === 'approximate'
                          ? 'border-[rgba(99,102,241,1)] bg-[rgba(245,243,255,1)] text-[rgba(99,102,241,1)]'
                          : 'border-[#E6E0DA] bg-white text-[#2A2725]'
                      }`}
                    >
                      대략적인 이 시간대 근처로 알고있음
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBirthTimeCertainty('unknown');
                        setBirthHour('');
                        setBirthMinute('');
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                        birthTimeCertainty === 'unknown'
                          ? 'border-[rgba(99,102,241,1)] bg-[rgba(245,243,255,1)] text-[rgba(99,102,241,1)]'
                          : 'border-[#E6E0DA] bg-white text-[#2A2725]'
                      }`}
                    >
                      시간대 정보 전혀 모름
                    </button>
                  </div>
                </div>

                {/* 태어난 도시 */}
                <div className="mb-5">
                  <label className="flex items-center gap-1 text-sm font-semibold text-[#2A2725] mb-2">
                    태어난 도시
                    <span className="text-xs text-[rgba(99,102,241,1)]">선택</span>
                  </label>
                  <input
                    type="text"
                    value={birthCity}
                    onChange={(e) => setBirthCity(e.target.value)}
                    placeholder="예: 서울, 부산, 대전..."
                    className="w-full px-4 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] transition-all"
                  />
                  <p className="text-xs text-[#6B6662] mt-1.5 leading-relaxed">
                    점성술 계산을 위해 사용됩니다. 도시명만 입력해 주세요.
                  </p>
                </div>

                {/* Info box */}
                <div className="bg-[rgba(254,243,199,1)] border-l-4 border-[rgba(245,158,11,1)] rounded-xl p-4">
                  <div className="text-xs font-bold text-[#78350F] mb-2 flex items-center gap-1.5">
                    💡 왜 이 정보가 필요한가요?
                  </div>
                  <div className="text-xs text-[#78350F] leading-relaxed">
                    사주와 점성술을 기반으로 개인 맞춤 질문을 설계하기 위해 필요합니다.
                    생년월일시와 출생지 정보를 통해 현재 시점의 흐름을 파악하고, 개인화된 질문을 제공합니다.
                  </div>
                </div>

                {currentStep === 2 && (
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-3.5 rounded-[14px] text-sm font-semibold border-2 border-[#E6E0DA] text-[#6B6662]"
                    >
                      ← 이전
                    </button>
                    <button
                      onClick={() => isStep2Valid && setCurrentStep(3)}
                      disabled={!isStep2Valid}
                      className={`flex-1 py-3.5 rounded-[14px] text-sm font-bold transition-all ${
                        isStep2Valid
                          ? 'bg-gradient-to-r from-[rgba(167,139,250,1)] to-[rgba(99,102,241,1)] text-white'
                          : 'bg-[#E8E5F5] text-[#999] cursor-not-allowed'
                      }`}
                    >
                      다음 단계 →
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Step 3: 동의·신청 */}
            {currentStep >= 3 && (
              <>
                {/* 개인정보 동의 */}
                <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
                  <h2 className="text-lg font-bold text-[#2A2725] mb-5">개인정보 수집·이용 동의</h2>

                  <div className="bg-[rgba(249,249,255,1)] border border-[rgba(99,102,241,0.2)] rounded-xl p-4">
                    {/* 전체 동의 */}
                    <label className="flex items-start gap-2.5 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        data-consent="true"
                        data-all="true"
                        checked={allChecked}
                        onChange={(e) => handleAllCheck(e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-[rgba(99,102,241,1)] flex-shrink-0"
                      />
                      <span className="text-[13px] text-[#2A2725] font-bold">전체 동의</span>
                    </label>

                    <hr className="border-[rgba(99,102,241,0.1)] my-3" />

                    {/* 필수: 개인정보 수집 */}
                    <label className="flex items-start gap-2.5 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        data-consent="true"
                        checked={privacyRequired}
                        onChange={(e) => handleIndividualCheck(setPrivacyRequired, e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-[rgba(99,102,241,1)] flex-shrink-0"
                      />
                      <span className="text-[13px] text-[#2A2725]">[필수] 개인정보 수집 및 이용 동의</span>
                    </label>
                    <p className="text-[11px] text-[#6B6662] leading-relaxed pl-[30px] mb-3">
                      수집 항목: 전화번호, 성별, 생년월일시, 출생지<br />
                      이용 목적: 사주·점성술 기반 개인 맞춤 서비스 제공<br />
                      보유 기간: 회원 탈퇴 시까지
                    </p>

                    {/* 필수: 서비스 이용약관 */}
                    <label className="flex items-start gap-2.5 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        data-consent="true"
                        checked={serviceRequired}
                        onChange={(e) => handleIndividualCheck(setServiceRequired, e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-[rgba(99,102,241,1)] flex-shrink-0"
                      />
                      <span className="text-[13px] text-[#2A2725]">[필수] 서비스 이용약관 동의</span>
                    </label>

                    {/* 선택: 마케팅 */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        data-consent="true"
                        checked={marketingConsent}
                        onChange={(e) => handleIndividualCheck(setMarketingConsent, e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-[rgba(99,102,241,1)] flex-shrink-0"
                      />
                      <span className="text-[13px] text-[#2A2725]">[선택] 마케팅 정보 수신 동의</span>
                    </label>
                    <p className="text-[11px] text-[#6B6662] leading-relaxed pl-[30px] mt-1">
                      서비스 안내, 이벤트 정보를 받으실 수 있습니다
                    </p>
                  </div>
                </section>

                {/* 스피릿랩 신청하기 CTA */}
                <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border-2 border-[rgba(99,102,241,0.3)] rounded-[18px] p-8 text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className={`w-full py-5 rounded-[16px] text-xl font-bold transition-all ${
                      canSubmit && !submitting
                        ? 'bg-gradient-to-r from-[rgba(167,139,250,1)] to-[rgba(99,102,241,1)] text-white shadow-[0_12px_28px_rgba(99,102,241,0.35)]'
                        : 'bg-[#E8E5F5] text-[#999] cursor-not-allowed'
                    }`}
                  >
                    {submitting ? '신청 중...' : '스피릿랩 신청하기'}
                  </button>
                  <p className="text-xs text-[#6B6662] mt-3">
                    {canSubmit
                      ? '버튼을 누르면 프리미엄 서비스 신청이 완료됩니다'
                      : '모든 필수 정보를 입력하고 동의해주세요'}
                  </p>
                </section>

                {/* 이전 버튼 & 문의 */}
                <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-3.5 rounded-[14px] text-sm font-semibold border-2 border-[#E6E0DA] text-[#6B6662]"
                    >
                      ← 이전
                    </button>
                  </div>

                  <button
                    onClick={() => window.open(KAKAO_CHAT_URL, '_blank')}
                    className="w-full mt-3 py-3 bg-[#FFF9DB] text-[#78350F] rounded-xl text-sm font-semibold transition-transform active:scale-[0.98] border border-[#FDE68A]"
                  >
                    카카오톡으로 문의하기 💬
                  </button>
                </section>
              </>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
