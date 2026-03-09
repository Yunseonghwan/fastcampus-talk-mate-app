import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import {
  check,
  PERMISSIONS,
  request,
  RESULTS,
  type PermissionStatus,
} from "react-native-permissions";

const MICROPHONE_PERMISSION = Platform.select({
  ios: PERMISSIONS.IOS.MICROPHONE,
  android: PERMISSIONS.ANDROID.RECORD_AUDIO,
})!;

export type AudioPermissionState =
  | "undetermined"
  | "granted"
  | "denied"
  | "blocked"
  | "loading";

export type UseAudioPermissionsReturn = {
  status: AudioPermissionState;
  isGranted: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<void>;
};

const toAudioState = (status: PermissionStatus): AudioPermissionState => {
  switch (status) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return "granted";
    case RESULTS.DENIED:
      return "denied";
    case RESULTS.BLOCKED:
    case RESULTS.UNAVAILABLE:
      return "blocked";
    default:
      return "undetermined";
  }
};

export function useAudioPermissions(): UseAudioPermissionsReturn {
  const [status, setStatus] = useState<AudioPermissionState>("loading");

  const checkPermission = useCallback(async (): Promise<void> => {
    try {
      const result = await check(MICROPHONE_PERMISSION);
      setStatus(toAudioState(result));
    } catch {
      setStatus("undetermined");
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const currentStatus = await check(MICROPHONE_PERMISSION);

      if (
        currentStatus === RESULTS.GRANTED ||
        currentStatus === RESULTS.LIMITED
      ) {
        setStatus("granted");
        return true;
      }

      if (
        currentStatus === RESULTS.BLOCKED ||
        currentStatus === RESULTS.UNAVAILABLE
      ) {
        Alert.alert(
          "마이크 권한 필요",
          "마이크 사용을 위해 설정에서 권한을 허용해 주세요.",
          [
            { text: "취소", style: "cancel" },
            { text: "설정으로 이동", onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      const result = await request(MICROPHONE_PERMISSION);
      const newState = toAudioState(result);
      setStatus(newState);
      return newState === "granted";
    } catch {
      setStatus("undetermined");
      return false;
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    status,
    isGranted: status === "granted",
    requestPermission,
    checkPermission,
  };
}
