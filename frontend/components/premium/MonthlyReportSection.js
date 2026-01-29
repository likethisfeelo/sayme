'use client';

import { useState } from 'react';

export default function MonthlyReportSection({ report }) {
  const [enabled, setEnabled] = useState(report?.available || false);

  return (
    <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
      <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
        <div>
          <div className="text-sm font-[750] tracking-tight text-[#2A2725]">이번 달 분석 리포트</div>
          <div className="text-xs text-[#6B6662]">관리자 업로드 후 활성화</div>
        </div>
        <div className="text-xs text-[#6B6662]">PDF</div>
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        <div className={`p-3.5 rounded-[14px] border border-[rgba(230,224,218,0.9)] bg-white/70 flex gap-3 items-start ${!enabled ? 'opacity-60' : ''}`}>
          <div className="w-[34px] h-[34px] rounded-xl bg-[rgba(191,167,255,0.22)] border border-[rgba(191,167,255,0.20)] grid place-items-center flex-shrink-0">
            🗂️
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-[750] text-sm m-0 mb-1">
              {enabled ? '이번 달 리포트가 준비되었습니다' : '아직 준비 중입니다'}
            </p>
            <p className="text-xs text-[#6B6662] m-0 leading-relaxed">
              질문과 기록이 충분히 쌓이면 리포트가 열립니다.<br/>
              결과는 '정답'이 아니라, 당신의 선택 기준을 남기는 문서입니다.
            </p>
          </div>
        </div>

        <button 
          disabled={!enabled}
          onClick={() => enabled && window.open(report?.url, '_blank')}
          className={`w-full px-3 py-3 rounded-[14px] border font-bold text-sm ${
            enabled 
              ? 'bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] border-transparent text-[rgba(31,31,31,0.95)] cursor-pointer' 
              : 'border-[rgba(230,224,218,0.9)] bg-white/65 text-[rgba(42,39,37,0.65)]'
          }`}
        >
          {enabled ? '리포트 열기 →' : '리포트가 업로드되면 여기가 활성화됩니다'}
        </button>
      </div>
    </section>
  );
}