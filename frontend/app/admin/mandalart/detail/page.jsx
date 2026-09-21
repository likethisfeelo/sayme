'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageShell, { Card, Spinner } from '@/app/components/mandalart/PageShell';
import MandalartGrid from '@/app/components/mandalart/MandalartGrid';
import StatusStepper from '@/app/components/mandalart/StatusStepper';
import { isAdmin } from '@/lib/auth/checkAdmin';
import { analysisAdminApi } from '@/lib/api/analysis';
import {
  worksheetsInAnswers, STATUS_STEPS, STATUS_LABEL, STATUS_BADGE_CLASS, formatDateTime, sheetsFromAnswers, sheetsToText, buildReportTemplate,
} from '@/lib/mandalart';

/**
 * /admin/mandalart/detail?id= : 신청 상세 · 상태 변경 · 보고서(HTML) 작성/미리보기 · 전송
 */
function AdminDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);

  const [adminNote, setAdminNote] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [tab, setTab] = useState('edit'); // edit | preview
  const [dirty, setDirty] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);

  const apply = useCallback((r) => {
    setRequest(r);
    setAdminNote(r.adminNote || '');
    setReportTitle(r.reportTitle || '');
    setReportHtml(r.reportHtml || '');
    setSendTo(r.email || '');
    setDirty(false);
  }, []);

  const load = useCallback(async () => {
    if (!requestId) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await analysisAdminApi.get(requestId);
      apply(data.request);
    } catch (err) {
      if (err.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.message || '신청 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [requestId, router, apply]);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/me');
      return;
    }
    load();
  }, [load, router]);

  const sheets = useMemo(() => (request ? sheetsFromAnswers(request.answers) : null), [request]);

  const flash = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const changeStatus = async (status) => {
    try {
      setBusy(status);
      const data = await analysisAdminApi.updateStatus(request.requestId, status, adminNote);
      apply(data.request);
      flash('ok', `상태를 "${STATUS_LABEL[status]}" 로 변경했습니다.`);
    } catch (err) {
      flash('err', err.message);
    } finally {
      setBusy('');
    }
  };

  const saveNote = async () => {
    try {
      setBusy('note');
      const data = await analysisAdminApi.saveNote(request.requestId, adminNote);
      apply(data.request);
      flash('ok', '메모를 저장했습니다.');
    } catch (err) {
      flash('err', err.message);
    } finally {
      setBusy('');
    }
  };

  const saveReport = async () => {
    try {
      setBusy('save');
      const data = await analysisAdminApi.saveReport(request.requestId, { reportTitle, reportHtml });
      apply(data.request);
      flash('ok', '보고서를 저장했습니다.');
      return true;
    } catch (err) {
      flash('err', err.message);
      return false;
    } finally {
      setBusy('');
    }
  };

  const sendReport = async () => {
    if (!reportHtml.trim()) {
      flash('err', '보고서 내용이 비어 있습니다.');
      return;
    }
    const isResend = request.status === 'sent';
    if (!window.confirm(`${isResend ? '보고서를 다시 전송하고' : '보고서를 전송하고'} ${sendTo} 로 이메일 알림을 보낼까요?`)) return;
    try {
      setBusy('send');
      const data = await analysisAdminApi.send(request.requestId, { reportTitle, reportHtml, email: sendTo });
      apply(data.request);
      if (data.email?.sent) flash('ok', `보고서를 전송하고 이메일을 발송했습니다. (${sendTo})`);
      else flash('err', `상태는 전송 완료로 변경되었지만 이메일 발송에 실패했습니다: ${data.email?.error || '원인 불명'}`);
    } catch (err) {
      flash('err', err.message);
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    if (!window.confirm('이 신청을 삭제할까요? 되돌릴 수 없습니다.')) return;
    try {
      setBusy('delete');
      await analysisAdminApi.remove(request.requestId);
      router.push('/admin/mandalart');
    } catch (err) {
      flash('err', err.message);
      setBusy('');
    }
  };

  const insertTemplate = () => {
    if (reportHtml.trim() && !window.confirm('현재 작성 중인 내용을 템플릿으로 덮어쓸까요?')) return;
    setReportHtml(buildReportTemplate(request));
    if (!reportTitle) setReportTitle(`${request.name ? `${request.name}님의 ` : ''}${request.chapterTitle || '만다라트'} 분석 보고서`);
    setDirty(true);
    setTab('edit');
  };

  const copyInput = async () => {
    const text = `이름: ${request.name}\n이메일: ${request.email}\n연락처: ${request.phone}\n접수: ${formatDateTime(request.createdAt)}\n\n${sheetsToText(sheets)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('복사하세요', text);
    }
  };

  const viewUrl = request?.viewToken && typeof window !== 'undefined'
    ? `${window.location.origin}/mandalart/report/?id=${encodeURIComponent(request.requestId)}&token=${encodeURIComponent(request.viewToken)}`
    : '';

  return (
    <PageShell subtitle="관리자 · 신청 상세" backTo="/admin/mandalart" maxWidthClass="max-w-[1100px]">
      {loading ? (
        <Spinner />
      ) : error ? (
        <Card><p className="text-[13px] text-red-600">{error}</p></Card>
      ) : (
        <>
          {notice && (
            <div className={`sticky top-[62px] z-20 rounded-[12px] px-4 py-2.5 text-[13px] shadow-md ${notice.type === 'ok' ? 'bg-[#E1F5EE] text-[#04342C] border border-[#1D9E75]' : 'bg-[#FCEBEB] text-[#A32D2D] border border-[#A32D2D]'}`}>
              {notice.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 items-start">
            {/* 좌측: 신청 정보 + 상태 */}
            <div className="flex flex-col gap-3">
              <Card>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h1 className="text-[16px] font-bold">{request.name || '이름 없음'}</h1>
                    <div className="text-[12px] text-[#5f5e5a]">{request.email}</div>
                    <div className="text-[12px] text-[#5f5e5a]">{request.phone}</div>
                  </div>
                  <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full ${STATUS_BADGE_CLASS[request.status] || ''}`}>{STATUS_LABEL[request.status]}</span>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px] text-[#5f5e5a] mb-3">
                  <dt>챕터</dt><dd className="font-semibold text-[#2A2725]">{request.chapterTitle || (request.chapter === 'all' ? '전체 (두 챕터)' : request.chapter || '-')}</dd>
                  <dt>요청ID</dt><dd className="font-mono break-all">{request.requestId}</dd>
                  <dt>접수</dt><dd>{formatDateTime(request.createdAt)}</dd>
                  <dt>수정</dt><dd>{formatDateTime(request.updatedAt)}</dd>
                  {request.sentAt && (<><dt>전송</dt><dd>{formatDateTime(request.sentAt)}</dd></>)}
                  {request.emailSentAt && (<><dt>메일</dt><dd className="text-[#3E5A3A]">발송됨 {formatDateTime(request.emailSentAt)}</dd></>)}
                  {request.emailError && (<><dt>메일</dt><dd className="text-[#A32D2D]">실패: {request.emailError}</dd></>)}
                  <dt>출처</dt><dd>{request.source || '-'}</dd>
                </dl>

                <StatusStepper status={request.status} compact />

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {STATUS_STEPS.filter((s) => s.key !== 'sent').map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      disabled={!!busy || request.status === s.key}
                      onClick={() => changeStatus(s.key)}
                      className={`text-[12px] px-3 py-1.5 rounded-full border disabled:opacity-50 ${request.status === s.key ? 'bg-[#2A2725] text-white border-[#2A2725]' : 'bg-white border-[#E6E0DA]'}`}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>

                <ul className="mt-3 space-y-0.5 text-[11px] text-[#94928b]">
                  {(request.statusHistory || []).map((h, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span>{STATUS_LABEL[h.status] || h.status} <span className="opacity-70">· {h.by}</span></span>
                      <span className="shrink-0">{formatDateTime(h.at)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3">
                  <label className="text-[12px] text-[#5f5e5a]">관리자 메모 (사용자에게 보이지 않음)</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-[12px] border border-[#E6E0DA] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#BFA7FF]"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <button type="button" onClick={remove} disabled={!!busy} className="text-[11px] text-[#A32D2D] underline underline-offset-2">신청 삭제</button>
                    <button type="button" onClick={saveNote} disabled={!!busy} className="text-[12px] px-3 py-1.5 rounded-lg border border-[#E6E0DA] bg-white">메모 저장</button>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[14px] font-bold">사용자 입력</h2>
                  <button type="button" onClick={copyInput} className="text-[11px] underline underline-offset-2 text-[#5f5e5a]">{copied ? '복사됨' : '텍스트로 복사'}</button>
                </div>
                <div className="space-y-3">
                  {worksheetsInAnswers(request.answers).map((ws) => (
                    <div key={ws.key} className="rounded-[14px] border overflow-hidden" style={{ borderColor: ws.theme.accln }}>
                      <div className="px-3.5 py-2" style={{ background: ws.theme.accbg, color: ws.theme.accd }}>
                        <div className="text-[13px] font-bold">{ws.title}</div>
                        <div className="text-[11px] opacity-80">{ws.subtitle}</div>
                      </div>
                      <div className="p-2.5 bg-white">
                        <MandalartGrid sheet={ws} data={sheets[ws.key]} mode="readonly" />
                        <details className="mt-2 text-[12px]">
                          <summary className="cursor-pointer text-[#5f5e5a]">파고들기 전체 보기</summary>
                          <ol className="mt-2 space-y-2 pl-4 list-decimal">
                            {sheets[ws.key].items.map((it, i) => (
                              <li key={i}>
                                <b>{it.text || '-'}</b>
                                <ul className="pl-3 text-[#5f5e5a]">
                                  {it.subs.map((s, j) => (
                                    <li key={j}>· {ws.subLabels[j]}: {s || <span className="text-[#b3b0a6]">-</span>}</li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                          </ol>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 우측: 보고서 작성 */}
            <div className="flex flex-col gap-3 lg:sticky lg:top-[70px]">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="text-[14px] font-bold">분석 보고서 (HTML)</h2>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={insertTemplate} className="text-[12px] px-3 py-1.5 rounded-lg border border-[#E6E0DA] bg-white">입력 기반 템플릿 넣기</button>
                    <div className="flex rounded-lg border border-[#E6E0DA] overflow-hidden">
                      <button type="button" onClick={() => setTab('edit')} className={`text-[12px] px-3 py-1.5 ${tab === 'edit' ? 'bg-[#2A2725] text-white' : 'bg-white'}`}>편집</button>
                      <button type="button" onClick={() => setTab('preview')} className={`text-[12px] px-3 py-1.5 ${tab === 'preview' ? 'bg-[#2A2725] text-white' : 'bg-white'}`}>미리보기</button>
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => { setReportTitle(e.target.value); setDirty(true); }}
                  placeholder="보고서 제목 (예: 홍길동님의 만다라트 분석 보고서)"
                  className="w-full rounded-[12px] border border-[#E6E0DA] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#BFA7FF] mb-2"
                />

                {tab === 'edit' ? (
                  <textarea
                    ref={editorRef}
                    value={reportHtml}
                    onChange={(e) => { setReportHtml(e.target.value); setDirty(true); }}
                    spellCheck={false}
                    placeholder={'<h2>한눈에 보기</h2>\n<p>...</p>\n\nHTML 로 작성하세요. "입력 기반 템플릿 넣기" 를 누르면 사용자의 만다라트가 포함된 시작 템플릿이 들어갑니다.'}
                    className="w-full min-h-[420px] rounded-[12px] border border-[#E6E0DA] bg-[#FCFAF8] px-3.5 py-3 text-[13px] font-mono leading-[1.6] outline-none focus:border-[#BFA7FF]"
                  />
                ) : (
                  <div className="min-h-[420px] rounded-[12px] border border-[#E6E0DA] bg-white px-4 py-4 text-[15px] leading-[1.75] [&_img]:max-w-full [&_h1]:text-[20px] [&_h1]:font-bold [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:mt-6 [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:mt-4 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                    {reportHtml.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
                    ) : (
                      <p className="text-[#b3b0a6]">미리볼 내용이 없습니다.</p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                  <span className="text-[11px] text-[#94928b]">
                    {dirty ? '저장되지 않은 변경사항이 있어요.' : request.reportUpdatedAt ? `마지막 저장 ${formatDateTime(request.reportUpdatedAt)}` : '아직 저장된 보고서가 없어요.'}
                  </span>
                  <button
                    type="button"
                    onClick={saveReport}
                    disabled={!!busy}
                    className="text-[13px] px-4 py-2 rounded-[12px] border border-[#E6E0DA] bg-white font-semibold disabled:opacity-60"
                  >
                    {busy === 'save' ? '저장 중...' : '초안 저장 (작성 중 상태)'}
                  </button>
                </div>
              </Card>

              <Card className="!border-[#BFA7FF]">
                <h2 className="text-[14px] font-bold mb-1">보고서 전송</h2>
                <p className="text-[12px] text-[#5f5e5a] mb-3">상태를 <b>보고서 전송 완료</b>로 바꾸고, 아래 이메일로 보고서 링크를 발송합니다. 사용자는 로그인 화면에서도 볼 수 있어요.</p>
                <label className="block text-[12px] text-[#5f5e5a]">받는 이메일</label>
                <input
                  type="email"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  className="mt-1 w-full rounded-[12px] border border-[#E6E0DA] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#BFA7FF] mb-3"
                />
                <button
                  type="button"
                  onClick={sendReport}
                  disabled={!!busy || !reportHtml.trim()}
                  className="w-full py-3 rounded-[14px] font-bold text-[14px] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {busy === 'send' ? '전송 중...' : request.status === 'sent' ? '보고서 다시 전송 + 이메일 재발송' : '보고서 전송 + 이메일 알림'}
                </button>
                {viewUrl && request.status === 'sent' && (
                  <div className="mt-3 text-[11px] text-[#5f5e5a]">
                    <div className="mb-1">사용자 열람 링크 (이메일에 포함됨)</div>
                    <div className="flex gap-1.5">
                      <input readOnly value={viewUrl} className="flex-1 min-w-0 rounded-lg border border-[#E6E0DA] bg-[#FCFAF8] px-2 py-1.5 text-[11px] font-mono" onFocus={(e) => e.target.select()} />
                      <a href={viewUrl} target="_blank" rel="noreferrer" className="shrink-0 px-2.5 py-1.5 rounded-lg border border-[#E6E0DA] bg-white">열기</a>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

export default function AdminMandalartDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <AdminDetailContent />
    </Suspense>
  );
}
