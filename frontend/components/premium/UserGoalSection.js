'use client';

export default function UserGoalSection({ goal }) {
  // goal 데이터 구조: { keyword: string, direction: string }
  
  const sampleGoal = goal || {
    keyword: '명료함',
    direction: '흐트러진 생각을 정리하는',
    sentence3: '차분하게 선택하는',
  };

  return (
    <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(123,203,255,0.18)] to-[rgba(255,193,217,0.16)] bg-white/70 backdrop-blur-sm border border-[rgba(230,224,218,0.85)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
      <div className="p-4">
        <div className="text-xs tracking-[0.12em] text-[#6B6662] uppercase mb-2.5">
          Today Alignment
        </div>

        <div className="flex flex-col gap-2.5 mb-3.5">
          <div className="text-base leading-[1.45] tracking-tight">
            당신은 오늘 <span className="inline-block px-0.5 border-b border-dashed border-[rgba(42,39,37,0.35)] min-w-[120px] text-[rgba(42,39,37,0.9)] font-[650]">{sampleGoal.keyword}</span>을 향해 가고 있는 사람입니다.
          </div>
          <div className="text-base leading-[1.45] tracking-tight">
            오늘, 당신의 방향은 <span className="inline-block px-0.5 border-b border-dashed border-[rgba(42,39,37,0.35)] min-w-[120px] text-[rgba(42,39,37,0.9)] font-[650]">{sampleGoal.direction}</span> 입니다.
          </div>
          {sampleGoal.sentence3 && (
            <div className="text-base leading-[1.45] tracking-tight">
              오늘 당신은 <span className="inline-block px-0.5 border-b border-dashed border-[rgba(42,39,37,0.35)] min-w-[120px] text-[rgba(42,39,37,0.9)] font-[650]">{sampleGoal.sentence3}</span> 사람입니다.
            </div>
          )}
        </div>

        <div className="text-xs text-[#6B6662] leading-relaxed mb-3">
          * 이 문장은 1:1 상담에서 설정한 목표(키워드)와 연결됩니다. 예언이 아니라, 오늘의 태도를 정렬합니다.
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={() => window.location.href = '/monthly-questions'}
            className="flex-1 appearance-none border-0 cursor-pointer rounded-[14px] px-3.5 py-3 font-[650] text-sm tracking-tight inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] text-[#1f1f1f] bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] shadow-[0_10px_22px_rgba(123,203,255,0.18)]"
          >
            질문과 함께 생각하기 →
          </button>
          <button 
            className="w-11 appearance-none border-0 cursor-pointer rounded-[14px] px-3.5 py-3 bg-white/75 border border-[#E6E0DA] text-[#2A2725] transition-transform active:scale-[0.98]"
            title="오늘의 문장 새로고침"
            onClick={() => window.location.reload()}
          >
            ⟲
          </button>
        </div>
      </div>
    </section>
  );
}