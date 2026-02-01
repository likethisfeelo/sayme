'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    username: ''
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

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.passwordConfirm || !formData.username) {
      setError('모든 필드를 입력해주세요.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return false;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/;
    if (!passwordRegex.test(formData.password)) {
      setError('비밀번호는 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.');
      return false;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            username: formData.username
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      router.push(`/confirm?email=${encodeURIComponent(formData.email)}`);

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
            <h1 className="text-3xl font-bold text-[#2A2725] mb-2">회원가입</h1>
            <p className="text-[#6B6662]">자기성찰 여정을 시작해보세요</p>
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
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#6B6662] mb-2">
                이름
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E6E0DA] rounded-lg bg-white/80 text-[#2A2725] focus:ring-2 focus:ring-[rgba(191,167,255,0.55)] focus:border-transparent"
                placeholder="홍길동"
                disabled={loading}
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
                placeholder="8자 이상 (대소문자, 숫자, 특수문자 포함)"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-[#8A8681]">
                영문 대소문자, 숫자, 특수문자를 포함한 8자 이상
              </p>
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-[#6B6662] mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E6E0DA] rounded-lg bg-white/80 text-[#2A2725] focus:ring-2 focus:ring-[rgba(191,167,255,0.55)] focus:border-transparent"
                placeholder="비밀번호를 다시 입력하세요"
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
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B6662]">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-[rgba(191,167,255,0.95)] hover:text-[rgba(123,203,255,0.95)] font-semibold"
              >
                로그인
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-[#8A8681]">
          <p>회원가입 시 이메일로 인증 코드가 발송됩니다</p>
        </div>
      </main>
    </div>
  );
}
