import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import {
  ENTITLEMENT_TOKEN_MAP,
  OFFERING_ID,
  REVENUE_CAT_API_KEY,
} from "@/constants/revenue-cat";
import { useTokenStore } from "@/stores/token-store";

let _initialized = false;

export async function initializeRevenueCat(): Promise<void> {
  if (_initialized) return;

  try {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    await Purchases.configure({ apiKey: REVENUE_CAT_API_KEY });
    _initialized = true;
  } catch (error) {
    console.error("[RevenueCat] Initialization failed:", error);
  }
}

export function useRevenueCat() {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const alive = useRef(true);

  const saveTokens = useTokenStore((s) => s.saveTokens);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!_initialized) {
      if (alive.current) setIsLoading(false);
      return;
    }

    try {
      if (alive.current) setIsLoading(true);

      const offerings = await Purchases.getOfferings();

      if (!alive.current) return;

      const targetOffering = offerings.all[OFFERING_ID] ?? null;
      setOffering(targetOffering);
    } catch (error) {
      console.warn("[RevenueCat] Failed to load data:", error);
    } finally {
      if (alive.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const findPackageForTokens = useCallback(
    (amount: number): PurchasesPackage | null => {
      if (!offering?.availablePackages) return null;

      const entitlementId = Object.entries(ENTITLEMENT_TOKEN_MAP).find(
        ([, tokens]) => tokens === amount,
      )?.[0];

      if (!entitlementId) return null;

      return (
        offering.availablePackages.find(
          (pkg) => pkg.identifier === entitlementId,
        ) ?? offering.availablePackages.find(
          (pkg) => pkg.product.identifier.includes(String(amount)),
        ) ?? null
      );
    },
    [offering],
  );

  const purchaseTokens = useCallback(
    async (amount: number): Promise<boolean> => {
      const pkg = findPackageForTokens(amount);
      if (!pkg) {
        Alert.alert(
          "오류",
          "상품 정보를 불러올 수 없습니다.\nRevenueCat 대시보드 설정을 확인해주세요.",
        );
        return false;
      }

      try {
        setIsPurchasing(true);
        await Purchases.purchasePackage(pkg);
        saveTokens(amount);
        return true;
      } catch (error: any) {
        if (!error.userCancelled) {
          Alert.alert(
            "결제 오류",
            error.message ?? "결제 처리 중 오류가 발생했습니다.",
          );
        }
        return false;
      } finally {
        if (alive.current) setIsPurchasing(false);
      }
    },
    [findPackageForTokens, saveTokens],
  );

  const restorePurchases = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await Purchases.restorePurchases();
      Alert.alert("복원 결과", "복원할 구매 항목이 없습니다.");
    } catch (error: any) {
      Alert.alert(
        "복원 오류",
        error.message ?? "구매 복원 중 오류가 발생했습니다.",
      );
    } finally {
      if (alive.current) setIsLoading(false);
    }
  }, []);

  const getPackagePrice = useCallback(
    (amount: number): string | null => {
      const pkg = findPackageForTokens(amount);
      return pkg?.product.priceString ?? null;
    },
    [findPackageForTokens],
  );

  return {
    offering,
    isLoading,
    isPurchasing,
    purchaseTokens,
    restorePurchases,
    getPackagePrice,
    refresh: loadData,
  };
}
