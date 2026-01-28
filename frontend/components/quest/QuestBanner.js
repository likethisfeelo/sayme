'use client';

import { useRouter } from 'next/navigation';

export default function QuestBanner({ quest, index, onComplete }) {
  const router = useRouter();
  const { content, progress } = quest;

  const getStatusInfo = () => {
    switch (progress.status) {
      case 'completed':
        return {
          icon: '✅',
          text: '완료',
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-700',
          buttonText: '다시보기',
          buttonClass: 'bg-green-500 hover:bg-green-600 text-white'
        };
      case 'in_progress':
        return {
          icon: '🔵',
          text: `진행중 (${progress.currentStep}/${progress.totalSteps})`,
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-700',
          buttonText: '계속하기',
          buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white'
        };
      default:
        return {
          icon: '⚪',
          text: '시작하기',
          color: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-700',
          buttonText: '시작하기',
          buttonClass: 'bg-indigo-500 hover:bg-indigo-600 text-white'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleClick = () => {
    router.push(`/quest/detail?id=${quest.assignmentId}`);
  };

  return (
    <div 
      className={`${statusInfo.color} border-2 rounded-2xl p-5 transition-all hover:shadow-md cursor-pointer`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-500">Quest #{index + 1}</span>
            <span className="text-lg">{statusInfo.icon}</span>
            <span className={`text-sm font-medium ${statusInfo.textColor}`}>
              {statusInfo.text}
            </span>
          </div>
          <h3 className="text-lg font-bold mb-1">{content.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{content.description}</p>
          
          <div className="flex gap-3 text-xs text-gray-500">
            <span>⏱️ {content.metadata?.estimatedTime || '10분'}</span>
            <span>📊 {progress.totalSteps}단계</span>
          </div>
        </div>
      </div>

      <button
        className={`w-full mt-3 px-4 py-2 rounded-lg font-medium transition ${statusInfo.buttonClass}`}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {statusInfo.buttonText} →
      </button>
    </div>
  );
}