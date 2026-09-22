'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell, { Card, Spinner } from '@/app/components/mandalart/PageShell';
import { isAdmin } from '@/lib/auth/checkAdmin';
import { analysisAdminApi, downloadBlob } from '@/lib/api/analysis';
import { STATUS_STEPS, STATUS_LABEL, STATUS_BADGE_CLASS, formatDateTime, sheetsFromAnswers, worksheetsInAnswers, filledCount, genderLabel, birthTimeLabel } from '@/lib/mandalart';

/**
 * /admin/mandalart : 신청 목록 조회 · 필터 · CSV 다운로드
 * 데스크톱에서는 표, 모바일에서는 카드로 표시
 */
export default function AdminMandalartListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await analysisAdminApi.list();
      setRequests(data.requests || []);
      setCounts(data.counts || {});
    } catch (err) {
      if (err.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/me');
      return;
    }
    load();
  }, [load, router]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!kw) return true;
      return [r.name, r.email, r.phone, r.requestId, r.chapterTitle, r.profile?.birthCity, r.profile?.birthDate].some((v) => (v || '').toLowerCase().includes(kw));
    });
  }, [requests, statusFilter, keyword]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await analysisAdminApi.exportCsv(statusFilter || undefined);
      downloadBlob(blob, `mandalart-requests-${new Date().toISOString().slice(0, 10)}${statusFilter ? `-${statusFilter}` : ''}.csv`);
    } catch (err) {
      alert(err.message || 'CSV 다운로드에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `mandalart-requests-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const summary = (r) => {
    const sheets = sheetsFromAnswers(r.answers);
    return worksheetsInAnswers(r.answers).map((ws) => `${ws.title.slice(0, 6)}… ${filledCount(sheets[ws.key])}/8`).join(' · ');
  };
  const chapterLabel = (r) => r.chapterTitle || (r.chapter === 'all' ? '전체' : r.chapter || '-');

  return (
    <PageShell subtitle="관리자 · 만다라트 신청" backTo="/admin" maxWidthClass="max-w-[1100px]">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h1 className="text-[15px] font-bold">만다라트 신청 목록</h1>
            <p className="text-[11px] text-[#94928b]">총 {requests.length}건 · 표시 {filtered.length}건</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={load} className="text-[12px] px-3 py-2 rounded-lg border border-[#E6E0DA] bg-white">새로고침</button>
            <button type="button" onClick={handleExportJson} className="text-[12px] px-3 py-2 rounded-lg border border-[#E6E0DA] bg-white">JSON</button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="text-[12px] px-3 py-2 rounded-lg font-bold bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] disabled:opacity-60"
            >
              {exporting ? '다운로드 중...' : 'CSV 다운로드'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`text-[12px] px-3 py-1.5 rounded-full border ${!statusFilter ? 'bg-[#2A2725] text-white border-[#2A2725]' : 'bg-white border-[#E6E0DA] text-[#5f5e5a]'}`}
          >
            전체 {requests.length}
          </button>
          {STATUS_STEPS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatusFilter(s.key)}
              className={`text-[12px] px-3 py-1.5 rounded-full border ${statusFilter === s.key ? 'bg-[#2A2725] text-white border-[#2A2725]' : `bg-white border-[#E6E0DA] ${STATUS_BADGE_CLASS[s.key]}`}`}
            >
              {s.icon} {s.label} {counts[s.key] ?? 0}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="이름 / 이메일 / 연락처 / 요청ID 검색"
          className="w-full rounded-[12px] border border-[#E6E0DA] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#BFA7FF]"
        />
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Card><p className="text-[13px] text-red-600">{error}</p></Card>
      ) : filtered.length === 0 ? (
        <Card><p className="text-[13px] text-[#94928b] text-center py-6">표시할 신청이 없습니다.</p></Card>
      ) : (
        <>
          {/* 데스크톱: 표 */}
          <Card className="hidden md:block !p-0 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F9F6F3] text-[#5f5e5a] text-[11px]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">접수</th>
                  <th className="text-left px-4 py-2.5 font-medium">챕터</th>
                  <th className="text-left px-4 py-2.5 font-medium">이름</th>
                  <th className="text-left px-4 py-2.5 font-medium">이메일 / 연락처</th>
                  <th className="text-left px-4 py-2.5 font-medium">입력</th>
                  <th className="text-left px-4 py-2.5 font-medium">상태</th>
                  <th className="text-left px-4 py-2.5 font-medium">보고서</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.requestId} className="border-t border-[#F0ECE7] hover:bg-[#FCFAF8] cursor-pointer" onClick={() => router.push(`/admin/mandalart/detail/?id=${encodeURIComponent(r.requestId)}`)}>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5f5e5a]">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3 text-[12px]">{chapterLabel(r)}</td>
                    <td className="px-4 py-3 font-semibold">{r.name || '-'}</td>
                    <td className="px-4 py-3">
                      <div>{r.email || '-'}</div>
                      <div className="text-[11px] text-[#94928b]">{r.phone || '-'}</div>
                      {r.profile && <div className="text-[11px] text-[#5f5e5a]">{r.profile.birthDate} {birthTimeLabel(r.profile.birthTime)} · {r.profile.birthCity} · {genderLabel(r.profile.gender)}</div>}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#5f5e5a]">{summary(r)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE_CLASS[r.status] || ''}`}>{STATUS_LABEL[r.status] || r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#5f5e5a]">
                      {r.hasReport ? (r.reportTitle || '작성됨') : '-'}
                      {r.emailSentAt && <div className="text-[10px] text-[#3E5A3A]">메일 {formatDateTime(r.emailSentAt)}</div>}
                      {r.emailError && <div className="text-[10px] text-[#A32D2D]">메일 실패</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-[rgba(99,102,241,1)]">열기 ›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* 모바일: 카드 */}
          <div className="md:hidden space-y-2.5">
            {filtered.map((r) => (
              <button
                key={r.requestId}
                type="button"
                onClick={() => router.push(`/admin/mandalart/detail/?id=${encodeURIComponent(r.requestId)}`)}
                className="w-full text-left bg-white/80 border border-[#E6E0DA] rounded-[14px] p-3.5"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold truncate">{r.name || '-'} <span className="text-[11px] font-normal text-[#94928b]">· {chapterLabel(r)}</span></div>
                    <div className="text-[11px] text-[#94928b] truncate">{r.email || '-'} · {r.phone || '-'}</div>
                  </div>
                  <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full ${STATUS_BADGE_CLASS[r.status] || ''}`}>{STATUS_LABEL[r.status] || r.status}</span>
                </div>
                {r.profile && <div className="text-[11px] text-[#5f5e5a] mb-1">{r.profile.birthDate} {birthTimeLabel(r.profile.birthTime)} · {r.profile.birthCity} · {genderLabel(r.profile.gender)}</div>}
                <div className="flex justify-between text-[11px] text-[#5f5e5a]">
                  <span>{summary(r)}</span>
                  <span>{formatDateTime(r.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
