'use client';

import { useSyncExternalStore } from 'react';
import { getAccessToken, getIdTokenPayload } from '@/app/utils/auth';

const subscribe = (cb) => {
  window.addEventListener('storage', cb);
  window.addEventListener('focus', cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener('focus', cb);
  };
};

/**
 * 로그인 여부. 서버 프리렌더/하이드레이션 중에는 false 였다가 클라이언트에서 토큰을 읽어 갱신
 * (프리렌더 HTML 과 첫 렌더가 달라지는 hydration 불일치를 막기 위함)
 */
export default function useAuthed() {
  return useSyncExternalStore(subscribe, () => !!getAccessToken(), () => false);
}

const noop = () => () => {};
/** 클라이언트에서 마운트된 뒤 true (프리렌더/하이드레이션 중 false) */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

const getPremium = () => {
  if (!getAccessToken()) return false;
  const groups = getIdTokenPayload()?.['cognito:groups'] || [];
  return Array.isArray(groups) && groups.includes('premium');
};
/** 프리미엄 회원 여부 (cognito:groups 에 premium). 프리렌더 중에는 false */
export function usePremium() {
  return useSyncExternalStore(subscribe, getPremium, () => false);
}
