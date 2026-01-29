'use client';

export default function MonthlyQuestionsList({ questions = [], month = '2월' }) {
  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        dot: 'bg-[rgba(46,139,87,0.85)] border-[rgba(46,139,87,0.35)]',
        badge: 'text-[rgba(46,139,87,0.95)] border-[rgba(46,139,87,0.25)]',
        label: '답변 완료',
      },
      progress: {
        dot: 'bg-[rgba(191,167,255,0.95)] border-[rgba(191,167,255,0.35)]',
        badge: 'text-[rgba(123,203,255,0.95)] border-[rgba(123,203,255,0.25)]',
        label: '진행 중',
      },
      waiting: {
        dot: 'bg-white/90 border-[rgba(42,39,37,0.18)]',
        badge: 'text-[#6B6662] border-[#E6E0DA]',
        label: '대기',
      },
    };
    return configs[status];
  };

  // Sample data if none provided
  const sampleQuestions = questions.length > 0 ? questions : [
    {
      id: 1,
      number: 'Q1',
      title: '지금 내가 지키고 싶은 '기준'은 무엇인가?',
      status: 'completed',
      hasFeedback: true,
    },
    {
      id: 2,
      number: 'Q2',
      title: '내가 계속 미루는 결정은 무엇이고, 왜 미루는가?',
      status: 'progress',
      hasFeedback: false,
    },
    {
      id: 3,
      number: 'Q3',
      title: '이번 달, 나에게 가장 필요한 '경계선'은 어디인가?',
      status: 'waiting',
      hasFeedback: false,
    },
  ];

  return (
    <section className="bg-white/70 backdrop-blur-sm border border-[#E6E0DA] shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-[18px] overflow-hidden">
      <div className="flex items-end justify-between px-4 py-3.5 border-b border-[#E6E0DA] bg-white/55">
        <div>
          <div className="text-sm font-[750] tracking-tight text-[#2A2725]">이번 달의 생각할 거리</div>
          <div className="text-xs text-[#6B6662]">최대 10개 · 일반적으로 7개</div>
        </div>
        <div className="text-xs text-[#6B6662]">{month}</div>
      </div>

      <div className="flex flex-col p-2.5 pb-3 gap-2">
        {sampleQuestions.map((q) => {
          const config = getStatusConfig(q.status);
          return (
            <div key={q.id} className="bg-white/75 border border-[rgba(230,224,218,0.9)] rounded-[14px] p-3 flex gap-2.5 items-start">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border ${config.dot}`} />
              
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#6B6662]">
                  <span className={`text-[11px] px-2 py-1 rounded-full border ${config.badge}`}>
                    {config.label}
                  </span>
                  <span>{q.number}</span>
                </div>

                <div className="text-sm font-[680] leading-[1.35] tracking-tight whitespace-normal break-keep">
                  {q.title}
                </div>

                <div className="flex gap-2 mt-0.5">
                  {q.status === 'completed' && (
                    <>
                      <button className="text-xs border border-[#E6E0DA] bg-white/80 text-[#2A2725] px-2.5 py-1.5 rounded-xl cursor-pointer">
                        답변 보기
                      </button>
                      {q.hasFeedback && (
                        <button className="text-xs border border-[#E6E0DA] bg-white/80 text-[#2A2725] px-2.5 py-1.5 rounded-xl cursor-pointer">
                          피드백
                        </button>
                      )}
                    </>
                  )}
                  {q.status === 'progress' && (
                    <>
                      <button className="text-xs bg-[rgba(42,39,37,0.92)] border-[rgba(42,39,37,0.10)] text-[rgba(245,241,237,0.98)] px-2.5 py-1.5 rounded-xl cursor-pointer">
                        계속 생각하기 →
                      </button>
                      <button className="text-xs border border-[#E6E0DA] bg-white/80 text-[#2A2725] px-2.5 py-1.5 rounded-xl cursor-pointer">
                        메모
                      </button>
                    </>
                  )}
                  {q.status === 'waiting' && (
                    <button className="text-xs bg-[rgba(42,39,37,0.92)] border-[rgba(42,39,37,0.10)] text-[rgba(245,241,237,0.98)] px-2.5 py-1.5 rounded-xl cursor-pointer">
                      열기
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}