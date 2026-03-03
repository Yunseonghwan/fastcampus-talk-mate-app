import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { isSessionExpired, useSessionStore } from '@/stores/session-store';

type UseSessionReturn = {
  isInitialized: boolean;
  hasValidSession: boolean;
  refreshSession: () => Promise<void>;
};

export function useSession(): UseSessionReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionTimestamp = useSessionStore((s) => s.sessionTimestamp);
  const refreshSession = useSessionStore((s) => s.refreshSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  const hasValidSession =
    sessionTimestamp !== null && !isSessionExpired(sessionTimestamp);

  useEffect(() => {
    if (useSessionStore.persist.hasHydrated()) {
      setIsInitialized(true);
      return;
    }
    const unsub = useSessionStore.persist.onFinishHydration(() => {
      setIsInitialized(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState !== 'active') return;
        if (!useSessionStore.getState().isSessionValid()) {
          clearSession();
          router.replace('/');
        }
      }
    );
    return () => subscription.remove();
  }, [clearSession]);

  const refresh = useCallback(async (): Promise<void> => {
    await refreshSession();
  }, [refreshSession]);

  return {
    isInitialized,
    hasValidSession,
    refreshSession: refresh,
  };
}
