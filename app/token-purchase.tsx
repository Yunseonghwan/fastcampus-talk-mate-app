import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { useTokenStore } from "@/stores/token-store";

type Selection = { kind: "subscription" } | { kind: "token"; amount: number };

const TOKEN_OPTIONS = [5, 10, 20, 100, 500] as const;
const PRICE_PER_TOKEN = 10;
const SUBSCRIPTION_PRICE = 10_000;

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = 20;
const COLUMN_GAP = 8;
const COLUMNS = 3;
const CARD_WIDTH =
  (SCREEN_WIDTH - CONTENT_PADDING * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS;

const formatWon = (amount: number) => `₩${amount.toLocaleString()}`;

const TokenPurchaseScreen = () => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const { authenticate, isLoading } = useBiometricAuth();
  const saveTokens = useTokenStore((s) => s.saveTokens);
  const subscribe = useTokenStore((s) => s.subscribe);

  const isSubSelected = selection?.kind === "subscription";
  const selectedTokenAmount =
    selection?.kind === "token" ? selection.amount : null;

  const totalPrice = (() => {
    if (!selection) return 0;
    if (selection.kind === "subscription") return SUBSCRIPTION_PRICE;
    return selection.amount * PRICE_PER_TOKEN;
  })();

  const handlePurchase = async () => {
    if (!selection) {
      Alert.alert("선택 필요", "구독 또는 토큰을 선택해주세요.");
      return;
    }

    const success = await authenticate("결제를 위해 인증해주세요");
    if (!success) return;

    if (selection.kind === "subscription") {
      subscribe();
      Alert.alert("결제 완료", "연간 구독이 활성화되었습니다.", [
        { text: "확인", onPress: () => router.replace("/landing") },
      ]);
    } else {
      saveTokens(selection.amount);
      Alert.alert("결제 완료", `${selection.amount} 토큰이 추가되었습니다.`, [
        { text: "확인", onPress: () => router.replace("/landing") },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#11181C" />
        </Pressable>
        <Text style={styles.title}>토큰 구매</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Annual Subscription */}
        <Pressable
          style={[styles.subBox, isSubSelected && styles.selectedBox]}
          onPress={() => setSelection({ kind: "subscription" })}
        >
          <View style={styles.subBadge}>
            <MaterialIcons name="workspace-premium" size={16} color="#fff" />
            <Text style={styles.subBadgeText}>BEST</Text>
          </View>

          <View style={styles.subHeader}>
            <MaterialIcons
              name="star"
              size={28}
              color={isSubSelected ? "#007AFF" : "#FFB800"}
            />
            <Text
              style={[styles.subTitle, isSubSelected && styles.selectedText]}
            >
              연간 구독
            </Text>
          </View>

          <Text style={styles.subDesc}>모든 기능을 무제한으로 이용하세요</Text>

          <View style={styles.subPriceRow}>
            <Text
              style={[styles.subPrice, isSubSelected && styles.selectedText]}
            >
              {formatWon(SUBSCRIPTION_PRICE)}
            </Text>
            <Text style={styles.subPeriod}> / 년</Text>
          </View>

          {isSubSelected && (
            <View style={styles.checkBadge}>
              <MaterialIcons name="check-circle" size={24} color="#007AFF" />
            </View>
          )}
        </Pressable>

        {/* Token Section */}
        <Text style={styles.sectionLabel}>토큰 구매</Text>
        <Text style={styles.sectionHint}>1토큰 = ₩10</Text>

        <View style={styles.tokenGrid}>
          {TOKEN_OPTIONS.map((amount) => {
            const isSelected = selectedTokenAmount === amount;
            return (
              <Pressable
                key={amount}
                style={[styles.tokenCard, isSelected && styles.selectedBox]}
                onPress={() => setSelection({ kind: "token", amount })}
              >
                {isSelected && (
                  <View style={styles.tokenCheck}>
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color="#007AFF"
                    />
                  </View>
                )}
                <MaterialIcons
                  name="toll"
                  size={26}
                  color={isSelected ? "#007AFF" : "#687076"}
                />
                <Text
                  style={[
                    styles.tokenAmount,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {amount}
                </Text>
                <Text style={styles.tokenUnit}>토큰</Text>
                <Text
                  style={[styles.tokenPrice, isSelected && styles.selectedText]}
                >
                  {formatWon(amount * PRICE_PER_TOKEN)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Purchase Section */}
      <View style={styles.bottom}>
        {selection && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>결제 금액</Text>
            <Text style={styles.totalPrice}>{formatWon(totalPrice)}</Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.purchaseBtn,
            !selection && styles.purchaseBtnDisabled,
            pressed && !!selection && styles.btnPressed,
          ]}
          onPress={handlePurchase}
          disabled={isLoading || !selection}
        >
          <MaterialIcons name="fingerprint" size={22} color="#fff" />
          <Text style={styles.purchaseBtnText}>
            {isLoading ? "인증 중..." : "결제하기"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEFF0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: CONTENT_PADDING,
    paddingBottom: 32,
  },

  /* Subscription Box */
  subBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#EEEFF0",
    position: "relative",
    overflow: "hidden",
  },
  selectedBox: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },
  subBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  subBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11181C",
  },
  subDesc: {
    fontSize: 14,
    color: "#687076",
    marginBottom: 14,
  },
  subPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  subPrice: {
    fontSize: 26,
    fontWeight: "800",
    color: "#11181C",
  },
  subPeriod: {
    fontSize: 15,
    fontWeight: "500",
    color: "#687076",
  },
  selectedText: {
    color: "#007AFF",
  },
  checkBadge: {
    position: "absolute",
    top: 16,
    left: 16,
  },

  /* Section */
  sectionLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#11181C",
    marginTop: 28,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: "#9BA1A6",
    marginBottom: 14,
  },

  /* Token Grid */
  tokenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: COLUMN_GAP,
  },
  tokenCard: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: "#EEEFF0",
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  tokenCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  tokenAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#11181C",
    marginTop: 4,
  },
  tokenUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9BA1A6",
  },
  tokenPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#687076",
    marginTop: 2,
  },

  /* Bottom */
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEEFF0",
    gap: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#687076",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#11181C",
  },
  purchaseBtn: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  purchaseBtnDisabled: {
    backgroundColor: "#B0B8BF",
  },
  purchaseBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  btnPressed: {
    opacity: 0.7,
  },
});

export default TokenPurchaseScreen;
