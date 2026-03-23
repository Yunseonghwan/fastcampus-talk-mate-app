import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TOKEN_AMOUNTS } from "@/constants/revenue-cat";
import { useRevenueCat } from "@/hooks/use-revenue-cat";
import { useTokenStore } from "@/stores/token-store";

const FALLBACK_PRICE_PER_TOKEN = 10;

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = 20;
const COLUMN_GAP = 8;
const COLUMNS = 3;
const CARD_WIDTH =
  (SCREEN_WIDTH - CONTENT_PADDING * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS;

const formatWon = (amount: number) => `₩${amount.toLocaleString()}`;

const TokenPurchaseScreen = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const tokens = useTokenStore((s) => s.tokens);

  const {
    isLoading,
    isPurchasing,
    purchaseTokens,
    restorePurchases,
    getPackagePrice,
  } = useRevenueCat();

  const tokenPrice = (amount: number) => {
    return (
      getPackagePrice(amount) ?? formatWon(amount * FALLBACK_PRICE_PER_TOKEN)
    );
  };

  const displayPrice = selectedAmount ? tokenPrice(selectedAmount) : "";

  const handlePurchase = async () => {
    if (!selectedAmount) {
      Alert.alert("선택 필요", "토큰을 선택해주세요.");
      return;
    }

    const success = await purchaseTokens(selectedAmount);
    if (success) {
      Alert.alert(
        "결제 완료",
        `${selectedAmount} 토큰이 추가되었습니다.`,
        [{ text: "확인", onPress: () => router.replace("/landing") }],
      );
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
        <Pressable
          onPress={restorePurchases}
          style={styles.restoreButton}
          disabled={isLoading}
        >
          <Text style={styles.restoreText}>복원</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>상품 정보를 불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Token Balance */}
          <View style={styles.balanceRow}>
            <MaterialIcons name="toll" size={20} color="#007AFF" />
            <Text style={styles.balanceText}>
              보유 토큰:{" "}
              <Text style={styles.balanceAmount}>{tokens}</Text>
            </Text>
          </View>

          {/* Token Section */}
          <Text style={styles.sectionLabel}>토큰 구매</Text>

          <View style={styles.tokenGrid}>
            {TOKEN_AMOUNTS.map((amount) => {
              const isSelected = selectedAmount === amount;
              return (
                <Pressable
                  key={amount}
                  style={[
                    styles.tokenCard,
                    isSelected && styles.selectedBox,
                  ]}
                  onPress={() => setSelectedAmount(amount)}
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
                    style={[
                      styles.tokenPrice,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {tokenPrice(amount)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Sandbox Notice */}
          <View style={styles.sandboxNotice}>
            <MaterialIcons name="science" size={16} color="#FF9500" />
            <Text style={styles.sandboxText}>
              테스트 환경: Sandbox 모드로 실제 결제가 이루어지지 않습니다
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Bottom Purchase Section */}
      {!isLoading && (
        <View style={styles.bottom}>
          {selectedAmount && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>결제 금액</Text>
              <Text style={styles.totalPrice}>{displayPrice}</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.purchaseBtn,
              (!selectedAmount || isPurchasing) && styles.purchaseBtnDisabled,
              pressed && !!selectedAmount && !isPurchasing && styles.btnPressed,
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing || !selectedAmount}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="shopping-cart" size={22} color="#fff" />
            )}
            <Text style={styles.purchaseBtnText}>
              {isPurchasing ? "결제 진행 중..." : "결제하기"}
            </Text>
          </Pressable>
        </View>
      )}
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
  restoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: "#687076",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: CONTENT_PADDING,
    paddingBottom: 32,
  },

  /* Balance */
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  balanceText: {
    fontSize: 15,
    color: "#687076",
  },
  balanceAmount: {
    fontWeight: "800",
    color: "#007AFF",
  },

  /* Section */
  sectionLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#11181C",
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
  selectedBox: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
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
  selectedText: {
    color: "#007AFF",
  },

  /* Sandbox Notice */
  sandboxNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF8F0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  sandboxText: {
    flex: 1,
    fontSize: 12,
    color: "#E65100",
    lineHeight: 18,
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
