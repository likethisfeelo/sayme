'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PageShell, { Card, Spinner } from '@/app/components/mandalart/PageShell';
import StatusStepper from '@/app/components/mandalart/StatusStepper';
import { getAccessToken } from '@/app/utils/auth';
import { analysisUserApi } from '@/lib/api/analysis';
import {
  SERVICE_NAME, WORKSHEETS, STATUS_LABEL, STATUS_BADGE_CLASS, formatDateTime, loadDraft, draftProgress,
} from '@/lib/mandalart';

/**
 * /mandalart : 서비스 소개 + 내 신청 현황
 */
export default function MandalartHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);

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
    if (!getAccessToken()) {
      router.push('/signup');
      return;
    }
    setDraft(loadDraft());
    load();
  }, [load, router]);

  const progress = draftProgress(draft);
  const hasDraft = !!draft && progress > 0;
  const latest = requests[0];

  return (
    <PageShell subtitle={SERVICE_NAME} backTo="/">
      {/* 소개 */}
      <Card className="relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(29,158,117,0.18)' }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(216,90,48,0.16)' }} />
        <div className="relative">
          <div className="text-[10px] tracking-[0.12em] uppercase text-[#6B6662] mb-1">Spirit Lab · Self Mandalart</div>
          <h1 className="text-[22px] font-bold leading-tight mb-2">{SERVICE_NAME}</h1>
          <p className="text-[13px] text-[#5f5e5a] leading-relaxed">
            두 장의 만다라트를 채우면, 관리자가 내용을 확인하고 나만의 분석 보고서를 작성해 이메일로 보내드려요.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WORKSHEETS.map((ws, i) => (
              <motion.div
                key={ws.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="rounded-[14px] border px-3.5 py-3"
                style={{ borderColor: ws.theme.accln, background: ws.theme.accbg }}
              >
                <div className="text-[11px]" style={{ color: ws.theme.acc }}>{i + 1}번째 장</div>
                <div className="text-[15px] font-bold" style={{ color: ws.theme.accd }}>{ws.title}</div>
                <div className="text-[12px] text-[#5f5e5a]">{ws.subtitle}</div>
              </motion.div>
            ))}
          </div>

          <ol className="mt-4 text-[12px] text-[#5f5e5a] space-y-1">
            <li>① 8칸 채우기 → ② 칸마다 3가지 파고들기 (두 장 반복)</li>
            <li>③ 연락처 확인 후 제출 → 접수 알림</li>
            <li>④ 관리자 확인 · 보고서 작성 → 이메일로 보고서 도착</li>
          </ol>

          <button
            type="button"
            onClick={() => router.push('/mandalart/new')}
            className="mt-4 w-full py-3.5 rounded-[14px] font-bold text-[14px] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] shadow-[0_10px_22px_rgba(123,203,255,0.18)] active:scale-[0.98] transition-transform"
          >
            {hasDraft ? `이어서 작성하기 · ${progress}% →` : requests.length ? '새로 작성하기 →' : '시작하기 →'}
          </button>
          {hasDraft && (
            <p className="mt-2 text-[11px] text-[#94928b] text-center">작성 중인 내용이 이 브라우저에 자동 저장되어 있어요. {draft.updatedAt ? `(${formatDateTime(draft.updatedAt)})` : ''}</p>
          )}
        </div>
      </Card>

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
          <div className="space-y-3">
            {latest && (
              <div className="pb-3 border-b border-[#E6E0DA]">
                <div className="text-[11px] text-[#94928b] mb-2">최근 신청 · {formatDateTime(latest.createdAt)}</div>
                <StatusStepper status={latest.status} />
              </div>
            )}
            {requests.map((req) => (
              <button
                key={req.requestId}
                type="button"
                onClick={() => router.push(`/mandalart/detail/?id=${encodeURIComponent(req.requestId)}`)}
                className="w-full text-left flex items-center justify-between gap-3 rounded-[12px] border border-[#E6E0DA] bg-white px-3.5 py-3 hover:border-[rgba(191,167,255,0.6)] transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{req.reportTitle || '만다라트 신청'}</div>
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
