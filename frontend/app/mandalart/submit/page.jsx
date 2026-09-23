'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePremium } from '@/app/utils/useAuthed';
import PageShell, { Card, Spinner } from '@/app/components/mandalart/PageShell';
import useDraft from '@/app/components/mandalart/useDraft';
import { getAccessToken, getIdTokenPayload } from '@/app/utils/auth';
import { analysisUserApi } from '@/lib/api/analysis';
import {
  SERVICE_NAME, WORKSHEETS, CELL_COUNT, SUB_COUNT, GENDER_OPTIONS, allChaptersComplete, isChapterComplete, subFilledCount, buildSubmitPayload, validateContact, worksheetByKey,
} from '@/lib/mandalart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

/**
 * /mandalart/submit          : 두 챕터 확인 + 연락처 + 동의 → 최종 보고서 신청 (관리자는 두 장을 함께 분석)
 * /mandalart/submit?key=...  : (프리미엄 전용) 해당 챕터만 분석 요청
 */
function SubmitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const premium = usePremium();
  const chapterWs = premium ? worksheetByKey(searchParams.get('key')) : null; // 일반 회원은 key 무시
  const chapterMode = !!chapterWs;
  const [authed] = useState(() => typeof window !== 'undefined' && !!getAccessToken());
  const { draft, setDraft, loading, syncError } = useDraft({ enabled: authed });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (!authed) router.push('/signup');
  }, [authed, router]);

  useEffect(() => {
    if (syncError === '401') router.push('/login');
  }, [syncError, router]);

  // 연락처 프리필 (가입 정보)
  useEffect(() => {
    if (loading || !draft || prefilledRef.current) return;
    prefilledRef.current = true;
    if (draft.contact.email && draft.contact.name && draft.contact.birthDate) return;
    const token = getAccessToken();
    const payload = getIdTokenPayload();
    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user || {};
        const genderMap = { female: 'female', male: 'male', 여성: 'female', 남성: 'male', 여: 'female', 남: 'male', other: 'other', 기타: 'other' };
        setDraft((d) => ({
          ...d,
          contact: {
            ...d.contact,
            name: d.contact.name || u.name || u.nickname || '',
            phone: d.contact.phone || u.phoneNumber || '',
            email: d.contact.email || u.email || payload?.email || '',
            birthDate: d.contact.birthDate || (typeof u.birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(u.birthDate) ? u.birthDate : ''),
            birthTime: d.contact.birthTime || (u.birthTimeCertainty === 'unknown' ? 'unknown' : (typeof u.birthTime === 'string' && /^\d{2}:\d{2}$/.test(u.birthTime) ? u.birthTime : '')),
            birthCity: d.contact.birthCity || u.birthCity || '',
            gender: d.contact.gender || genderMap[u.gender] || '',
          },
        }));
      })
      .catch(() => {});
  }, [loading, draft, setDraft]);

  const handleSubmit = async () => {
    const errs = validateContact(draft.contact, draft.consent);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setMessage('입력 내용을 확인해 주세요.');
      return;
    }
    if (chapterMode ? !isChapterComplete(draft.sheets[chapterWs.key]) : !allChaptersComplete(draft)) {
      setMessage(chapterMode ? '이 챕터의 단계를 모두 완료한 뒤 신청할 수 있어요.' : '두 챕터를 모두 완료한 뒤 최종 보고서를 신청할 수 있어요.');
      return;
    }
    try {
      setSubmitting(true);
      setMessage('');
      const data = await analysisUserApi.submit(buildSubmitPayload(draft, chapterMode ? { chapter: chapterWs.key } : {}));
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 140, spread: 75, origin: { y: 0.7 }, colors: ['#1D9E75', '#D85A30', '#BFA7FF', '#7BCBFF'] });
      } catch {
        /* ignore */
      }
      setTimeout(() => router.push(`/mandalart/detail/?id=${encodeURIComponent(data.request.requestId)}&submitted=1`), 900);
    } catch (err) {
      if (err.status === 401) {
        router.push('/login');
        return;
      }
      setMessage(err.message || '제출 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
      setSubmitting(false);
    }
  };

  if (loading || !draft) {
    return <PageShell subtitle={SERVICE_NAME} backTo="/mandalart" maxWidthClass="max-w-[640px]"><Spinner /></PageShell>;
  }

  const ready = chapterMode ? isChapterComplete(draft.sheets[chapterWs.key]) : allChaptersComplete(draft);
  const missing = (chapterMode ? [chapterWs] : WORKSHEETS).filter((w) => !isChapterComplete(draft.sheets[w.key]));
  const shownSheets = chapterMode ? [chapterWs] : WORKSHEETS;

  return (
    <PageShell subtitle={`${SERVICE_NAME} · 제출`} backTo="/mandalart" maxWidthClass="max-w-[640px]" bottomPadding="pb-[110px]" showMenuButton={false}>
      <Card>
        {chapterMode && <div className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(232,223,245,0.8)] text-[#3B2E7A] mb-1">프리미엄 · 챕터별 분석</div>}
        <h1 className="text-[20px] font-bold leading-tight mb-1">{chapterMode ? `${chapterWs.title} 분석 요청` : '최종 보고서 신청'}</h1>
        <p className="text-[12px] text-[#94928b] mb-3">
          {chapterMode ? '이 챕터의 내용만 먼저 분석해 드려요. 연락처와 출생 정보를 확인해 주세요.' : '두 챕터의 내용을 확인하고 연락처를 남겨주세요. 관리자가 두 장을 함께 분석해 이메일로 보고서를 보내드려요.'}
        </p>
        {!ready && (
          <p className="text-[12px] text-[#7A4B00] bg-[#FFF7E6] border border-[#F0C36D] rounded-[10px] px-3 py-2 mb-3">
            아직 완료되지 않은 {chapterMode ? '단계' : '챕터'}가 있어요: <b>{missing.map((w) => w.title).join(', ')}</b><br />홈에서 남은 {chapterMode ? '단계' : '챕터'}를 완료한 뒤 신청해 주세요.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {shownSheets.map((w) => {
            const i = WORKSHEETS.indexOf(w);
            const s = draft.sheets[w.key];
            return (
              <button
                key={w.key}
                type="button"
                onClick={() => router.push(`/mandalart/chapter/?key=${w.key}&pass=view`)}
                className="text-left rounded-[14px] border p-3 transition-transform active:scale-[0.98]"
                style={{ borderColor: w.theme.accln, background: w.theme.accbg }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[10px] font-semibold tracking-[0.08em]" style={{ color: w.theme.acc }}>Chp #.{i + 1}</div>
                    <div className="text-[13px] font-bold" style={{ color: w.theme.accd }}>{w.title}</div>
                  </div>
                  <span className="text-[10px]" style={{ color: w.theme.acc }}>보기 ›</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 1, 2, 3, null, 4, 5, 6, 7].map((idx, p) => (
                    <div
                      key={p}
                      className="rounded-[6px] bg-white/80 border text-[10px] leading-tight px-1.5 py-1.5 min-h-[36px] overflow-hidden"
                      style={{ borderColor: idx === null ? w.theme.accln : '#e4e2da', color: idx === null ? w.theme.accd : '#26251f', fontWeight: idx === null ? 700 : 400, textAlign: idx === null ? 'center' : 'left' }}
                    >
                      {idx === null ? w.center : (s.items[idx]?.text || '').slice(0, 24)}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-[#5f5e5a]">파고들기 {subFilledCount(s)} / {CELL_COUNT * SUB_COUNT} 항목</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-[14px] font-bold mb-3">연락처</h2>
        <div className="space-y-3">
          {[
            { key: 'name', label: '이름', type: 'text', placeholder: '홍길동', autoComplete: 'name', required: true },
            { key: 'phone', label: '연락처', type: 'tel', placeholder: '010-0000-0000', autoComplete: 'tel', inputMode: 'tel', required: true },
            { key: 'email', label: '보고서 받을 이메일', type: 'email', placeholder: 'you@example.com', autoComplete: 'email', inputMode: 'email' },
          ].map((f) => (
            <label key={f.key} className="block">
              <span className="text-[12px] text-[#5f5e5a]">{f.label}{f.required && <span className="text-[#D85A30]"> *</span>}</span>
              <input
                type={f.type}
                inputMode={f.inputMode}
                autoComplete={f.autoComplete}
                value={draft.contact[f.key] || ''}
                placeholder={f.placeholder}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d) => ({ ...d, contact: { ...d.contact, [f.key]: v } }));
                  setErrors((er) => ({ ...er, [f.key]: undefined }));
                }}
                className={`mt-1 w-full rounded-[12px] border bg-white px-3.5 py-3 text-[16px] outline-none transition-colors focus:border-[#BFA7FF] ${errors[f.key] ? 'border-[#A32D2D]' : 'border-[#E6E0DA]'}`}
              />
              {errors[f.key] && <span className="text-[11px] text-[#A32D2D]">{errors[f.key]}</span>}
            </label>
          ))}

          <div className="pt-1">
            <h2 className="text-[14px] font-bold mb-1">출생 정보 <span className="text-[#D85A30]">*</span></h2>
            <p className="text-[11px] text-[#94928b] mb-3">사주·점성술 분석에 필요해요. 생년월일은 양력, 시간은 24시간 기준으로 적어주세요.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] text-[#5f5e5a]">생년월일 (양력)</span>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={draft.contact.birthDate || ''}
                  onChange={(e) => { const v = e.target.value; setDraft((d) => ({ ...d, contact: { ...d.contact, birthDate: v } })); setErrors((er) => ({ ...er, birthDate: undefined })); }}
                  className={`mt-1 w-full rounded-[12px] border bg-white px-3.5 py-3 text-[16px] outline-none focus:border-[#BFA7FF] ${errors.birthDate ? 'border-[#A32D2D]' : 'border-[#E6E0DA]'}`}
                />
                {errors.birthDate && <span className="text-[11px] text-[#A32D2D]">{errors.birthDate}</span>}
              </label>
              <label className="block">
                <span className="text-[12px] text-[#5f5e5a]">태어난 시간 (24시간 기준)</span>
                <div className="mt-1 flex gap-2">
                  <input
                    type="time"
                    step="60"
                    disabled={draft.contact.birthTime === 'unknown'}
                    value={draft.contact.birthTime === 'unknown' ? '' : (draft.contact.birthTime || '')}
                    onChange={(e) => { const v = e.target.value; setDraft((d) => ({ ...d, contact: { ...d.contact, birthTime: v } })); setErrors((er) => ({ ...er, birthTime: undefined })); }}
                    className={`flex-1 min-w-0 rounded-[12px] border bg-white px-3.5 py-3 text-[16px] outline-none focus:border-[#BFA7FF] disabled:bg-[#F5F1ED] disabled:text-[#b3b0a6] ${errors.birthTime ? 'border-[#A32D2D]' : 'border-[#E6E0DA]'}`}
                  />
                  <label className={`shrink-0 inline-flex items-center gap-1.5 px-3 rounded-[12px] border text-[12px] cursor-pointer ${draft.contact.birthTime === 'unknown' ? 'border-[#BFA7FF] bg-[rgba(232,223,245,0.6)] text-[#3B2E7A]' : 'border-[#E6E0DA] bg-white text-[#5f5e5a]'}`}>
                    <input
                      type="checkbox"
                      checked={draft.contact.birthTime === 'unknown'}
                      onChange={(e) => { const v = e.target.checked ? 'unknown' : ''; setDraft((d) => ({ ...d, contact: { ...d.contact, birthTime: v } })); setErrors((er) => ({ ...er, birthTime: undefined })); }}
                      className="accent-[#BFA7FF]"
                    />
                    모름
                  </label>
                </div>
                {errors.birthTime && <span className="text-[11px] text-[#A32D2D]">{errors.birthTime}</span>}
              </label>
              <label className="block">
                <span className="text-[12px] text-[#5f5e5a]">태어난 도시</span>
                <input
                  type="text"
                  placeholder="예: 서울, 부산, 도쿄"
                  value={draft.contact.birthCity || ''}
                  onChange={(e) => { const v = e.target.value; setDraft((d) => ({ ...d, contact: { ...d.contact, birthCity: v } })); setErrors((er) => ({ ...er, birthCity: undefined })); }}
                  className={`mt-1 w-full rounded-[12px] border bg-white px-3.5 py-3 text-[16px] outline-none focus:border-[#BFA7FF] ${errors.birthCity ? 'border-[#A32D2D]' : 'border-[#E6E0DA]'}`}
                />
                {errors.birthCity && <span className="text-[11px] text-[#A32D2D]">{errors.birthCity}</span>}
              </label>
              <div className="block">
                <span className="text-[12px] text-[#5f5e5a]">성별</span>
                <div className={`mt-1 grid grid-cols-3 gap-2 ${errors.gender ? 'rounded-[12px] ring-1 ring-[#A32D2D]' : ''}`} role="radiogroup" aria-label="성별">
                  {GENDER_OPTIONS.map((g) => {
                    const on = draft.contact.gender === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => { setDraft((d) => ({ ...d, contact: { ...d.contact, gender: g.value } })); setErrors((er) => ({ ...er, gender: undefined })); }}
                        className={`py-3 rounded-[12px] border text-[14px] font-semibold ${on ? 'border-[#BFA7FF] bg-[rgba(232,223,245,0.6)] text-[#3B2E7A]' : 'border-[#E6E0DA] bg-white text-[#5f5e5a]'}`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
                {errors.gender && <span className="text-[11px] text-[#A32D2D]">{errors.gender}</span>}
              </div>
            </div>
          </div>

          <label className={`flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 cursor-pointer ${errors.consent ? 'border-[#A32D2D] bg-[#FCEBEB]' : 'border-[#E6E0DA] bg-white'}`}>
            <input
              type="checkbox"
              checked={draft.consent}
              onChange={(e) => {
                const v = e.target.checked;
                setDraft((d) => ({ ...d, consent: v }));
                setErrors((er) => ({ ...er, consent: undefined }));
              }}
              className="mt-0.5 w-[18px] h-[18px] accent-[#BFA7FF]"
            />
            <span className="text-[12px] text-[#5f5e5a] leading-relaxed">
              <b className="text-[#26251f]">[필수]</b> 입력한 내용, 연락처, 출생 정보는 분석 보고서 작성 및 결과 안내(이메일) 목적으로만 사용되는 것에 동의합니다.
            </span>
          </label>
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[rgba(245,241,237,0.9)] backdrop-blur-[10px] border-t border-[rgba(230,224,218,0.9)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-[640px] mx-auto px-4 py-3">
          {message && <p className="text-[12px] text-[#A32D2D] mb-2 text-center" role="alert">{message}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => router.push('/mandalart')} className="px-4 py-3 rounded-[14px] border border-[#E6E0DA] bg-white text-[14px] text-[#2A2725]">홈</button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !ready}
              className="flex-1 py-3 rounded-[14px] font-bold text-[14px] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] shadow-[0_10px_22px_rgba(123,203,255,0.18)] active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {submitting ? '제출 중...' : ready ? (chapterMode ? '이 보고서만 분석 요청하기' : '최종 보고서 신청하기') : (chapterMode ? '챕터 완료 후 신청 가능' : '두 챕터 완료 후 신청 가능')}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function MandalartSubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <SubmitContent />
    </Suspense>
  );
}
