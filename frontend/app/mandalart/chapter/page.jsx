'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import PageShell, { Card, Spinner } from '@/app/components/mandalart/PageShell';
import MandalartGrid from '@/app/components/mandalart/MandalartGrid';
import useDraft from '@/app/components/mandalart/useDraft';
import { getAccessToken } from '@/app/utils/auth';
import {
  SERVICE_NAME, CELL_COUNT, PASS_COUNT, worksheetByKey, passesOf, isChapterComplete, nextPassIndex, sheetsToText, formatDateTime,
} from '@/lib/mandalart';

/**
 * /mandalart/chapter?key=complete|torment&pass=0..3|view
 *  pass 0     : 8가지 주제 (그리드)
 *  pass 1..3  : 하위 항목 회차 — 8개 주제를 세로로 나열하고, 앞 회차 내용을 참고로 보여주며 현재 항목 입력
 *  view       : 최종 화면 (칸을 눌러 조회)
 * 각 회차는 "저장 및 완료" 로 서버에 저장되고, 이어서 "계속하기" 로 다음 회차로 넘어감
 */
function AutoTextarea({ value, onChange, onEnter, placeholder, inputRef, ariaLabel, maxLength = 500 }) {
  const innerRef = useRef(null);
  const ref = inputRef || innerRef;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.max(el.scrollHeight, 48)}px`;
  }, [value, ref]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={ariaLabel}
      enterKeyHint="next"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onEnter?.();
        }
      }}
      className="block w-full resize-none bg-transparent outline-none text-[16px] leading-[1.5] text-[#26251f] placeholder:text-[#b3b0a6]"
      style={{ overflow: 'hidden' }}
    />
  );
}

function ChapterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get('key') || 'complete';
  const passParam = searchParams.get('pass') || '0';
  const ws = worksheetByKey(key) || worksheetByKey('complete');
  const isView = passParam === 'view';
  const pass = isView ? PASS_COUNT - 1 : Math.min(Math.max(parseInt(passParam, 10) || 0, 0), PASS_COUNT - 1);
  const passes = useMemo(() => passesOf(ws), [ws]);
  const passDef = passes[pass];

  const [authed] = useState(() => typeof window !== 'undefined' && !!getAccessToken());
  const { draft, setDraft, loading, persist, syncing, syncError, lastSyncedAt } = useDraft({ enabled: authed });
  const routeKey = `${key}-${passParam}`;
  const [completedKey, setCompletedKey] = useState(null); // "저장 및 완료" 직후 패널을 보여줄 회차
  const completed = completedKey === routeKey;
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const rowRefs = useRef([]);
  const topRef = useRef(null);

  useEffect(() => {
    if (!authed) router.push('/signup');
  }, [authed, router]);

  useEffect(() => {
    if (syncError === '401') router.push('/login');
  }, [syncError, router]);

  useEffect(() => {
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start' }));
  }, [routeKey]);

  const sheet = draft?.sheets?.[ws.key];

  const updateSheet = (next) => {
    setDraft((d) => ({ ...d, sheets: { ...d.sheets, [ws.key]: { ...d.sheets[ws.key], ...next } } }));
  };
  const updateSub = (i, j, text) => {
    updateSheet({ items: sheet.items.map((it, idx) => (idx === i ? { ...it, subs: it.subs.map((s, k) => (k === j ? text : s)) } : it)) });
  };

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSaveOnly = async () => {
    const ok = await persist();
    flash(ok ? '저장했어요.' : '서버 저장에 실패했지만 이 브라우저에는 보관돼요.');
  };

  const handleComplete = async () => {
    const done = sheet.done.map((d, idx) => (idx === pass ? true : d));
    const nextDraft = { ...draft, sheets: { ...draft.sheets, [ws.key]: { ...sheet, done } }, updatedAt: new Date().toISOString() };
    setDraft(nextDraft);
    const ok = await persist(nextDraft);
    if (!ok) flash('서버 저장에 실패했지만 이 브라우저에는 보관돼요.');
    setCompletedKey(routeKey);
    if (navigator.vibrate) navigator.vibrate(40);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  const handleCopy = async () => {
    const text = sheetsToText({ [ws.key]: sheet });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('복사하세요', text);
    }
  };

  const go = (p) => router.push(`/mandalart/chapter/?key=${ws.key}&pass=${p}`);

  if (loading || !sheet) {
    return (
      <PageShell subtitle={SERVICE_NAME} backTo="/mandalart" maxWidthClass="max-w-[640px]"><Spinner /></PageShell>
    );
  }

  const chapterComplete = isChapterComplete(sheet);
  const nextAfterThis = pass + 1 < PASS_COUNT ? pass + 1 : null;
  const filledTopics = sheet.items.filter((it) => it.text.trim()).length;
  const filledCurrent = pass > 0 ? sheet.items.filter((it) => (it.subs[pass - 1] || '').trim()).length : 0;

  return (
    <PageShell subtitle={`${SERVICE_NAME} · ${ws.title}`} backTo="/mandalart" maxWidthClass="max-w-[640px]" bottomPadding={isView ? 'pb-10' : 'pb-[110px]'} showMenuButton={false}>
      <div ref={topRef} />

      {/* 회차 진행 표시 */}
      <div className="sticky top-[57px] z-20 -mx-4 -mt-4 mb-1 px-4 py-2 bg-[rgba(245,241,237,0.85)] backdrop-blur-[8px] border-b border-[rgba(230,224,218,0.8)]">
        <div className="flex items-center gap-1.5">
          {passes.map((p) => {
            const isDone = sheet.done[p.index];
            const active = !isView && p.index === pass;
            const reachable = isDone || nextPassIndex(sheet) === p.index;
            return (
              <button
                key={p.key}
                type="button"
                disabled={!reachable}
                onClick={() => go(p.index)}
                className="flex-1 min-w-0 flex flex-col items-center gap-1 disabled:cursor-default"
                aria-current={active ? 'step' : undefined}
              >
                <div className="w-full h-[6px] rounded-full bg-[#E6E0DA] overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: ws.theme.accln }} initial={false} animate={{ width: isDone ? '100%' : active ? '55%' : '0%' }} transition={{ duration: 0.4 }} />
                </div>
                <span className={`text-[10px] leading-none truncate max-w-full ${active ? 'font-bold text-[#2A2725]' : isDone ? 'text-[#5f5e5a]' : 'text-[#b3b0a6]'}`}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {completed ? (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="text-center" style={{ borderColor: ws.theme.accln }}>
              <div className="text-[34px] mb-1">{chapterComplete ? '🎉' : '✅'}</div>
              <div className="text-[17px] font-bold mb-1">{chapterComplete ? `${ws.title} 챕터 완료!` : `"${passDef.label}" 저장 완료`}</div>
              <p className="text-[12px] text-[#5f5e5a] mb-4">
                {chapterComplete ? '입력한 내용을 최종 화면에서 칸별로 확인할 수 있어요.' : '이어서 다음 항목을 적어볼까요? 나중에 돌아와도 여기서부터 계속돼요.'}
              </p>
              <div className="flex flex-col gap-2">
                {chapterComplete ? (
                  <button type="button" onClick={() => go('view')} className="w-full py-3 rounded-[14px] font-bold text-[14px] text-white" style={{ background: ws.theme.accln }}>
                    최종 화면 보기 →
                  </button>
                ) : (
                  <button type="button" onClick={() => go(nextAfterThis)} className="w-full py-3 rounded-[14px] font-bold text-[14px] text-white" style={{ background: ws.theme.accln }}>
                    계속하기 · {passes[nextAfterThis].label} →
                  </button>
                )}
                <button type="button" onClick={() => router.push('/mandalart')} className="w-full py-3 rounded-[14px] border border-[#E6E0DA] bg-white text-[13px] text-[#2A2725]">
                  홈으로 (다른 챕터 보기)
                </button>
              </div>
            </Card>
          </motion.div>
        ) : isView ? (
          <motion.div key="view" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="flex flex-col gap-3">
            <Card>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.08em]" style={{ color: ws.theme.acc }}>최종 화면</div>
                  <h1 className="text-[20px] font-bold leading-tight">{ws.title}</h1>
                  <p className="text-[12px] text-[#94928b]">{ws.subtitle}</p>
                </div>
                <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-full" style={{ background: ws.theme.accbg, color: ws.theme.acc }}>
                  {chapterComplete ? '완료' : '작성 중'}
                </span>
              </div>
              <p className="text-[12px] text-[#5f5e5a] mb-3">칸을 누르면 {ws.subLabels.join(' · ')} 을 볼 수 있어요.</p>
              <MandalartGrid sheet={ws} data={sheet} mode="readonly" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {passes.map((p) => (
                  <button key={p.key} type="button" onClick={() => go(p.index)} className="text-[11px] px-2.5 py-1.5 rounded-full border border-[#E6E0DA] bg-white text-[#5f5e5a]">
                    {p.label} 수정
                  </button>
                ))}
              </div>
            </Card>
            <div className="flex items-center justify-between text-[11px] text-[#94928b] px-1">
              <span>{lastSyncedAt ? `서버 저장 ${formatDateTime(lastSyncedAt)}` : ''}</span>
              <button type="button" onClick={handleCopy} className="underline underline-offset-2">{copied ? '복사됨' : '텍스트로 복사'}</button>
            </div>
            <button type="button" onClick={() => router.push('/mandalart')} className="w-full py-3 rounded-[14px] font-bold text-[14px] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f]">
              홈으로 →
            </button>
          </motion.div>
        ) : (
          <motion.div key={`pass-${pass}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
            <Card>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: ws.theme.acc }}>{pass + 1}단계 · {passDef.label}</div>
                  <h1 className="text-[20px] font-bold leading-tight">{ws.title}</h1>
                  <p className="text-[12px] text-[#94928b]">{ws.subtitle}</p>
                </div>
                <div className="shrink-0 text-[12px] font-semibold px-2.5 py-1.5 rounded-full border" style={{ borderColor: ws.theme.accln, color: ws.theme.acc, background: ws.theme.accbg }}>
                  {pass === 0 ? `${filledTopics} / ${CELL_COUNT} 칸` : `${filledCurrent} / ${CELL_COUNT} 항목`}
                </div>
              </div>
              <p className="text-[12px] text-[#5f5e5a] mb-3 leading-relaxed">{passDef.description}</p>

              {pass === 0 ? (
                <MandalartGrid sheet={ws} data={sheet} mode="fill" onChange={(next) => updateSheet({ items: next.items })} autoFocusFirst />
              ) : (
                <ol className="flex flex-col gap-2">
                  {sheet.items.map((item, i) => {
                    const hasTopic = !!item.text.trim();
                    const prev = ws.subLabels.slice(0, pass - 1).map((label, j) => ({ label, value: item.subs[j] })).filter((p) => (p.value || '').trim());
                    return (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 * i }}
                        className="rounded-[14px] border bg-white overflow-hidden"
                        style={{ borderColor: (item.subs[pass - 1] || '').trim() ? ws.theme.accln : '#E6E0DA' }}
                      >
                        <div className="flex items-center gap-2 px-3 py-2" style={{ background: ws.theme.accbg }}>
                          <span className="w-[22px] h-[22px] rounded-full grid place-items-center text-[11px] font-bold text-white shrink-0" style={{ background: ws.theme.accln }}>{i + 1}</span>
                          <span className="text-[14px] font-semibold truncate" style={{ color: ws.theme.accd }}>
                            {hasTopic ? item.text : <span className="font-normal text-[#94928b]">(주제 미입력)</span>}
                          </span>
                        </div>
                        {prev.length > 0 && (
                          <div className="px-3 pt-2 flex flex-col gap-1">
                            {prev.map((p) => (
                              <div key={p.label} className="text-[12px] text-[#5f5e5a] leading-snug">
                                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded mr-1.5 align-middle" style={{ background: ws.theme.accbg, color: ws.theme.acc }}>{p.label}</span>
                                <span className="align-middle">{p.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="px-3 py-2.5">
                          <div className="text-[11px] text-[#94928b] mb-1">{passDef.label}</div>
                          <div className="rounded-[10px] border border-dashed border-[#c9c7bd] bg-[#FCFAF8] px-3 py-2 focus-within:border-solid" style={{ borderColor: undefined }}>
                            <AutoTextarea
                              inputRef={(el) => { rowRefs.current[i] = el; }}
                              value={item.subs[pass - 1] || ''}
                              onChange={(v) => updateSub(i, pass - 1, v)}
                              onEnter={() => {
                                const nextEl = rowRefs.current[i + 1];
                                if (nextEl) {
                                  nextEl.focus();
                                  nextEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                } else rowRefs.current[i]?.blur();
                              }}
                              placeholder={hasTopic ? `${item.text}에 대한 ${passDef.label}` : '주제가 비어 있어도 적을 수 있어요'}
                              ariaLabel={`${i + 1}번 ${passDef.label}`}
                            />
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              )}
            </Card>

            <div className="mt-2 flex items-center justify-between text-[11px] text-[#94928b] px-1">
              <span>{syncing ? '서버에 저장 중…' : lastSyncedAt ? `서버 저장 ${formatDateTime(lastSyncedAt)}` : '입력 내용은 이 브라우저에 자동 저장돼요.'}</span>
              <button type="button" onClick={handleCopy} className="underline underline-offset-2">{copied ? '복사됨' : '텍스트로 복사'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 고정 액션 */}
      {!isView && !completed && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[rgba(245,241,237,0.9)] backdrop-blur-[10px] border-t border-[rgba(230,224,218,0.9)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-[640px] mx-auto px-4 py-3">
            <AnimatePresence>
              {toast && (
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[12px] text-[#5f5e5a] mb-2 text-center" role="status">
                  {toast}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (pass === 0 ? router.push('/mandalart') : go(pass - 1))}
                className="px-4 py-3 rounded-[14px] border border-[#E6E0DA] bg-white text-[14px] text-[#2A2725]"
              >
                {pass === 0 ? '홈' : '이전'}
              </button>
              <button
                type="button"
                onClick={handleSaveOnly}
                disabled={syncing}
                className="px-4 py-3 rounded-[14px] border bg-white text-[14px] disabled:opacity-60"
                style={{ borderColor: ws.theme.accln, color: ws.theme.acc }}
              >
                임시 저장
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={syncing}
                className="flex-1 py-3 rounded-[14px] font-bold text-[14px] text-white active:scale-[0.98] transition-transform disabled:opacity-60"
                style={{ background: ws.theme.accln, boxShadow: `0 10px 22px ${ws.theme.soft}` }}
              >
                {syncing ? '저장 중…' : '저장 및 완료 →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function MandalartChapterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <ChapterContent />
    </Suspense>
  );
}
