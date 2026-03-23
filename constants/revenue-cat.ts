import { Platform } from "react-native";

export const REVENUE_CAT_API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY,
  }) ?? "";

export const OFFERING_ID = "talkmatepay";

export const ENTITLEMENT_IDS = {
  TOKENS_5: "5토큰",
  TOKENS_10: "10토큰",
  TOKENS_20: "20토큰",
} as const;

export const ENTITLEMENT_TOKEN_MAP: Record<string, number> = {
  [ENTITLEMENT_IDS.TOKENS_5]: 5,
  [ENTITLEMENT_IDS.TOKENS_10]: 10,
  [ENTITLEMENT_IDS.TOKENS_20]: 20,
};

export const TOKEN_AMOUNTS = [5, 10, 20] as const;
