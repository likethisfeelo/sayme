'use client';

export default function TodayFlowSection({ fortune }) {
  const sampleData = fortune || {
    flow: '오늘은 속도를 내기보다 리듬을 회복하는 날입니다.\n작은 선택 하나에 에너지를 과하게 쓰지 않아도 됩니다.',
    luck: {
      keyword: '정리, 미세한 선택, 한 번의 거절',
      place: '조용한 책상, 창가, 물 근처',
      avoid: '즉답을 요구하는 대화',
    },
  };

  return (
    <>
      {/* 오늘의 흐름 */}
      <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
        <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
          <div>
            <div className="text-sm font-[750] tracking-tight text-[#2A2725]">오늘의 흐름</div>
            <div className="text-xs text-[#6B6662]">짧게 소개 · 여백을 남깁니다</div>
          </div>
          <div className="text-xs text-[#6B6662]">D-0</div>
        </div>
        
        <div className="px-4 py-3.5 flex flex-col gap-2">
          <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0 whitespace-pre-line">
            {sampleData.flow}
          </p>
          <div className="h-px bg-[#E6E0DA] my-1.5" />
          <p className="text-xs text-[#6B6662] m-0">* "자세히 보기" 없이, 오늘의 방향만 제시합니다.</p>
        </div>
      </section>

      {/* 오늘의 행운 */}
      <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
        <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
          <div>
            <div className="text-sm font-[750] tracking-tight text-[#2A2725]">오늘의 행운</div>
            <div className="text-xs text-[#6B6662]">가벼운 힌트</div>
          </div>
          <div className="text-xs">🍀</div>
        </div>
        
        <div className="px-4 py-3.5 flex flex-col gap-2">
          <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0">
            <b>행운 키워드:</b> {sampleData.luck.keyword}
          </p>
          <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0">
            <b>좋은 장소:</b> {sampleData.luck.place}
          </p>
          <p className="text-[13px] leading-[1.65] text-[rgba(42,39,37,0.92)] tracking-tight m-0">
            <b>피하면 좋은 것:</b> {sampleData.luck.avoid}
          </p>
        </div>
      </section>
    </>
  );
}