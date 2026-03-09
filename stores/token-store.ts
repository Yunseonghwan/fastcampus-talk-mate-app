import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const TOKEN_STORAGE_KEY = 'talk_mate_tokens';
const DEFAULT_TOKENS = 100;

type PersistedTokenState = {
  tokens: number;
};

type TokenState = PersistedTokenState & {
  saveTokens: (amount: number) => void;
  useTokens: (amount: number) => boolean;
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

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: DEFAULT_TOKENS,

      saveTokens: (amount: number): void => {
        set((state) => ({ tokens: state.tokens + amount }));
      },

      useTokens: (amount: number): boolean => {
        const { tokens } = get();
        if (tokens < amount) return false;
        set({ tokens: tokens - amount });
        return true;
      },
    }),
    {
      name: TOKEN_STORAGE_KEY,
      storage: createJSONStorage<PersistedTokenState>(() => secureStorage),
      partialize: (state) => ({
        tokens: state.tokens,
      }),
    }
  )
);
