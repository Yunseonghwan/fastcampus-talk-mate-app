import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { useSession } from "@/hooks/use-session";

const AuthScreen = () => {
  const { authenticate, isLoading, error, isSuccess, clearError } =
    useBiometricAuth();
  const { isInitialized, hasValidSession, refreshSession } = useSession();

  useEffect(() => {
    if (isInitialized && hasValidSession) {
      router.replace("/landing");
    }
  }, [isInitialized, hasValidSession]);

  useEffect(() => {
    if (error) {
      Alert.alert("생체인증 오류", error, [
        { text: "확인", onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (!isSuccess) return;

    const proceedAfterAuth = async (): Promise<void> => {
      await refreshSession();
      router.replace("/landing");
    };

    proceedAfterAuth();
  }, [isSuccess, refreshSession]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>보안인증</Text>
        <Text style={styles.subtitle}>
          안전한 로그인을 위해 인증을 진행해 주세요
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={authenticate}
            disabled={isLoading}
          >
            <MaterialIcons
              name="fingerprint"
              size={64}
              color={Colors.light.tint}
              style={styles.icon}
            />
            <Text style={styles.buttonTitle}>생체인증</Text>
            <Text style={styles.buttonDescription}>
              지문 또는 얼굴 인식을 통해{"\n"}안전하게 로그인합니다
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={isSuccess}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <MaterialIcons
              name="check-circle"
              size={72}
              color="#22c55e"
              style={styles.successIcon}
            />
            <Text style={styles.successTitle}>인증 성공</Text>
            <Text style={styles.successDescription}>
              안전하게 로그인되었습니다.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    lineHeight: 24,
    marginBottom: 48,
  },
  buttonContainer: {
    alignItems: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 48,
    borderRadius: 16,
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    minWidth: 280,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    marginBottom: 16,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  buttonDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: "center",
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  successCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 48,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    minWidth: 280,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: "center",
  },
});

export default AuthScreen;
