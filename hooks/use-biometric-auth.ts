import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useState } from "react";

export type UseBiometricAuthReturn = {
  authenticate: (promptMessage?: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  clearError: () => void;
};

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const authenticate = useCallback(
    async (promptMessage?: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);
        setIsSuccess(false);

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          setError(
            "이 기기에서 생체인증을 사용할 수 없거나, 등록된 생체 정보가 없습니다.",
          );
          return false;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: promptMessage ?? "인증해주세요",
          fallbackLabel: "비밀번호 사용",
        });

        if (result.success) {
          setIsSuccess(true);
          return true;
        } else {
          setError("인증이 취소되었거나 실패했습니다.");
          return false;
        }
      } catch {
        setError("생체인증 중 오류가 발생했습니다.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    authenticate,
    isLoading,
    error,
    isSuccess,
    clearError,
  };
}
