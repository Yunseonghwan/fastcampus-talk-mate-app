import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
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

const ensureRecordingsDir = () => {
  const dir = new Directory(Paths.document, "recordings");
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
};

const ConversationScreen = () => {
  const webViewRef = useRef<WebView>(null);
  const { requestPermission } = useAudioPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartTime = useRef<number>(0);

  const addRecording = useAudioStore((state) => state.addRecording);
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });

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
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      recordingStartTime.current = Date.now();
      setIsRecording(true);

      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new CustomEvent('nativeMessage', { detail: { type: 'permission_granted' } })); true;`,
      );
    } catch (error) {
      console.error("Recording start failed:", error);
    }
  }, [requestPermission, audioRecorder]);

  const handleConversationStop = useCallback(async () => {
    try {
      if (isRecording) {
        await audioRecorder.stop();
        setIsRecording(false);

        const uri = audioRecorder.uri;
        console.log("uri:", uri);
        if (uri) {
          const recordingsDir = ensureRecordingsDir();
          const filename = `recording_${Date.now()}.m4a`;

          const sourceFile = new File(uri);
          const destFile = new File(recordingsDir, filename);
          sourceFile.move(destFile);

          const durationMs = Date.now() - recordingStartTime.current;
          addRecording({
            id: Date.now().toString(),
            uri: destFile.uri,
            timestamp: Date.now(),
            durationMs,
          });
        }
      }
    } catch (error) {
      console.error("Recording stop failed:", error);
    } finally {
      router.back();
    }
  }, [isRecording, audioRecorder, addRecording]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const { data } = event.nativeEvent;
      console.log("webview -> native:", data);

      switch (data) {
        case "conversation_start":
          handleConversationStart();
          break;
        case "conversation_stop":
          handleConversationStop();
          break;
        default:
          console.log("unhandled message:", data);
      }
    },
    [handleConversationStart, handleConversationStop],
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
            isRecording={isRecording}
            recorder={audioRecorder}
            label={isRecording ? "대화 중..." : "대화 준비 중"}
            description={
              isRecording
                ? "AI와 대화가 진행되고 있습니다"
                : "잠시 후 대화가 시작됩니다"
            }
          />
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
});

export default ConversationScreen;
