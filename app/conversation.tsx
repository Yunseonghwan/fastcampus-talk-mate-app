import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

import { useAudioPermissions } from "@/hooks/use-audio-permissions";

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

const ConversationScreen = () => {
  const webViewRef = useRef<WebView>(null);
  const { requestPermission } = useAudioPermissions();

  const handleConversationStart = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new CustomEvent('nativeMessage', { detail: { type: 'permission_granted' } })); true;`,
      );
    }
  }, [requestPermission]);

  const handleConversationStop = useCallback(async () => {
    router.back();
  }, []);

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
    [handleConversationStart],
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
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          style={styles.webview}
          source={{ uri: "http://192.168.0.3:5173/" }}
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
  webview: {
    flex: 1,
  },
});

export default ConversationScreen;
