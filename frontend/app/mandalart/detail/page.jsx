'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PageShell, { Card, Spinner } from '@/app/components/mandalart/PageShell';
import MandalartGrid from '@/app/components/mandalart/MandalartGrid';
import StatusStepper from '@/app/components/mandalart/StatusStepper';
import { getAccessToken } from '@/app/utils/auth';
import { analysisUserApi } from '@/lib/api/analysis';
import { SERVICE_NAME, worksheetsInAnswers, sheetsFromAnswers, formatDateTime, STATUS_LABEL, STATUS_BADGE_CLASS } from '@/lib/mandalart';

/**
 * /mandalart/detail?id= : 내 신청 상세 (입력값 조회 + 처리 상태 + 보고서 링크)
 */
function DetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');
  const justSubmitted = searchParams.get('submitted') === '1';

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [openSheet, setOpenSheet] = useState(null);

  const load = useCallback(async () => {
    if (!requestId) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await analysisUserApi.get(requestId);
      setRequest(data.request);
    } catch (err) {
      if (err.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.message || '신청 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [requestId, router]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  const sheets = request ? sheetsFromAnswers(request.answers) : null;

  return (
    <PageShell subtitle={SERVICE_NAME} backTo="/mandalart">
      {loading ? (
        <Spinner />
      ) : error ? (
        <Card><p className="text-[13px] text-red-600">{error}</p></Card>
      ) : (
        <>
          {justSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[14px] border border-[#1D9E75] bg-[#E1F5EE] px-4 py-3 text-[13px] text-[#04342C]"
            >
              🎉 제출이 완료되었어요! 관리자가 확인한 뒤 보고서를 작성해 <b>{request.email}</b> 로 보내드릴게요.
            </motion.div>
          )}

          {/* 상태 */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-[15px] font-bold">처리 상태</h1>
              <button type="button" onClick={load} className="text-[11px] px-2.5 py-1 rounded-lg bg-[rgba(99,102,241,0.08)] text-[rgba(99,102,241,1)]">새로고침</button>
            </div>
            <StatusStepper status={request.status} />
            <ul className="mt-3 space-y-1 text-[11px] text-[#94928b]">
              {(request.statusHistory || []).map((h, i) => (
                <li key={i} className="flex justify-between">
                  <span>{STATUS_LABEL[h.status] || h.status}</span>
                  <span>{formatDateTime(h.at)}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* 보고서 */}
          {request.status === 'sent' && (
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Card className="!border-[#BFA7FF] bg-gradient-to-br from-[rgba(232,223,245,0.7)] to-white">
                <div className="text-[11px] text-[#5D48A5] mb-1">보고서 도착</div>
                <div className="text-[16px] font-bold mb-1">{request.reportTitle || `${request.chapterTitle || ''} 분석 보고서`.trim()}</div>
                <div className="text-[11px] text-[#94928b] mb-3">전송 {formatDateTime(request.sentAt)} · {request.email}</div>
                <button
                  type="button"
                  onClick={() => router.push(`/mandalart/report/?id=${encodeURIComponent(request.requestId)}`)}
                  className="w-full py-3 rounded-[14px] font-bold text-[14px] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] active:scale-[0.98] transition-transform"
                >
                  보고서 보기 →
                </button>
              </Card>
            </motion.div>
          )}

          {/* 내 입력값 */}
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[15px] font-bold">내가 입력한 내용</h2>
              <span className={`text-[11px] px-2.5 py-1 rounded-full ${STATUS_BADGE_CLASS[request.status] || ''}`}>{request.statusLabel}</span>
            </div>
            <p className="text-[11px] text-[#94928b] mb-3">{request.chapterTitle ? `${request.chapterTitle} · ` : ''}접수 {formatDateTime(request.createdAt)} · {request.name} · {request.phone}</p>

            <div className="space-y-3">
              {worksheetsInAnswers(request.answers).map((ws) => {
                const open = openSheet === ws.key || openSheet === null;
                return (
                  <div key={ws.key} className="rounded-[14px] border overflow-hidden" style={{ borderColor: ws.theme.accln }}>
                    <button
                      type="button"
                      onClick={() => setOpenSheet((c) => (c === ws.key ? 'none' : ws.key))}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-left"
                      style={{ background: ws.theme.accbg, color: ws.theme.accd }}
                    >
                      <div>
                        <div className="text-[13px] font-bold">{ws.title}</div>
                        <div className="text-[11px] opacity-80">{ws.subtitle}</div>
                      </div>
                      <span className="text-[12px]">{open ? '접기' : '펼치기'}</span>
                    </button>
                    {open && (
                      <div className="p-2.5 bg-white">
                        <p className="text-[11px] text-[#94928b] mb-2">칸을 누르면 파고들기 내용을 볼 수 있어요.</p>
                        <MandalartGrid sheet={ws} data={sheets[ws.key]} mode="readonly" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}

export default function MandalartDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <DetailContent />
    </Suspense>
  );
}
