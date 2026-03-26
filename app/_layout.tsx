import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import CodePush from "@bravemobile/react-native-code-push";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import "react-native-reanimated";

import messaging from "@react-native-firebase/messaging";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSession } from "@/hooks/use-session";
import { codePushOptions, checkAndApplyUpdate } from "@/utils/codepush";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://f5f9cacf1412f833c9d27e9c9e76fd07@o4510887774257152.ingest.us.sentry.io/4510887822163968',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: false,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function setupAndroidNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "기본 알림",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4A90D9",
    sound: "default",
  });
}

async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn("푸시 알림은 실제 기기에서만 동작합니다.");
    return false;
  }

  if (Platform.OS === "android") {
    await setupAndroidNotificationChannel();
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "알림 권한 필요",
      "푸시 알림을 받으려면 설정에서 알림 권한을 허용해주세요.",
    );
    return false;
  }

  return true;
}

async function getAPNSToken(): Promise<string | null> {
  if (Platform.OS !== "ios") return null;

  try {
    const apnsToken = await messaging().getAPNSToken();
    if (apnsToken) {
      console.log("APNS Token:", apnsToken);
      return apnsToken;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
    const retryToken = await messaging().getAPNSToken();
    if (retryToken) {
      console.log("APNS Token (retry):", retryToken);
      return retryToken;
    }

    console.warn("APNS 토큰을 가져올 수 없습니다.");
    return null;
  } catch (error) {
    console.error("APNS 토큰 획득 실패:", error);
    return null;
  }
}

async function getFCMToken(): Promise<string | null> {
  try {
    if (Platform.OS === "ios") {
      const apnsToken = await getAPNSToken();
      if (!apnsToken) {
        console.warn("APNS 토큰이 없어 FCM 토큰을 가져올 수 없습니다.");
        return null;
      }
    }

    const fcmToken = await messaging().getToken();
    console.log("FCM Token:", fcmToken);
    return fcmToken;
  } catch (error) {
    console.error("FCM 토큰 획득 실패:", error);
    return null;
  }
}

async function registerForPushNotifications() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const fcmToken = await getFCMToken();
  if (fcmToken) {
    // TODO: FCM 토큰을 서버에 전송
    console.log("푸시 알림 등록 완료. FCM Token:", fcmToken);
  }
}

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayout() {
  const colorScheme = useColorScheme();
  useSession();

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    checkAndApplyUpdate();
  }, []);

  useEffect(() => {
    registerForPushNotifications();

    messaging().onTokenRefresh((newToken) => {
      // TODO: 갱신된 FCM 토큰을 서버에 전송
      console.log("FCM Token 갱신:", newToken);
    });

    const unsubscribeForeground = messaging().onMessage(
      async (remoteMessage) => {
        console.log("포그라운드 FCM 메시지:", remoteMessage);
      },
    );

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("백그라운드 FCM 메시지:", remoteMessage);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("알림 수신:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("알림 탭 데이터:", data);
      });

    return () => {
      unsubscribeForeground();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="conversation" options={{ headerShown: false }} />
        <Stack.Screen name="read-aloud" options={{ headerShown: false }} />
        <Stack.Screen name="chat-history" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default CodePush(codePushOptions)(Sentry.wrap(RootLayout));
