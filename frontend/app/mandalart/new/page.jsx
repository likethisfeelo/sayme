'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import PageShell, { Card } from '@/app/components/mandalart/PageShell';
import MandalartGrid from '@/app/components/mandalart/MandalartGrid';
import { getAccessToken, getIdTokenPayload } from '@/app/utils/auth';
import { analysisUserApi } from '@/lib/api/analysis';
import {
  SERVICE_NAME, WORKSHEETS, FLOW_STEPS, CELL_COUNT, SUB_COUNT,
  emptyDraft, loadDraft, saveDraft, clearDraft,
  filledCount, subFilledCount, isSheetComplete, buildSubmitPayload, validateContact, sheetsToText, worksheetByKey,
} from '@/lib/mandalart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev';

const slide = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

function ProgressBar({ step, onJump, draft }) {
  return (
    <div className="sticky top-[57px] z-20 -mx-4 -mt-4 mb-1 px-4 py-2 bg-[rgba(245,241,237,0.85)] backdrop-blur-[8px] border-b border-[rgba(230,224,218,0.8)]">
      <div className="flex items-center gap-1.5">
        {FLOW_STEPS.map((s, i) => {
          const ws = s.sheet ? worksheetByKey(s.sheet) : null;
          const done = i < step;
          const active = i === step;
          const reachable = i <= step || (i > 0 && canLeave(FLOW_STEPS[i - 1], draft) && i <= step + 1);
          const color = ws ? ws.theme.accln : '#BFA7FF';
          return (
            <button
              key={s.id}
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(i)}
              className="flex-1 min-w-0 flex flex-col items-center gap-1 disabled:cursor-default"
              aria-current={active ? 'step' : undefined}
              aria-label={s.label}
            >
              <div className="w-full h-[6px] rounded-full bg-[#E6E0DA] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={false}
                  animate={{ width: done ? '100%' : active ? '55%' : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className={`text-[10px] leading-none truncate max-w-full ${active ? 'font-bold text-[#2A2725]' : done ? 'text-[#5f5e5a]' : 'text-[#b3b0a6]'}`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 해당 단계에서 다음으로 넘어갈 수 있는지 */
function canLeave(stepDef, draft) {
  if (!stepDef || !draft) return false;
  if (stepDef.mode === 'fill') return isSheetComplete(draft.sheets[stepDef.sheet]);
  if (stepDef.mode === 'dig') return isSheetComplete(draft.sheets[stepDef.sheet]);
  return true;
}

export default function MandalartNewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState(null);
  const [dir, setDir] = useState(1);
  const [errorCells, setErrorCells] = useState([]);
  const [message, setMessage] = useState('');
  const [contactErrors, setContactErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef(null);
  const topRef = useRef(null);

  // 초기 로드: 임시저장 + 사용자 정보 프리필
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/signup');
      return;
    }
    const loaded = loadDraft() || emptyDraft();
    setDraft(loaded);

    if (!loaded.contact.email || !loaded.contact.name) {
      const payload = getIdTokenPayload();
      fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const u = data?.user || {};
          setDraft((d) => {
            if (!d) return d;
            return {
              ...d,
              contact: {
                name: d.contact.name || u.name || u.nickname || '',
                phone: d.contact.phone || u.phoneNumber || '',
                email: d.contact.email || u.email || payload?.email || '',
              },
            };
          });
        })
        .catch(() => {});
    }
  }, [router]);

  // 자동 저장 (디바운스)
  useEffect(() => {
    if (!draft) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(draft), 250);
    return () => clearTimeout(saveTimer.current);
  }, [draft]);

  const step = draft?.step ?? 0;
  const stepDef = FLOW_STEPS[step];
  const ws = stepDef?.sheet ? worksheetByKey(stepDef.sheet) : null;
  const sheet = ws && draft ? draft.sheets[ws.key] : null;

  const goTo = useCallback((next) => {
    setDir(next > step ? 1 : -1);
    setMessage('');
    setErrorCells([]);
    setDraft((d) => ({ ...d, step: next }));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }, [step]);

  const handleNext = () => {
    if (stepDef.mode === 'fill' && !isSheetComplete(sheet)) {
      const empties = sheet.items.map((it, i) => ((it.text || '').trim() ? null : i)).filter((v) => v !== null);
      setErrorCells(empties);
      setMessage(`${CELL_COUNT}칸을 모두 채워야 넘어갈 수 있어요 (${empties.length}칸 남음)`);
      setTimeout(() => setErrorCells([]), 1400);
      if (navigator.vibrate) navigator.vibrate(60);
      return;
    }
    goTo(Math.min(step + 1, FLOW_STEPS.length - 1));
  };

  const updateSheet = (key, next) => {
    setDraft((d) => ({ ...d, sheets: { ...d.sheets, [key]: next } }));
    if (message) setMessage('');
  };

  const handleReset = () => {
    if (!window.confirm('입력한 내용을 모두 지울까요?')) return;
    clearDraft();
    const fresh = emptyDraft();
    fresh.contact = draft.contact;
    setDraft(fresh);
    setDir(-1);
  };

  const handleCopy = async () => {
    const text = sheetsToText(draft.sheets);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('복사하세요', text);
    }
  };

  const handleSubmit = async () => {
    const errors = validateContact(draft.contact, draft.consent);
    setContactErrors(errors);
    if (Object.keys(errors).length) {
      setMessage('입력 내용을 확인해 주세요.');
      return;
    }
    for (const w of WORKSHEETS) {
      if (!isSheetComplete(draft.sheets[w.key])) {
        setMessage(`"${w.title}" 8칸이 모두 채워지지 않았어요.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setMessage('');
      const data = await analysisUserApi.submit(buildSubmitPayload(draft));
      clearDraft();
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 140, spread: 75, origin: { y: 0.7 }, colors: ['#1D9E75', '#D85A30', '#BFA7FF', '#7BCBFF'] });
      } catch {
        /* 효과 실패 무시 */
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

  const digProgress = useMemo(() => (sheet ? subFilledCount(sheet) : 0), [sheet]);

  if (!draft) {
    return (
      <PageShell subtitle={SERVICE_NAME} backTo="/mandalart" maxWidthClass="max-w-[640px]">
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell subtitle={SERVICE_NAME} backTo="/mandalart" maxWidthClass="max-w-[640px]" bottomPadding="pb-[110px]" showMenuButton={false}>
      <div ref={topRef} />
      <ProgressBar step={step} onJump={goTo} draft={draft} />

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={stepDef.id}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex flex-col gap-3"
        >
          {ws && (
            <Card>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-[11px] font-medium" style={{ color: ws.theme.acc }}>
                    {stepDef.mode === 'fill' ? '1단계 · 8칸 채우기' : '2단계 · 파고들기'}
                  </div>
                  <h1 className="text-[20px] font-bold leading-tight text-[#26251f]">{ws.title}</h1>
                  <p className="text-[12px] text-[#94928b]">{ws.subtitle}</p>
                </div>
                <div
                  className="shrink-0 text-[12px] font-semibold px-2.5 py-1.5 rounded-full border"
                  style={{ borderColor: ws.theme.accln, color: ws.theme.acc, background: ws.theme.accbg }}
                >
                  {stepDef.mode === 'fill' ? `${filledCount(sheet)} / ${CELL_COUNT} 칸` : `${digProgress} / ${CELL_COUNT * SUB_COUNT} 항목`}
                </div>
              </div>

              <p className="text-[12px] text-[#5f5e5a] mb-3 leading-relaxed">
                {stepDef.mode === 'fill'
                  ? '가운데 "나"를 둘러싼 8칸을 짧은 단어나 문장으로 채워주세요. Enter 를 누르면 다음 칸으로 이동해요.'
                  : `칸을 누르면 아래에 3가지 질문이 열려요. ${ws.subHint} 비워 두어도 괜찮아요.`}
              </p>

              <MandalartGrid
                key={`${ws.key}-${stepDef.mode}`}
                sheet={ws}
                data={sheet}
                mode={stepDef.mode}
                onChange={(next) => updateSheet(ws.key, next)}
                errorCells={errorCells}
                autoFocusFirst={stepDef.mode === 'fill'}
                initialOpenCell={stepDef.mode === 'dig' ? 0 : null}
              />
            </Card>
          )}

          {stepDef.mode === 'submit' && (
            <>
              <Card>
                <h1 className="text-[20px] font-bold leading-tight mb-1">마지막 확인</h1>
                <p className="text-[12px] text-[#94928b] mb-3">입력하신 두 장을 확인하고 연락처를 남겨주세요. 보고서는 이메일로 보내드려요.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {WORKSHEETS.map((w, i) => {
                    const s = draft.sheets[w.key];
                    return (
                      <button
                        key={w.key}
                        type="button"
                        onClick={() => goTo(i * 2)}
                        className="text-left rounded-[14px] border p-3 transition-transform active:scale-[0.98]"
                        style={{ borderColor: w.theme.accln, background: w.theme.accbg }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[13px] font-bold" style={{ color: w.theme.accd }}>{w.title}</div>
                          <span className="text-[10px]" style={{ color: w.theme.acc }}>수정 ›</span>
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
                    { key: 'name', label: '이름', type: 'text', placeholder: '홍길동', autoComplete: 'name' },
                    { key: 'phone', label: '연락처', type: 'tel', placeholder: '010-0000-0000', autoComplete: 'tel', inputMode: 'tel' },
                    { key: 'email', label: '보고서 받을 이메일', type: 'email', placeholder: 'you@example.com', autoComplete: 'email', inputMode: 'email' },
                  ].map((f) => (
                    <label key={f.key} className="block">
                      <span className="text-[12px] text-[#5f5e5a]">{f.label}{f.key !== 'email' && <span className="text-[#D85A30]"> *</span>}</span>
                      <input
                        type={f.type}
                        inputMode={f.inputMode}
                        autoComplete={f.autoComplete}
                        value={draft.contact[f.key] || ''}
                        placeholder={f.placeholder}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft((d) => ({ ...d, contact: { ...d.contact, [f.key]: v } }));
                          setContactErrors((er) => ({ ...er, [f.key]: undefined }));
                        }}
                        className={`mt-1 w-full rounded-[12px] border bg-white px-3.5 py-3 text-[16px] outline-none transition-colors focus:border-[#BFA7FF] ${contactErrors[f.key] ? 'border-[#A32D2D]' : 'border-[#E6E0DA]'}`}
                      />
                      {contactErrors[f.key] && <span className="text-[11px] text-[#A32D2D]">{contactErrors[f.key]}</span>}
                    </label>
                  ))}

                  <label className={`flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 cursor-pointer ${contactErrors.consent ? 'border-[#A32D2D] bg-[#FCEBEB]' : 'border-[#E6E0DA] bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={draft.consent}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setDraft((d) => ({ ...d, consent: v }));
                        setContactErrors((er) => ({ ...er, consent: undefined }));
                      }}
                      className="mt-0.5 w-[18px] h-[18px] accent-[#BFA7FF]"
                    />
                    <span className="text-[12px] text-[#5f5e5a] leading-relaxed">
                      <b className="text-[#26251f]">[필수]</b> 입력한 내용과 연락처는 분석 보고서 작성 및 결과 안내(이메일) 목적으로만 사용되는 것에 동의합니다.
                    </span>
                  </label>
                </div>
              </Card>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 도구 */}
      <div className="flex items-center justify-between text-[11px] text-[#94928b] px-1">
        <span>입력 내용은 이 브라우저에 자동 저장돼요.</span>
        <div className="flex gap-3">
          <button type="button" onClick={handleCopy} className="underline underline-offset-2">{copied ? '복사됨' : '텍스트로 복사'}</button>
          <button type="button" onClick={handleReset} className="underline underline-offset-2">전체 초기화</button>
        </div>
      </div>

      {/* 하단 고정 액션 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[rgba(245,241,237,0.9)] backdrop-blur-[10px] border-t border-[rgba(230,224,218,0.9)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-[640px] mx-auto px-4 py-3">
          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[12px] text-[#A32D2D] mb-2 text-center"
                role="alert"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(Math.max(step - 1, 0))}
              disabled={step === 0}
              className="px-4 py-3 rounded-[14px] border border-[#E6E0DA] bg-white text-[14px] text-[#2A2725] disabled:opacity-40"
            >
              이전
            </button>
            {stepDef.mode === 'submit' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-[14px] font-bold text-[14px] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] shadow-[0_10px_22px_rgba(123,203,255,0.18)] active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {submitting ? '제출 중...' : '제출하고 보고서 요청하기'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 rounded-[14px] font-bold text-[14px] transition-all active:scale-[0.98]"
                style={
                  canLeave(stepDef, draft)
                    ? { background: ws?.theme.accln || '#BFA7FF', color: '#fff', boxShadow: `0 10px 22px ${ws?.theme.soft || 'rgba(0,0,0,0.1)'}` }
                    : { background: '#fff', color: '#94928b', border: '1px solid #E6E0DA' }
                }
              >
                {stepDef.mode === 'fill' ? '2단계로 넘어가기 →' : step === FLOW_STEPS.length - 2 ? '확인하고 제출하기 →' : '다음 장으로 →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
