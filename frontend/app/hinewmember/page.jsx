'use client';
 
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, fetchWithAuth } from '../utils/auth';
import Header from '../components/Header';
import { premiumRegistrationApi } from '@/lib/api/premium-registration';
 
const API_BASE_URL = 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';
 
const KAKAO_CHAT_URL = 'https://pf.kakao.com/_xjwsxfb/chat';
 
export default function HiNewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
 
  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');
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
 
      // 이미 premium이면 premium-home으로
      const status = (u.paymentStatus || '').toLowerCase();
      if (status === 'completed' || status === 'premium' || u.preSurveyCompleted) {
        router.push('/premium-home');
        return;
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
  const isStep2Valid = birthYear && birthMonth && birthDay;
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
        birthHour: birthHour !== '' ? parseInt(birthHour) : null,
        birthMinute: birthMinute !== '' ? parseInt(birthMinute) : null,
        birthCity: birthCity || null,
        marketingConsent,
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
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
 
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
      <Header
        subtitle="Premium Registration"
        rightSlot={
          <button
            onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] border border-[#E6E0DA] bg-[rgba(255,255,255,0.65)] flex items-center justify-center text-sm"
          >
            ✕
          </button>
        }
      />
 
      <main className="px-4 py-6 pb-12 max-w-[430px] mx-auto space-y-6">
 
        {/* 신청 완료 화면 */}
        {submitted ? (
          <section
            className="bg-gradient-to-br from-[rgba(240,253,244,1)] to-[rgba(220,252,231,1)] border-2 border-[rgba(22,163,74,0.3)] rounded-[18px] p-8 text-center"
            style={{ animation: 'fadeInUp 0.5s ease-out' }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-[22px] font-bold text-[#2A2725] mb-3">신청이 완료되었습니다!</h2>
            <p className="text-sm text-[#6B6662] leading-relaxed mb-6">
              스피릿랩 프리미엄 서비스 신청을 환영합니다.<br />
              곧 새로운 리듬이 시작됩니다.
            </p>
 
            <div className="bg-white border border-[rgba(22,163,74,0.2)] rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-[#166534] leading-[1.7]">
                <strong>📱 다음 단계</strong><br /><br />
                관리자가 확인 후 입력하신 전화번호의<br />
                <strong>카카오톡으로 먼저 연락</strong>드린 후<br />
                결제 방식을 안내해 드립니다.<br /><br />
                <span className="text-[#999] text-[11px]">
                  보통 24시간 이내에 연락드리고 있습니다
                </span>
              </p>
            </div>
 
            <button
              onClick={() => window.open(KAKAO_CHAT_URL, '_blank')}
              className="w-full py-3 bg-[#FEE500] text-[#000000] rounded-xl text-sm font-semibold mb-3 transition-transform active:scale-[0.98]"
            >
              연락이 없는 경우 1:1 채팅으로 확인 요청하기 💬
            </button>
 
            <button
              onClick={() => router.push('/trial-home')}
              className="text-sm text-[#6B6662] hover:text-[#2A2725] transition-colors"
            >
              ← 홈으로 돌아가기
            </button>
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
                      onChange={(e) => setBirthHour(e.target.value)}
                      className="w-full px-3 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] appearance-none"
                    >
                      <option value="">시</option>
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}시</option>
                      ))}
                    </select>
                    <select
                      value={birthMinute}
                      onChange={(e) => setBirthMinute(e.target.value)}
                      className="w-full px-3 py-3 border-2 border-[#E6E0DA] rounded-xl text-sm bg-white focus:outline-none focus:border-[rgba(99,102,241,1)] appearance-none"
                    >
                      <option value="">분</option>
                      {minutes.map((m) => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-[#6B6662] mt-1.5 leading-relaxed">
                    정확한 시간을 모르시면 비워두셔도 됩니다.<br />
                    시간 정보가 있으면 더 정밀한 분석이 가능합니다.
                  </p>
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
 
                {/* 가격 안내 */}
                <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
                  <h2 className="text-lg font-bold text-[#2A2725] mb-5">서비스 가격</h2>
 
                  {/* 신규 회원 가격 */}
                  <div className="bg-gradient-to-br from-[rgba(245,243,255,1)] to-[rgba(252,231,243,1)] border-2 border-[rgba(99,102,241,1)] rounded-[14px] p-6 text-center relative overflow-hidden">
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      신규 회원
                    </div>
                    <div className="text-[13px] text-[#6B6662] mb-3">2026년 3월 프리미엄 서비스</div>
                    <div className="text-4xl font-bold text-[#2A2725] mb-2">₩200,000</div>
                    <div className="text-[13px] text-[rgba(99,102,241,1)] mb-4">
                      월 구독 150,000원 + 가입비 50,000원
                    </div>
 
                    <div className="bg-white rounded-[10px] p-3 text-left">
                      <div className="text-[11px] text-[#6B6662] leading-relaxed">
                        ✓ 개인 맞춤 질문 7~10개<br />
                        ✓ 1:1 온라인 상담 2회 (시작 30분 + 마무리 30분)<br />
                        ✓ 통합 분석 보고서 1회<br />
                        ✓ 주간 회고 &amp; 월간 목표 시스템<br />
                        ✓ 개인 아카이브 무제한 열람
                      </div>
                    </div>
                  </div>
 
                  {/* 참여 구조 */}
                  <div className="mt-5 bg-[rgba(249,249,255,1)] border border-[rgba(99,102,241,0.2)] rounded-[14px] p-5">
                    <div className="text-sm font-bold text-[#2A2725] mb-3">참여 구조</div>
                    <div className="space-y-2.5 mb-4">
                      {[
                        { label: '월 단위 참여', price: '100,000원/월', color: 'rgba(99,102,241,1)', border: false },
                        { label: '3개월 이상 참여', price: '77,000원/월', color: 'rgba(167,139,250,1)', border: false },
                        { label: '5개월 이상 참여', price: '50,000원/월', color: 'rgba(22,163,74,1)', border: true },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`flex justify-between items-center p-2.5 bg-white rounded-lg ${
                            item.border ? 'border-2 border-[rgba(22,163,74,0.3)]' : ''
                          }`}
                        >
                          <span className={`text-[13px] text-[#2A2725] ${item.border ? 'font-semibold' : ''}`}>{item.label}</span>
                          <span className="text-[15px] font-bold" style={{ color: item.color }}>{item.price}</span>
                        </div>
                      ))}
                    </div>
 
                    <div className="bg-[rgba(254,243,199,1)] rounded-lg p-3 mb-3">
                      <div className="text-xs text-[#78350F] leading-relaxed">
                        <strong>초기 구조 세팅 (가입비) 50,000원 (1회)</strong><br />
                        첫 달에만 부과되는 세팅 비용입니다
                      </div>
                    </div>
 
                    <div className="text-[11px] text-[#6B6662] leading-relaxed">
                      * 자동 갱신 없음<br />
                      * 매달 참여 의사 확인 후 결제<br />
                      * 언제든 중단 가능
                    </div>
                  </div>
 
                  {/* 왜 월 단위인가요? */}
                  <div className="mt-5 bg-[rgba(224,242,254,1)] border-l-4 border-[rgba(59,130,246,1)] rounded-xl p-5">
                    <div className="text-sm font-bold text-[#2A2725] mb-3">💡 왜 월 단위인가요?</div>
                    <div className="text-xs text-[#1e3a8a] leading-[1.7]">
                      매달 질문과 기준이 누적되며 당신만의 선택 기준이 만들어집니다.<br /><br />
                      사주와 점성술의 기본인 <strong>달님의 사이클에 맞춰</strong> 진행됩니다.<br /><br />
                      변화는 결심이 아니라 <strong>반복</strong>입니다.
                    </div>
                  </div>
 
                  {/* 왜 신규 회원 비용이 더 높나요? */}
                  <div className="mt-5 bg-gradient-to-br from-[rgba(254,243,199,1)] to-[rgba(253,230,138,1)] border-l-4 border-[rgba(245,158,11,1)] rounded-[14px] p-6">
                    <div className="text-[15px] font-bold text-[#78350F] mb-4 flex items-center gap-2">
                      💰 왜 신규 회원 비용이 더 높나요?
                    </div>
                    <div className="text-[13px] text-[#78350F] leading-[1.8] mb-4">
                      <strong>신규 회원은 더 많은 시간과 분석이 필요합니다</strong>
                    </div>
 
                    <div className="bg-white rounded-xl p-4 mb-4">
                      <div className="text-xs font-bold text-[#78350F] mb-3">🎯 첫 달, 당신만의 구조를 만드는 시간</div>
                      <div className="text-[11px] text-[#78350F] leading-[1.8]">
                        • <strong>1:1 상담 총 60분</strong> (시작 30분 + 마무리 30분)<br />
                        • 사주·점성술 기초 분석 &amp; 개인 구조 완전 파악<br />
                        • 당신의 리듬에 맞는 질문 설계를 위한 심층 대화<br />
                        • 첫 달 목표 설정 및 앞으로의 방향 수립<br />
                        • 이후 매달 활용할 수 있는 <strong>나만의 기준 설계</strong>
                      </div>
                    </div>
 
                    <div className="bg-[rgba(245,243,255,1)] border-2 border-[rgba(99,102,241,0.3)] rounded-xl p-4 mb-4 text-center">
                      <div className="text-xs text-[#2A2725] leading-[1.8]">
                        일반 1:1 상담 30분 = <strong className="text-[rgba(99,102,241,1)]">77,000원</strong><br />
                        <div className="text-[10px] text-[#6B6662] my-2">×</div>
                        신규 회원은 <strong>60분 상담 + 구조 세팅 + 맞춤 분석</strong><br />
                        <div className="mt-3 pt-3 border-t border-[rgba(99,102,241,0.2)]">
                          <span className="text-[11px] text-[#6B6662]">이 모든 것을</span><br />
                          <strong className="text-lg text-[rgba(99,102,241,1)]">200,000원</strong><br />
                          <span className="text-[11px] text-[rgba(99,102,241,1)] font-semibold">상담비만 계산해도 완전 개이득입니다</span>
                        </div>
                      </div>
                    </div>
 
                    <div className="bg-[rgba(240,253,244,1)] rounded-xl p-3.5">
                      <div className="text-[11px] text-[#166534] leading-[1.8]">
                        <strong>💡 2개월차부터는?</strong><br /><br />
                        이미 파악된 당신의 구조를 바탕으로 진행하므로<br />
                        상담 시간이 줄어들고, 질문은 더 정교해지며,<br />
                        비용도 자연스럽게 낮아집니다.<br /><br />
                        <span className="text-[rgba(22,163,74,1)] font-semibold">
                          쌓인 기록이 곧 당신만의 자산이 됩니다.
                        </span>
                      </div>
                    </div>
                  </div>
 
                  {/* 장기 참여 혜택 */}
                  <div className="mt-5 bg-[rgba(240,253,244,1)] border border-[rgba(22,163,74,0.3)] rounded-xl p-4">
                    <div className="text-[13px] font-bold text-[rgba(22,163,74,1)] mb-2.5">
                      🎁 장기 참여 시 이런 점이 좋습니다
                    </div>
                    <div className="text-[11px] text-[#166534] leading-[1.7]">
                      ✓ 3개월차부터 <strong>23% 할인</strong> (77,000원)<br />
                      ✓ 5개월차부터 <strong>50% 할인</strong> (50,000원)<br />
                      ✓ 누적된 기록으로 더 정교한 분석<br />
                      ✓ 질문과 기준이 쌓여 명확한 방향성 확보<br />
                      ✓ 변화의 패턴이 보이기 시작함
                    </div>
                  </div>
                </section>
 
                {/* Submit */}
                <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] rounded-[18px] p-6">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-3.5 rounded-[14px] text-sm font-semibold border-2 border-[#E6E0DA] text-[#6B6662]"
                    >
                      ← 이전
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit || submitting}
                      className={`flex-1 py-4 rounded-[14px] text-base font-bold transition-all ${
                        canSubmit && !submitting
                          ? 'bg-gradient-to-r from-[rgba(167,139,250,1)] to-[rgba(99,102,241,1)] text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)]'
                          : 'bg-[#E8E5F5] text-[#999] cursor-not-allowed'
                      }`}
                    >
                      {submitting ? '신청 중...' : '스피릿랩과 함께 시작하기 🚀'}
                    </button>
                  </div>
                  <div className="text-center text-xs text-[#6B6662]">
                    {canSubmit
                      ? '위 버튼을 누르면 프리미엄 서비스 신청이 완료됩니다'
                      : '모든 필수 정보를 입력하고 동의하시면 신청 버튼이 활성화됩니다'}
                  </div>
 
                  <button
                    onClick={() => window.open(KAKAO_CHAT_URL, '_blank')}
                    className="w-full mt-3 py-3 bg-[#FEE500] text-[#000000] rounded-xl text-sm font-semibold transition-transform active:scale-[0.98]"
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
