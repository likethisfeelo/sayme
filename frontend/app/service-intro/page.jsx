'use client';

import { useRouter } from 'next/navigation';

export default function ServiceIntroPage() {
  const router = useRouter();

  const handleKakaoChat = () => {
    window.open('https://pf.kakao.com/_xjwsxfb/chat', '_blank');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-white">
      {/* Header */}
      <header className="py-6 px-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-indigo-600">Sayme</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Service Introduction Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-block text-6xl mb-4">✨</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Sayme 프리미엄 챌린지
            </h2>
            <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              10일간의 집중 자기성찰 프로그램
            </div>
          </div>

          {/* Service Description */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 mb-6">
              <p className="text-lg leading-relaxed text-gray-800 text-center">
                1:1 상담의 효과를 10일간 지속적으로<br />
                생각하며 피드백 받아볼 수 있는 서비스입니다.
              </p>
            </div>

            {/* Service Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">👥</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">총 2회의 1:1 상담 포함</h3>
                  <p className="text-sm text-gray-600">
                    전문 상담가와 함께하는 깊이 있는 대화
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">💰</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">서비스 비용: 20만원</h3>
                  <p className="text-sm text-gray-600">
                    약속한 기간 내 완주 시 <span className="font-semibold text-indigo-600">10만원 환급</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">🎯</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">소규모 프리미엄 서비스</h3>
                  <p className="text-sm text-gray-600">
                    자세한 서비스 소개는 1:1 채팅으로 문의해주세요
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={handleKakaoChat}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              1:1 상담 문의하기 💬
            </button>
            <p className="text-sm text-gray-500 mt-4">
              카카오톡 채널로 연결됩니다
            </p>
          </div>
        </div>

        {/* Additional Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">📅</div>
            <h4 className="font-semibold text-gray-800 mb-2">10일 프로그램</h4>
            <p className="text-sm text-gray-600">체계적인 일정 관리</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">💭</div>
            <h4 className="font-semibold text-gray-800 mb-2">맞춤형 질문</h4>
            <p className="text-sm text-gray-600">개인화된 성찰 가이드</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">📊</div>
            <h4 className="font-semibold text-gray-800 mb-2">지속적 피드백</h4>
            <p className="text-sm text-gray-600">성장 과정 모니터링</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 mt-16">
        <div className="max-w-2xl mx-auto text-center text-sm text-gray-500">
          <p>© 2024 Sayme. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}