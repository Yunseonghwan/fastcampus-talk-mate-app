import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MenuModal from "@/components/menu-modal";

import MicSection from "@/components/mic-section";
import { useSession } from "@/hooks/use-session";
import { useTokenStore } from "@/stores/token-store";

const READ_ALOUD_COST = 5;
const CONVERSATION_COST = 10;

const LandingScreen = () => {
  const { isInitialized, hasValidSession } = useSession();
  const tokens = useTokenStore((state) => state.tokens);
  const isSubscribed = useTokenStore((state) => state.isSubscribed);
  const checkSubscription = useTokenStore((state) => state.checkSubscription);
  const consumeTokens = useTokenStore((state) => state.useTokens);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (isInitialized && !hasValidSession) {
      router.replace("/");
    }
  }, [isInitialized, hasValidSession]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const navigateWithTokenCheck = useCallback(
    (route: "/conversation" | "/read-aloud", cost: number) => {
      const subscriptionActive = checkSubscription();

      if (subscriptionActive) {
        router.push(route);
        return;
      }

      if (!consumeTokens(cost)) {
        Alert.alert("토큰 부족", "토큰이 부족합니다. 토큰을 구매해주세요.", [
          { text: "취소", style: "cancel" },
          {
            text: "구매하기",
            onPress: () => router.push("/token-purchase"),
          },
        ]);
        return;
      }

      router.push(route);
    },
    [checkSubscription, consumeTokens],
  );

  const handleStartConversation = () => {
    navigateWithTokenCheck("/conversation", CONVERSATION_COST);
  };

  const handleReadAloud = () => {
    navigateWithTokenCheck("/read-aloud", READ_ALOUD_COST);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <MaterialIcons name="smart-toy" size={24} color="#fff" />
          </View>
          <Text style={styles.profileName}>AI 선생님</Text>
        </View>
        <Pressable
          style={styles.meatballButton}
          onPress={() => setMenuVisible(true)}
        >
          <MaterialIcons name="more-horiz" size={24} color="#333" />
        </Pressable>
      </View>

      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Token Display */}
      <View style={styles.tokenSection}>
        <MaterialIcons name="toll" size={20} color="#007AFF" />
        <Text style={styles.tokenCount}>{tokens}</Text>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <MicSection />
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <Pressable
          style={({ pressed }) => [
            styles.outlineButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleReadAloud}
        >
          <Text style={styles.outlineButtonText}>
            {isSubscribed ? "읽어주기" : "읽어주기(5토큰)"}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStartConversation}
        >
          <Text style={styles.primaryButtonText}>
            {isSubscribed ? "대화시작하기" : "대화시작하기(10토큰)"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
  },
  meatballButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tokenSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  tokenCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomButtons: {
    gap: 10,
    paddingBottom: 16,
  },
  outlineButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

export default LandingScreen;
