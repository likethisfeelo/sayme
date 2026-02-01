'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTokens } from '../utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      if (data.tokens) {
        saveTokens(data.tokens);
        localStorage.setItem('userEmail', formData.email);
      }

      alert('로그인 성공!');
      router.push('/');  // 루트로 이동 → 프리미엄 여부에 따라 자동 리다이렉트

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Pretendard", "Noto Sans KR", Segoe UI, Roboto, Arial, sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% -10%, rgba(191,167,255,.30), transparent 60%), radial-gradient(1200px 800px at 0% 40%, rgba(123,203,255,.22), transparent 60%), radial-gradient(1200px 800px at 100% 55%, rgba(255,193,217,.20), transparent 60%), #F5F1ED',
        color: '#2A2725',
      }}
    >
      <header className="py-6 px-4 border-b border-[rgba(230,224,218,0.8)] bg-[rgba(245,241,237,0.7)] backdrop-blur-sm">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.push('/')}
            className="text-[rgba(191,167,255,0.95)] hover:text-[rgba(123,203,255,0.95)] font-semibold"
          >
            ← Sayme
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white/75 rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.08)] p-8 border border-[#E6E0DA] backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#2A2725] mb-2">로그인</h1>
            <p className="text-[#6B6662]">자기성찰 여정을 이어가세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#6B6662] mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E6E0DA] rounded-lg bg-white/80 text-[#2A2725] focus:ring-2 focus:ring-[rgba(191,167,255,0.55)] focus:border-transparent"
                placeholder="your@email.com"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#6B6662] mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E6E0DA] rounded-lg bg-white/80 text-[#2A2725] focus:ring-2 focus:ring-[rgba(191,167,255,0.55)] focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-[rgba(255,230,230,0.7)] border border-[rgba(255,178,178,0.9)] text-[#B45353] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-lg font-semibold transition-all hover:shadow-[0_10px_24px_rgba(123,203,255,0.25)] disabled:bg-[#D7D2CE] disabled:text-[#9B958F] disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B6662]">
              아직 계정이 없으신가요?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-[rgba(191,167,255,0.95)] hover:text-[rgba(123,203,255,0.95)] font-semibold"
              >
                회원가입
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/forgot-password')}
              className="text-sm text-[#8A8681] hover:text-[#2A2725]"
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#6B6662] mb-3">
            먼저 체험해보고 싶으신가요?
          </p>
          <button
            onClick={() => router.push('/fortune')}
            className="text-[rgba(191,167,255,0.95)] hover:text-[rgba(123,203,255,0.95)] font-semibold"
          >
            오늘의 운세 보기 →
          </button>
        </div>
      </main>
    </div>
  );
}
