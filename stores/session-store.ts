import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const SESSION_STORAGE_KEY = 'talk_mate_session';
const SESSION_DURATION_MS = 10 * 60 * 1000; // 10분

type PersistedSessionState = {
  sessionTimestamp: number | null;
};

type SessionState = PersistedSessionState & {
  refreshSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  isSessionValid: () => boolean;
};

export const isSessionExpired = (timestamp: number): boolean => {
  return Date.now() > timestamp + SESSION_DURATION_MS;
};

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionTimestamp: null,

      refreshSession: async (): Promise<void> => {
        const timestamp = Date.now();
        set({ sessionTimestamp: timestamp });
      },

      clearSession: async (): Promise<void> => {
        set({ sessionTimestamp: null });
      },

      isSessionValid: (): boolean => {
        const { sessionTimestamp } = get();
        if (sessionTimestamp === null) return false;
        return !isSessionExpired(sessionTimestamp);
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage<PersistedSessionState>(() => secureStorage),
      partialize: (state) => ({
        sessionTimestamp: state.sessionTimestamp,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedSessionState | undefined;
        if (!persisted?.sessionTimestamp) {
          return { ...currentState, sessionTimestamp: null };
        }
        if (isSessionExpired(persisted.sessionTimestamp)) {
          return { ...currentState, sessionTimestamp: null };
        }
        return {
          ...currentState,
          sessionTimestamp: persisted.sessionTimestamp,
        };
      },
    }
  )
);
