'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageShell, { Card, Spinner } from '@/app/components/mandalart/PageShell';
import useDraft from '@/app/components/mandalart/useDraft';
import { getAccessToken, getIdTokenPayload } from '@/app/utils/auth';
import { analysisUserApi } from '@/lib/api/analysis';
import {
  SERVICE_NAME, WORKSHEETS, CELL_COUNT, SUB_COUNT, worksheetByKey, isChapterComplete, subFilledCount, buildSubmitPayload, validateContact,
} from '@/lib/mandalart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

/**
 * /mandalart/submit?key=complete|torment : 해당 챕터 확인 + 연락처 + 동의 → 제출 (챕터 단위)
 */
function SubmitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ws = worksheetByKey(searchParams.get('key')) || WORKSHEETS[0];
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
    if (draft.contact.email && draft.contact.name) return;
    const token = getAccessToken();
    const payload = getIdTokenPayload();
    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user || {};
        setDraft((d) => ({
          ...d,
          contact: {
            name: d.contact.name || u.name || u.nickname || '',
            phone: d.contact.phone || u.phoneNumber || '',
            email: d.contact.email || u.email || payload?.email || '',
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
    if (!isChapterComplete(draft.sheets[ws.key])) {
      setMessage('이 챕터의 단계를 모두 완료한 뒤 제출할 수 있어요.');
      return;
    }
    try {
      setSubmitting(true);
      setMessage('');
      const data = await analysisUserApi.submit(buildSubmitPayload(draft, { chapter: ws.key }));
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

  const ready = isChapterComplete(draft.sheets[ws.key]);

  return (
    <PageShell subtitle={`${SERVICE_NAME} · 제출`} backTo="/mandalart" maxWidthClass="max-w-[640px]" bottomPadding="pb-[110px]" showMenuButton={false}>
      <Card>
        <h1 className="text-[20px] font-bold leading-tight mb-1">마지막 확인</h1>
        <p className="text-[12px] text-[#94928b] mb-3">이 챕터의 내용을 확인하고 연락처를 남겨주세요. 보고서는 챕터별로 이메일로 보내드려요.</p>
        {!ready && (
          <p className="text-[12px] text-[#A32D2D] bg-[#FCEBEB] border border-[#A32D2D] rounded-[10px] px-3 py-2 mb-3">아직 완료되지 않은 단계가 있어요. 홈에서 남은 단계를 마무리해 주세요.</p>
        )}
        <div className="flex flex-col gap-2">
          {[ws].map((w) => {
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
              <b className="text-[#26251f]">[필수]</b> 입력한 내용과 연락처는 분석 보고서 작성 및 결과 안내(이메일) 목적으로만 사용되는 것에 동의합니다.
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
              {submitting ? '제출 중...' : '제출하고 보고서 요청하기'}
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
