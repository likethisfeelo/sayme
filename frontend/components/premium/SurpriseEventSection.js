'use client';

export default function SurpriseEventSection({ events = [] }) {
  if (!events || events.length === 0) return null;

  const event = events[0];
  
  const sampleEvent = event || {
    title: '오늘의 깜짝 이벤트 🎁',
    description: '무료 타로 질문 1회가 도착했습니다.',
    eventUrl: '/events/free-tarot',
    isNew: true,
  };

  return (
    <section className="bg-gradient-to-br from-[rgba(191,167,255,0.22)] via-[rgba(255,193,217,0.18)] to-[rgba(123,203,255,0.15)] bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <strong className="text-sm tracking-tight text-[#2A2725] block mb-1.5">
              {sampleEvent.title}
            </strong>
            <p className="text-xs text-[#6B6662] leading-relaxed m-0">
              {sampleEvent.description}
            </p>
          </div>
          
          {sampleEvent.isNew && (
            <div className="flex-shrink-0 text-xs px-2.5 py-2 rounded-full border border-[#E6E0DA] bg-white/65 text-[#2A2725]">
              NEW
            </div>
          )}
        </div>

        <button
          onClick={() => window.location.href = sampleEvent.eventUrl}
          className="w-full mt-3 rounded-[14px] px-3 py-3 border-0 font-[750] cursor-pointer bg-[rgba(42,39,37,0.92)] text-[rgba(245,241,237,0.98)] text-sm transition-transform active:scale-[0.98]"
        >
          이벤트 열기 →
        </button>

        <p className="text-xs leading-relaxed text-[#6B6662] mt-2.5 m-0">
          * 이벤트는 관리자가 개인별로 배포합니다. 쿠폰/선물처럼 "도착"합니다.
        </p>
      </div>
    </section>
  );
}
