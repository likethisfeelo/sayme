'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAccessToken } from '@/app/utils/auth';
import { analysisUserApi } from '@/lib/api/analysis';
import { SERVICE_NAME, formatDateTime } from '@/lib/mandalart';

const BACKGROUND =
  'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), #F5F1ED';

/**
 * /mandalart/report?id=&token= : 개인별 HTML 보고서 조회
 *  - token 이 있으면 (이메일 링크) 로그인 없이 조회
 *  - 없으면 로그인 사용자의 본인 신청으로 조회
 */
function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const run = async () => {
      if (!requestId) {
        setError('잘못된 링크입니다.');
        setLoading(false);
        return;
      }
      try {
        if (token) {
          const data = await analysisUserApi.getReportByToken(requestId, token);
          setReport(data.report);
        } else {
          if (!getAccessToken()) {
            router.push(`/login?next=${encodeURIComponent(`/mandalart/report/?id=${requestId}`)}`);
            return;
          }
          const data = await analysisUserApi.get(requestId);
          const r = data.request;
          if (r.status !== 'sent' || !r.reportHtml) {
            setPending(r);
          } else {
            setReport({ requestId: r.requestId, name: r.name, reportTitle: r.reportTitle || '분석 보고서', reportHtml: r.reportHtml, sentAt: r.sentAt });
          }
        }
      } catch (err) {
        if (err.status === 409) {
          setPending({ statusLabel: err.data?.statusLabel });
        } else if (err.status === 401 && !token) {
          router.push('/login');
          return;
        } else {
          setError(err.message || '보고서를 불러오지 못했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [requestId, token, router]);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, fontFamily: '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif', color: '#2A2725' }}>
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } .report-paper { box-shadow: none !important; border: 0 !important; } }`}</style>
      <header className="no-print sticky top-0 z-20 backdrop-blur-[10px] bg-[rgba(245,241,237,0.75)] border-b border-[rgba(230,224,218,0.8)]">
        <div className="max-w-[760px] mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => router.push(getAccessToken() ? '/mandalart' : '/')} className="text-left">
            <div className="text-[13px] font-bold text-[rgba(191,167,255,0.95)]">Sayme · Spirit Lab</div>
            <div className="text-[11px] text-[#6B6662]">{SERVICE_NAME} · 분석 보고서</div>
          </button>
          {report && (
            <button type="button" onClick={handlePrint} className="text-[12px] px-3 py-2 rounded-full border border-[#E6E0DA] bg-white/70">인쇄 / PDF 저장</button>
          )}
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-4 py-5 pb-16">
        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#BFA7FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white/80 border border-[#E6E0DA] rounded-[18px] p-6 text-center">
            <p className="text-[14px] text-[#A32D2D] mb-3">{error}</p>
            <button type="button" onClick={() => router.push('/mandalart')} className="text-[13px] underline">나의 만다라트로 이동</button>
          </div>
        ) : pending ? (
          <div className="bg-white/80 border border-[#E6E0DA] rounded-[18px] p-6 text-center">
            <div className="text-[28px] mb-2">⏳</div>
            <p className="text-[14px] font-semibold mb-1">아직 보고서가 전송되지 않았어요</p>
            <p className="text-[12px] text-[#94928b] mb-4">현재 상태: {pending.statusLabel || '처리 중'}</p>
            <button type="button" onClick={() => router.push('/mandalart')} className="text-[13px] px-4 py-2 rounded-full bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] font-bold">진행 상태 보기</button>
          </div>
        ) : (
          <article className="report-paper bg-white border border-[#E6E0DA] rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-[#F0ECE7]">
              <div className="text-[11px] tracking-[0.12em] uppercase text-[#94928b]">Personal Report</div>
              <h1 className="text-[22px] font-bold leading-tight mt-1">{report.reportTitle}</h1>
              <div className="text-[12px] text-[#94928b] mt-1">{report.name ? `${report.name}님 · ` : ''}{formatDateTime(report.sentAt)}</div>
            </div>
            <div
              className="px-5 sm:px-8 py-6 text-[15px] leading-[1.75] [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[#E6E0DA] [&_td]:p-2 [&_th]:border [&_th]:border-[#E6E0DA] [&_th]:p-2 [&_h1]:text-[20px] [&_h1]:font-bold [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:mt-6 [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:mt-4 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#BFA7FF] [&_blockquote]:pl-3 [&_blockquote]:text-[#5f5e5a]"
              // 관리자가 작성한 보고서 HTML (서버에서 script/이벤트 속성 제거됨)
              dangerouslySetInnerHTML={{ __html: report.reportHtml }}
            />
            <div className="px-5 sm:px-8 py-4 bg-[#F9F6F3] text-[11px] text-[#94928b]">
              이 보고서는 {report.name ? `${report.name}님` : '회원님'}이 입력한 만다라트를 바탕으로 작성된 개인 맞춤 분석입니다.
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

export default function MandalartReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <ReportContent />
    </Suspense>
  );
}
