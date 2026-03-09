import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSession } from "@/hooks/use-session";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useSession();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="conversation" options={{ headerShown: false }} />
        <Stack.Screen name="read-aloud" options={{ headerShown: false }} />
        <Stack.Screen name="chat-history" options={{ headerShown: false }} />
        <Stack.Screen name="token-purchase" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
