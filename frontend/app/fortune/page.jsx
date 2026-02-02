'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

export default function FortunePage() {
  const router = useRouter();
  const [fortune, setFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFortune();
  }, []);

  const fetchFortune = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/public/fortune'
      );

      if (!response.ok) {
        throw new Error('운세를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setFortune(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    router.push('/service-intro');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">오늘의 운세를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchFortune}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-white">
      <Header subtitle="오늘의 운세" maxWidthClass="max-w-2xl" />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Date Display */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Fortune Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="inline-block text-6xl">
              {fortune?.category === 'reflection' && '🌙'}
              {fortune?.category === 'gratitude' && '🙏'}
              {fortune?.category === 'growth' && '🌱'}
            </div>
          </div>

          {/* Category Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              {fortune?.category === 'reflection' && '성찰의 시간'}
              {fortune?.category === 'gratitude' && '감사의 시간'}
              {fortune?.category === 'growth' && '성장의 시간'}
            </span>
          </div>

          {/* Fortune Text */}
          <div className="mb-8">
            <p className="text-lg leading-relaxed text-gray-800 text-center">
              {fortune?.fortuneText}
            </p>
          </div>

          {/* Question */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💭</div>
              <div>
                <h3 className="text-sm font-semibold text-indigo-900 mb-2">
                  오늘의 질문
                </h3>
                <p className="text-base text-gray-800">
                  {fortune?.questionPrompt}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">
            본격적인 자기성찰을 시작해보세요
          </h2>
          <p className="text-indigo-100 mb-6 leading-relaxed">
            10일간 깊이 있는 질문으로<br />
            한 달을 더욱 의미있게 마무리하는 프리미엄 챌린지
          </p>
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
          >
            서비스 알아보기 →
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">✨</div>
            <h4 className="font-semibold text-gray-800 mb-1">맞춤형 질문</h4>
            <p className="text-sm text-gray-600">15분 상담으로 나만의 질문 설계</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="font-semibold text-gray-800 mb-1">10만원 환급</h4>
            <p className="text-sm text-gray-600">정시 완주 시 전액 환급</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📄</div>
            <h4 className="font-semibold text-gray-800 mb-1">PDF 결산</h4>
            <p className="text-sm text-gray-600">나만의 성찰 리포트</p>
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