'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PageShell, { Card, Spinner } from '@/app/components/mandalart/PageShell';
import ServiceStatusCard, { ConsultCard } from '@/app/components/mandalart/ServiceStatusCard';
import useDraft from '@/app/components/mandalart/useDraft';
import { getAccessToken } from '@/app/utils/auth';
import { analysisUserApi } from '@/lib/api/analysis';
import {
  SERVICE_NAME, WORKSHEETS, PASS_COUNT, passesOf, donePassCount, isChapterComplete, nextPassIndex, latestRequestForChapter,
  STATUS_LABEL, STATUS_BADGE_CLASS, formatDateTime,
} from '@/lib/mandalart';

/**
 * /mandalart : 챕터별 진행 현황 + 제출 + 내 신청 현황
 */
export default function MandalartHomePage() {
  const router = useRouter();
  const [authed] = useState(() => typeof window !== 'undefined' && !!getAccessToken());
  const { draft, loading: draftLoading, syncError, reset } = useDraft({ enabled: authed });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await analysisUserApi.listMine();
      setRequests(data.requests || []);
    } catch (err) {
      if (err.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.message || '신청 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authed) {
      router.push('/signup');
      return;
    }
    load();
  }, [authed, load, router]);

  useEffect(() => {
    if (syncError === '401') router.push('/login');
  }, [syncError, router]);


  const goChapter = (ws, pass) => router.push(`/mandalart/chapter/?key=${ws.key}&pass=${pass}`);

  return (
    <PageShell subtitle={SERVICE_NAME} backTo="/">
      <Card className="relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(29,158,117,0.18)' }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(216,90,48,0.16)' }} />
        <div className="relative">
          <div className="text-[10px] tracking-[0.12em] uppercase text-[#6B6662] mb-1">Spirit Lab · Self Mandalart</div>
          <h1 className="text-[22px] font-bold leading-tight mb-2">{SERVICE_NAME}</h1>
          <p className="text-[13px] text-[#5f5e5a] leading-relaxed">
            챕터를 하나씩 완료하고 제출하면, 관리자가 내용을 확인하고 챕터별 분석 보고서를 이메일로 보내드려요.
          </p>
        </div>
      </Card>

      {/* 챕터 카드 */}
      {draftLoading ? (
        <Card><Spinner /></Card>
      ) : (
        WORKSHEETS.map((ws, i) => {
          const sheet = draft.sheets[ws.key];
          const passes = passesOf(ws);
          const done = donePassCount(sheet);
          const complete = isChapterComplete(sheet);
          const next = nextPassIndex(sheet);
          const started = done > 0 || sheet.items.some((it) => it.text.trim());
          return (
            <motion.div key={ws.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}>
              <Card className="!p-0 overflow-hidden" style={{ borderColor: ws.theme.accln }}>
                <div className="px-4 pt-4 pb-3" style={{ background: ws.theme.accbg }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.08em]" style={{ color: ws.theme.acc }}>Chp #.{i + 1}</div>
                      <div className="text-[17px] font-bold leading-tight" style={{ color: ws.theme.accd }}>{ws.title}</div>
                      <div className="text-[12px] text-[#5f5e5a]">{ws.subtitle}</div>
                    </div>
                    <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white/80 border" style={{ borderColor: ws.theme.accln, color: ws.theme.acc }}>
                      {complete ? '완료' : `${done} / ${PASS_COUNT} 단계`}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3 bg-white">
                  <ol className="grid grid-cols-4 gap-1.5 mb-3">
                    {passes.map((p) => {
                      const isDone = sheet.done[p.index];
                      const isNext = next === p.index;
                      return (
                        <li key={p.key}>
                          <button
                            type="button"
                            onClick={() => goChapter(ws, p.index)}
                            disabled={!isDone && !isNext}
                            className="w-full flex flex-col items-center gap-1 disabled:opacity-40"
                          >
                            <span
                              className="w-[26px] h-[26px] rounded-full grid place-items-center text-[11px] border-2"
                              style={
                                isDone
                                  ? { background: ws.theme.accln, borderColor: ws.theme.accln, color: '#fff' }
                                  : isNext
                                    ? { background: '#fff', borderColor: ws.theme.accln, color: ws.theme.acc }
                                    : { background: '#fff', borderColor: '#E6E0DA', color: '#b3b0a6' }
                              }
                            >
                              {isDone ? '✓' : p.index + 1}
                            </span>
                            <span className={`text-[10px] leading-tight text-center ${isNext ? 'font-bold text-[#2A2725]' : 'text-[#5f5e5a]'}`}>{p.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>

                  {complete ? (
                    <>
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => goChapter(ws, 'view')}
                          className="flex-1 py-2.5 rounded-[12px] font-bold text-[13px] text-white active:scale-[0.98] transition-transform"
                          style={{ background: ws.theme.accln }}
                        >
                          최종 화면 보기 →
                        </button>
                        <button type="button" onClick={() => goChapter(ws, 0)} className="px-3 py-2.5 rounded-[12px] border border-[#E6E0DA] bg-white text-[12px] text-[#5f5e5a]">
                          수정
                        </button>
                      </div>
                      <ServiceStatusCard
                        compact
                        title="이 챕터의 서비스 상태"
                        chapterKey={ws.key}
                        request={latestRequestForChapter(requests, ws.key)}
                        ready={complete}
                        loading={loading}
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goChapter(ws, next)}
                      className="w-full py-2.5 rounded-[12px] font-bold text-[13px] text-white active:scale-[0.98] transition-transform"
                      style={{ background: ws.theme.accln, boxShadow: `0 8px 18px ${ws.theme.soft}` }}
                    >
                      {started ? `계속하기 · ${passes[next].label} →` : '시작하기 →'}
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })
      )}

      {!draftLoading && draft?.updatedAt && (
        <div className="-mt-1 flex items-center justify-between text-[11px] text-[#94928b] px-1">
          <span>마지막 저장 {formatDateTime(draft.updatedAt)}</span>
          <button
            type="button"
            onClick={() => { if (window.confirm('작성 중인 두 챕터의 내용을 모두 지울까요?')) reset(); }}
            className="underline underline-offset-2"
          >
            전체 초기화
          </button>
        </div>
      )}

      <ConsultCard />

      {/* 현황 */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold">나의 신청 현황</h2>
          <button type="button" onClick={load} className="text-[11px] px-2.5 py-1 rounded-lg bg-[rgba(99,102,241,0.08)] text-[rgba(99,102,241,1)]">새로고침</button>
        </div>
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="text-[13px] text-red-600">{error}</p>
        ) : requests.length === 0 ? (
          <p className="text-[13px] text-[#94928b] text-center py-4">아직 제출한 만다라트가 없어요.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <button
                key={req.requestId}
                type="button"
                onClick={() => router.push(`/mandalart/detail/?id=${encodeURIComponent(req.requestId)}`)}
                className="w-full text-left flex items-center justify-between gap-3 rounded-[12px] border border-[#E6E0DA] bg-white px-3.5 py-3 hover:border-[rgba(191,167,255,0.6)] transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{req.reportTitle || req.chapterTitle || '만다라트 신청'}</div>
                  <div className="text-[11px] text-[#94928b]">{formatDateTime(req.createdAt)}</div>
                </div>
                <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE_CLASS[req.status] || ''}`}>
                  {STATUS_LABEL[req.status] || req.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
