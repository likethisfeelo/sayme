'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clearTokens, fetchWithAuth, getAccessToken, getIdTokenPayload } from '../utils/auth';

const buildMonthLabel = () => `${new Date().getMonth() + 1}월`;

const checkIsPremium = () => {
  const tokenPayload = getIdTokenPayload();
  if (!tokenPayload) return false;
  const cognitoGroups = tokenPayload['cognito:groups'] || [];
  return cognitoGroups.includes('premium');
};

export default function Header({
  title = 'Sayme · Spirit Lab',
  subtitle = '',
  showAuthButtons = false,
  showMenuButton = false,
  showMonthChip = false,
  monthLabel,
  maxWidthClass = 'max-w-[430px]',
  zIndexClass = 'z-10',
  leadingAction,
  rightSlot,
  onTitleClick,
  onMenuClick,
  menuAriaLabel = '메뉴로 이동',
  titleAriaLabel = '메인으로 이동',
}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(showAuthButtons);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (showAuthButtons) {
      checkLoginStatus();
    }
    if (showMenuButton) {
      setIsPremium(checkIsPremium());
    }
  }, [showAuthButtons, showMenuButton]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const checkLoginStatus = async () => {
    const token = getAccessToken();

    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    try {
      const response = await fetchWithAuth(
        'https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev/auth/me'
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setUserName(data.user.name || data.user.nickname || data.user.email.split('@')[0]);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    setIsLoggedIn(false);
    setUserName('');
    router.push('/login');
  };

  const handleTitleClick = () => {
    if (onTitleClick) {
      onTitleClick();
      return;
    }
    router.push('/');
  };

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
      return;
    }
    setMenuOpen(!menuOpen);
  };

  const premiumMenuItems = [
    { label: '스피릿랩', path: '/premium-home' },
    { label: '이번 달 질문', path: '/quest' },
    { label: '나의 이벤트', path: '/tickets' },
    { label: '우주의 흐름', path: '/premium-fortune' },
    { label: '나의 정보', path: '/me' },
  ];

  const trialMenuItems = [
    { label: '스피릿랩(체험)', path: '/trial-home' },
    { label: '이번달 질문', path: null, disabled: true },
    { label: '나의 이벤트', path: null, disabled: true },
    { label: '우주의 흐름', path: '/fortune' },
    { label: '나의 정보', path: '/me' },
  ];

  const menuItems = isPremium ? premiumMenuItems : trialMenuItems;

  return (
    <header
      className={`sticky top-0 ${zIndexClass} backdrop-blur-[10px] bg-[rgba(245,241,237,0.65)] border-b border-[rgba(230,224,218,0.8)]`}
    >
      <div className={`flex items-center justify-between px-4 py-3.5 ${maxWidthClass} mx-auto`}>
        <div className="flex items-center gap-2 leading-none">
          {leadingAction}
          <button type="button" onClick={handleTitleClick} className="text-left" aria-label={titleAriaLabel}>
            <div className="font-bold tracking-[0.2px] text-sm text-[rgba(191,167,255,0.95)]">
              {title}
            </div>
            {subtitle && <div className="text-xs text-[#6B6662]">{subtitle}</div>}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {showMonthChip && (
            <div className="text-xs px-2.5 py-2 rounded-full border border-[#E6E0DA] bg-white/65 text-[#2A2725]">
              이번달 · {monthLabel || buildMonthLabel()}
            </div>
          )}

          {showMenuButton && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={handleMenuClick}
                className="w-[34px] h-[34px] rounded-[10px] border border-[#E6E0DA] bg-white/65 grid place-items-center cursor-pointer"
                aria-label={menuAriaLabel}
              >
                {menuOpen ? '✕' : '☰'}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[42px] w-[200px] bg-white/95 backdrop-blur-md border border-[#E6E0DA] rounded-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden">
                  {menuItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!item.disabled && item.path) {
                          router.push(item.path);
                          setMenuOpen(false);
                        }
                      }}
                      disabled={item.disabled}
                      className={`w-full text-left px-4 py-3 text-sm border-0 transition-colors ${
                        idx < menuItems.length - 1 ? 'border-b border-[#E6E0DA]' : ''
                      } ${
                        item.disabled
                          ? 'text-[#C5BFB9] bg-transparent cursor-default'
                          : 'text-[#2A2725] bg-transparent hover:bg-[rgba(191,167,255,0.08)] cursor-pointer'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showAuthButtons && (
            <>
              {loading ? (
                <>
                  <div className="w-16 h-8 bg-white/70 animate-pulse rounded-full border border-[#E6E0DA]" />
                  <div className="w-20 h-8 bg-white/70 animate-pulse rounded-full border border-[#E6E0DA]" />
                </>
              ) : isLoggedIn ? (
                <>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-[#6B6662]">
                    <span className="font-semibold text-[#2A2725]">{userName}</span>
                    <span>님</span>
                  </div>
                  <button
                    onClick={() => router.push('/me')}
                    className="text-xs px-3 py-2 text-[#2A2725] hover:text-[rgba(191,167,255,0.95)] transition-colors font-medium"
                  >
                    MY PAGE
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-xs px-4 py-2 bg-white/70 border border-[#E6E0DA] rounded-full font-bold text-[#2A2725] transition-transform active:scale-95"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-xs px-3 py-2 text-[#2A2725] hover:text-[rgba(191,167,255,0.95)] transition-colors font-medium"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => router.push('/signup')}
                    className="text-xs px-4 py-2 bg-gradient-to-r from-[rgba(191,167,255,0.95)] to-[rgba(123,203,255,0.95)] text-[#1f1f1f] rounded-full font-bold transition-transform active:scale-95"
                  >
                    시작하기
                  </button>
                </>
              )}
            </>
          )}

          {rightSlot}
        </div>
      </div>
    </header>
  );
}
