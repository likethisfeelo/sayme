'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { analysisUserApi } from '@/lib/api/analysis';
import { emptyDraft, loadDraft, saveDraft, clearDraft, fromServerDraft, newerDraft, toServerDraft } from '@/lib/mandalart';

/**
 * 만다라트 임시저장 훅
 *  - 로컬(localStorage)과 서버 임시저장 중 더 최근 것을 사용
 *  - 변경 시 로컬에 자동 저장(디바운스), persist() 로 서버에 저장
 */
export default function useDraft({ enabled = true } = {}) {
  const [draft, setDraftState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      const local = loadDraft();
      let server = null;
      try {
        const data = await analysisUserApi.getDraft();
        server = fromServerDraft(data.draft);
        if (server) setLastSyncedAt(server.updatedAt);
      } catch (err) {
        if (err.status === 401) {
          if (!cancelled) setSyncError('401');
        } else {
          console.warn('draft load failed:', err.message);
        }
      }
      if (cancelled) return;
      const chosen = newerDraft(local, server) || emptyDraft();
      setDraftState(chosen);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [enabled]);

  const setDraft = useCallback((updater) => {
    setDraftState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const stamped = { ...next, updatedAt: new Date().toISOString() };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => saveDraft(stamped), 200);
      return stamped;
    });
  }, []);

  /** 서버에 저장 (현재 상태 기준). 실패해도 로컬에는 남음 */
  const persist = useCallback(async (override) => {
    const current = override || draft;
    if (!current) return false;
    try {
      setSyncing(true);
      setSyncError('');
      saveDraft(current);
      const data = await analysisUserApi.saveDraft(toServerDraft(current));
      setLastSyncedAt(data.draft?.updatedAt || new Date().toISOString());
      return true;
    } catch (err) {
      setSyncError(err.status === 401 ? '401' : err.message || '서버 저장에 실패했어요. 내용은 이 브라우저에 보관됩니다.');
      return false;
    } finally {
      setSyncing(false);
    }
  }, [draft]);

  const reset = useCallback(async () => {
    clearDraft();
    setDraftState(emptyDraft());
    try {
      await analysisUserApi.deleteDraft();
    } catch {
      /* ignore */
    }
  }, []);

  return { draft, setDraft, loading, persist, syncing, syncError, lastSyncedAt, reset };
}
