'use client';

import { useEffect } from 'react';
import { getAccessToken, getRefreshToken, isSessionStale, refreshSession } from '@/app/utils/auth';

const RELOAD_FLAG = 'sayme-session-reloaded';

/**
 * 앱 전역 세션 유지
 *  - 페이지 로드 시 토큰이 만료(임박)됐으면 리프레시 토큰으로 갱신
 *    · 이미 만료된 상태였다면 다른 화면이 옛 토큰으로 호출하지 않도록 한 번 새로고침
 *  - 이후 5분마다 확인해 만료 전에 미리 갱신
 *  - 탭이 다시 활성화될 때도 확인
 */
export default function SessionKeeper() {
  useEffect(() => {
    let timer = null;
    const check = async ({ allowReload = false } = {}) => {
      if (!getAccessToken() || !getRefreshToken()) return;
      if (!isSessionStale()) return;
      const wasExpired = (() => {
        try {
          const payload = JSON.parse(atob((localStorage.getItem('idToken') || '').split('.')[1] || ''));
          return payload?.exp ? payload.exp * 1000 <= Date.now() : false;
        } catch {
          return false;
        }
      })();
      const ok = await refreshSession();
      if (ok && wasExpired && allowReload) {
        try {
          if (sessionStorage.getItem(RELOAD_FLAG) !== '1') {
            sessionStorage.setItem(RELOAD_FLAG, '1');
            window.location.reload();
            return;
          }
        } catch {
          /* ignore */
        }
      }
      if (ok) {
        try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* ignore */ }
      }
    };

    check({ allowReload: true });
    timer = setInterval(() => check(), 5 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
