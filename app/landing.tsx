import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MenuModal from "@/components/menu-modal";
import { useSession } from "@/hooks/use-session";
import { useTokenStore } from "@/stores/token-store";

const LandingScreen = () => {
  const { isInitialized, hasValidSession } = useSession();
  const tokens = useTokenStore((state) => state.tokens);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (isInitialized && !hasValidSession) {
      router.replace("/");
    }
  }, [isInitialized, hasValidSession]);

  const handleStartConversation = () => {
    router.push("/conversation");
  };

  const handleReadAloud = () => {
    router.push("/read-aloud");
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

      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />

      {/* Token Display */}
      <View style={styles.tokenSection}>
        <MaterialIcons name="toll" size={20} color="#007AFF" />
        <Text style={styles.tokenCount}>{tokens}</Text>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <View style={styles.micOuterCircle}>
          <View style={styles.micInnerCircle}>
            <MaterialIcons name="mic" size={48} color="#fff" />
          </View>
        </View>
        <Text style={styles.mainText}>대화시작하기</Text>
        <Text style={styles.subText}>
          아래 버튼을 눌러서 AI와 대화를 시작해 보세요
        </Text>
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
          <Text style={styles.outlineButtonText}>읽어주기(5토큰)</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStartConversation}
        >
          <Text style={styles.primaryButtonText}>대화시작하기(10토큰)</Text>
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
  micOuterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  micInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
  },
  mainText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#11181C",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    lineHeight: 20,
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
