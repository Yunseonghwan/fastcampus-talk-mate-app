import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AudioModule, createAudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ConversationSession } from '@/stores/audio-store';
import { useAudioStore } from '@/stores/audio-store';
import {
  deleteFileByUri,
  formatBytes,
  getStorageInfo,
} from '@/utils/storage-utils';

const formatDate = (timestamp: number) => {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
};

const getConversationTitle = (session: ConversationSession): string => {
  const firstUser = session.messages.find((m) => m.role === 'user');
  if (firstUser?.content) {
    const text = firstUser.content.trim();
    return text.length > 30 ? `${text.slice(0, 30)}...` : text;
  }
  return `대화 ${formatDate(session.timestamp)}`;
};

type StorageState = {
  totalBytes: number;
  usedBytes: number;
  appUsedBytes: number;
};

const ChatHistoryScreen = () => {
  const conversations = useAudioStore((s) => s.conversations);
  const removeConversation = useAudioStore((s) => s.removeConversation);
  const [storage, setStorage] = useState<StorageState>({
    totalBytes: 0,
    usedBytes: 0,
    appUsedBytes: 0,
  });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const segmentIndexRef = useRef(0);
  const segmentsRef = useRef<{ uri: string }[]>([]);

  const refreshStorage = useCallback(() => {
    const info = getStorageInfo();
    setStorage({
      totalBytes: info.totalBytes,
      usedBytes: info.usedBytes,
      appUsedBytes: info.appUsedBytes,
    });
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [refreshStorage, conversations]);

  const stopPlayback = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }
    segmentIndexRef.current = 0;
    segmentsRef.current = [];
    setPlayingId(null);
  }, []);

  const playNextSegment = useCallback(async () => {
    const segs = segmentsRef.current;
    const idx = segmentIndexRef.current;
    if (idx >= segs.length) {
      stopPlayback();
      return;
    }
    const { uri } = segs[idx];
    segmentIndexRef.current = idx + 1;

    try {
      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      const player = createAudioPlayer(uri, { updateInterval: 200 });
      playerRef.current = player;
      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          sub.remove();
          player.remove();
          playerRef.current = null;
          playNextSegment();
        }
      });
      player.play();
    } catch {
      playNextSegment();
    }
  }, [stopPlayback]);

  const handlePlay = useCallback(
    async (session: ConversationSession) => {
      const segs = session.segments.filter((s) => s.uri);
      if (segs.length === 0) return;

      if (playingId === session.id) {
        stopPlayback();
        return;
      }

      stopPlayback();
      segmentsRef.current = segs;
      segmentIndexRef.current = 0;
      setPlayingId(session.id);
      await playNextSegment();
    },
    [playingId, stopPlayback, playNextSegment],
  );

  const handleDelete = useCallback(
    (session: ConversationSession) => {
      Alert.alert(
        '삭제 확인',
        '이 대화기록을 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => {
              if (playingId === session.id) {
                stopPlayback();
              }
              session.segments.forEach((s) => deleteFileByUri(s.uri));
              removeConversation(session.id);
              refreshStorage();
            },
          },
        ],
      );
    },
    [playingId, stopPlayback, removeConversation, refreshStorage],
  );

  const usagePercent =
    storage.totalBytes > 0
      ? Math.min(100, (storage.usedBytes / storage.totalBytes) * 100)
      : 0;

  const renderItem = useCallback(
    ({ item }: { item: ConversationSession }) => {
      const isPlaying = playingId === item.id;
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {getConversationTitle(item)}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.timestamp)}</Text>
          <View style={styles.cardActions}>
            <Pressable
              style={[styles.iconButton, isPlaying && styles.iconButtonActive]}
              onPress={() => handlePlay(item)}
            >
              <MaterialIcons
                name={isPlaying ? 'stop' : 'play-arrow'}
                size={24}
                color={isPlaying ? '#fff' : '#0066FF'}
              />
            </Pressable>
            <Pressable
              style={[styles.iconButton, styles.deleteButton]}
              onPress={() => handleDelete(item)}
            >
              <MaterialIcons name="delete-outline" size={24} color="#E53935" />
            </Pressable>
          </View>
        </View>
      );
    },
    [playingId, handlePlay, handleDelete],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#11181C" />
        </Pressable>
        <Text style={styles.title}>대화기록</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.storageSection}>
        <View style={styles.storageRow}>
          <Text style={styles.storageLabel}>총 저장용량</Text>
          <Text style={styles.storageValue}>
            {formatBytes(storage.totalBytes)}
          </Text>
        </View>
        <View style={styles.storageRow}>
          <Text style={styles.storageLabel}>사용 중</Text>
          <Text style={styles.storageValue}>
            {formatBytes(storage.usedBytes)} / {formatBytes(storage.totalBytes)}
          </Text>
        </View>
        <View style={styles.gaugeBar}>
          <View
            style={[styles.gaugeFill, { width: `${usagePercent}%` }]}
          />
        </View>
        <Text style={styles.appStorageText}>
          앱 사용량: {formatBytes(storage.appUsedBytes)}
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="chat-bubble-outline" size={48} color="#9BA1A6" />
            <Text style={styles.emptyText}>저장된 대화기록이 없습니다</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
  },
  placeholder: {
    width: 40,
  },
  storageSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 14,
    color: '#687076',
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
  gaugeBar: {
    height: 8,
    backgroundColor: '#E6E8EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  appStorageText: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E8EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 13,
    color: '#687076',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#0066FF',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#9BA1A6',
    marginTop: 12,
  },
});

export default ChatHistoryScreen;
