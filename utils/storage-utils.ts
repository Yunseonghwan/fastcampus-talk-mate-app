import { Directory, File, Paths } from 'expo-file-system';

function sumDirectorySize(dir: Directory): number {
  try {
    const items = dir.list();
    let total = 0;
    for (const item of items) {
      if (item instanceof File) {
        total += item.size ?? 0;
      } else {
        total += sumDirectorySize(item as Directory);
      }
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * 디바이스 저장 공간 정보와 앱(recordings) 사용량 반환
 */
export function getStorageInfo(): {
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  appUsedBytes: number;
} {
  let totalBytes = 0;
  let availableBytes = 0;
  let appUsedBytes = 0;

  try {
    totalBytes = Paths.totalDiskSpace ?? 0;
    availableBytes = Paths.availableDiskSpace ?? 0;
  } catch {
    // 일부 환경에서는 지원되지 않을 수 있음
  }

  const usedBytes = totalBytes > 0 ? totalBytes - availableBytes : 0;

  try {
    const recordingsDir = new Directory(Paths.document, 'recordings');
    if (recordingsDir.exists) {
      const dirSize = (recordingsDir as { size?: number | null }).size;
      if (dirSize != null) {
        appUsedBytes = dirSize;
      } else {
        appUsedBytes = sumDirectorySize(recordingsDir);
      }
    }
  } catch {
    // recordings 디렉토리가 없거나 접근 불가
  }

  return {
    totalBytes,
    usedBytes,
    availableBytes,
    appUsedBytes,
  };
}

/**
 * 바이트를 읽기 쉬운 문자열로 변환 (예: 1.2 GB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * URI로 파일 삭제
 */
export function deleteFileByUri(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // 파일이 없거나 삭제 실패 시 무시
  }
}
