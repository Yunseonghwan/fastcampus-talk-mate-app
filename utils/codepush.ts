import CodePush, {
  type CodePushOptions,
  type ReleaseHistoryInterface,
  type UpdateCheckRequest,
} from "@bravemobile/react-native-code-push";
import { Alert, Platform } from "react-native";

const S3_BASE_URL = process.env.EXPO_PUBLIC_CODE_PUSH_S3_URL ?? "";
const IDENTIFIER = process.env.EXPO_PUBLIC_CODE_PUSH_IDENTIFIER ?? "production";

async function releaseHistoryFetcher(
  updateRequest: UpdateCheckRequest,
): Promise<ReleaseHistoryInterface> {
  const platform = Platform.OS;
  const url = `${S3_BASE_URL}/histories/${platform}/${IDENTIFIER}/${updateRequest.app_version}.json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch release history: ${response.status}`);
  }
  return response.json();
}

export const codePushOptions: CodePushOptions = {
  checkFrequency: CodePush.CheckFrequency.MANUAL,
  releaseHistoryFetcher,
};

export async function checkAndApplyUpdate(): Promise<void> {
  try {
    const update = await CodePush.checkForUpdate();
    if (!update) return;

    const isMandatory = update.isMandatory;

    return new Promise<void>((resolve) => {
      if (isMandatory) {
        Alert.alert(
          "필수 업데이트",
          `새로운 버전(${update.appVersion})이 있습니다.\n앱 사용을 위해 업데이트가 필요합니다.`,
          [
            {
              text: "다운로드",
              onPress: async () => {
                await downloadAndInstall(update);
                resolve();
              },
            },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert(
          "업데이트 안내",
          `새로운 버전(${update.appVersion})이 있습니다.\n지금 다운로드하시겠습니까?`,
          [
            {
              text: "취소",
              style: "cancel",
              onPress: () => resolve(),
            },
            {
              text: "다운로드",
              onPress: async () => {
                await downloadAndInstall(update);
                resolve();
              },
            },
          ],
          { cancelable: false },
        );
      }
    });
  } catch (error) {
    console.error("CodePush update check failed:", error);
  }
}

async function downloadAndInstall(
  update: Awaited<ReturnType<typeof CodePush.checkForUpdate>>,
): Promise<void> {
  if (!update) return;

  try {
    const localPackage = await update.download((progress) => {
      const percent = Math.round(
        (progress.receivedBytes / progress.totalBytes) * 100,
      );
      console.log(`CodePush download progress: ${percent}%`);
    });

    await localPackage.install(CodePush.InstallMode.IMMEDIATE);
    CodePush.restartApp();
  } catch (error) {
    console.error("CodePush download/install failed:", error);
    Alert.alert(
      "업데이트 실패",
      "업데이트 다운로드에 실패했습니다.\n다음에 다시 시도해주세요.",
    );
  }
}
