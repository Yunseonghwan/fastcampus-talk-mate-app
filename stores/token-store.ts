import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const TOKEN_STORAGE_KEY = "talk_mate_tokens";
const DEFAULT_TOKENS = 0;
const SUBSCRIPTION_DURATION_MS = 10 * 60 * 1000;

type PersistedTokenState = {
  tokens: number;
  isSubscribed: boolean;
  subscriptionExpiresAt: number | null;
};

type TokenState = PersistedTokenState & {
  saveTokens: (amount: number) => void;
  useTokens: (amount: number) => boolean;
  subscribe: () => void;
  checkSubscription: () => boolean;
  syncSubscription: (
    isSubscribed: boolean,
    expiresAt: number | null,
  ) => void;
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
      isSubscribed: false,
      subscriptionExpiresAt: null,

      saveTokens: (amount: number): void => {
        set((state) => ({ tokens: state.tokens + amount }));
      },

      useTokens: (amount: number): boolean => {
        const { tokens } = get();
        if (tokens < amount) return false;
        set({ tokens: tokens - amount });
        return true;
      },

      subscribe: (): void => {
        const expiresAt = Date.now() + SUBSCRIPTION_DURATION_MS;
        set({ isSubscribed: true, subscriptionExpiresAt: expiresAt });
      },

      checkSubscription: (): boolean => {
        const { isSubscribed, subscriptionExpiresAt } = get();
        if (!isSubscribed || !subscriptionExpiresAt) return false;

        if (Date.now() >= subscriptionExpiresAt) {
          set({
            isSubscribed: false,
            subscriptionExpiresAt: null,
          });
          return false;
        }
        return true;
      },

      syncSubscription: (
        isSubscribed: boolean,
        expiresAt: number | null,
      ): void => {
        set({ isSubscribed, subscriptionExpiresAt: expiresAt });
      },
    }),
    {
      name: TOKEN_STORAGE_KEY,
      storage: createJSONStorage<PersistedTokenState>(() => secureStorage),
      partialize: (state) => ({
        tokens: state.tokens,
        isSubscribed: state.isSubscribed,
        subscriptionExpiresAt: state.subscriptionExpiresAt,
      }),
    },
  ),
);
