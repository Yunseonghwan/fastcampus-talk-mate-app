import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RecordingPresets, useAudioRecorder } from "expo-audio";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

import MicSection from "@/components/mic-section";
import { useAudioPermissions } from "@/hooks/use-audio-permissions";
import { useConversation } from "@/hooks/use-conversation";
import { useAudioStore } from "@/stores/audio-store";

const BRIDGE_JS = `
(function() {
  if (!window.webkit) window.webkit = {};
  if (!window.webkit.messageHandlers) window.webkit.messageHandlers = {};
  window.webkit.messageHandlers.talkmateApp = {
    postMessage: function(msg) {
      window.ReactNativeWebView.postMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };
  true;
})();
`;

const STATE_LABELS: Record<string, string> = {
  idle: "대화 준비 중",
  listening: "듣고 있습니다...",
  processing: "AI 응답 생성 중...",
  ai_speaking: "AI 말하는 중...",
};

const getDescription = (
  state: string,
  isConnected: boolean,
  error: string | null,
  currentAiText: string,
): string => {
  if (error) return `오류: ${error}`;
  if (!isConnected && state === "idle") return "잠시 후 대화가 시작됩니다";
  if (state === "listening") return "영어로 말해보세요";
  if (state === "processing") return "잠시만 기다려 주세요";
  if (state === "ai_speaking" && currentAiText) return currentAiText;
  if (isConnected) return "연결됨";
  return "연결 대기 중";
};

const ConversationScreen = () => {
  const webViewRef = useRef<WebView>(null);
  const { requestPermission } = useAudioPermissions();
  const addConversation = useAudioStore((s) => s.addConversation);

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });

  const conversation = useConversation();

  const handleConversationStart = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        "마이크 권한 필요",
        "마이크 사용을 위해 설정에서 권한을 허용해 주세요.",
        [
          { text: "취소", style: "cancel" },
          { text: "설정으로 이동", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    try {
      await conversation.start(audioRecorder);

      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new CustomEvent('nativeMessage', { detail: { type: 'permission_granted' } })); true;`,
      );
    } catch (error) {
      console.error("Conversation start failed:", error);
    }
  }, [requestPermission, audioRecorder, conversation]);

  const handleConversationStop = useCallback(async () => {
    try {
      const session = await conversation.stop();
      if (session) {
        addConversation(session);
      }
    } catch (error) {
      console.error("Conversation stop failed:", error);
    } finally {
      router.back();
    }
  }, [conversation, addConversation]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const { data } = event.nativeEvent;

      switch (data) {
        case "conversation_start":
          handleConversationStart();
          break;
        case "conversation_stop":
          handleConversationStop();
          break;
        default:
          break;
      }
    },
    [handleConversationStart, handleConversationStop],
  );

  const isActive = conversation.state !== "idle";
  const label = STATE_LABELS[conversation.state] ?? "대화 준비 중";
  const description = getDescription(
    conversation.state,
    conversation.isConnected,
    conversation.error,
    conversation.currentAiText,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#11181C" />
        </Pressable>
        <Text style={styles.title}>대화하기</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.micOverlay} pointerEvents="box-none">
          <MicSection
            isRecording={isActive}
            recorder={conversation.state === "listening" ? audioRecorder : undefined}
            label={label}
            description={description}
          />

          {conversation.isConnected && (
            <Text style={styles.connectionText}>
              {conversation.error ? "연결 실패" : "OpenAI 연결됨"}
            </Text>
          )}
        </View>

        <WebView
          ref={webViewRef}
          style={styles.webview}
          source={{ uri: "http://192.168.0.4:5173/" }}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          injectedJavaScriptBeforeContentLoaded={BRIDGE_JS}
          onMessage={handleMessage}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  content: {
    flex: 1,
  },
  micOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  webview: {
    flex: 1,
  },
  connectionText: {
    marginTop: 12,
    fontSize: 12,
    color: "#687076",
  },
});

export default ConversationScreen;
