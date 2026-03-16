import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AudioModule, createAudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { synthesizeSpeech } from '@/utils/synthesize-speech';

type PlaybackState = 'idle' | 'loading' | 'playing';

const ReadAloudScreen = () => {
  const [text, setText] = useState('');
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  const stopPlayback = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }
    setPlaybackState('idle');
  }, []);

  const handleListen = useCallback(async () => {
    if (playbackState === 'playing') {
      stopPlayback();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setPlaybackState('loading');

      const audioUri = await synthesizeSpeech(trimmed);

      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const player = createAudioPlayer(audioUri, { updateInterval: 200 });
      playerRef.current = player;

      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          sub.remove();
          player.remove();
          playerRef.current = null;
          setPlaybackState('idle');
        }
      });

      player.play();
      setPlaybackState('playing');
    } catch (err) {
      console.error('TTS error:', err);
      setPlaybackState('idle');
    }
  }, [text, playbackState, stopPlayback]);

  const buttonLabel =
    playbackState === 'loading'
      ? '로딩 중...'
      : playbackState === 'playing'
        ? '멈추기'
        : '듣기';

  const buttonIcon =
    playbackState === 'playing' ? 'stop-circle' : 'volume-up';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#11181C" />
          </Pressable>
          <Text style={styles.title}>읽어주기</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.textArea}
            placeholder="원어민 발음으로 듣고 싶은 문장을 입력하세요..."
            placeholderTextColor="#9BA1A6"
            multiline
            textAlignVertical="top"
            value={text}
            onChangeText={setText}
            editable={playbackState !== 'loading'}
          />
        </View>

        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.listenButton,
              !text.trim() && styles.listenButtonDisabled,
              playbackState === 'playing' && styles.listenButtonStop,
            ]}
            onPress={handleListen}
            disabled={!text.trim() || playbackState === 'loading'}
          >
            {playbackState === 'loading' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIcons name={buttonIcon} size={22} color="#fff" />
            )}
            <Text style={styles.listenButtonText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#11181C',
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8EB',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E6E8EB',
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  listenButtonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  listenButtonStop: {
    backgroundColor: '#E53935',
  },
  listenButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReadAloudScreen;
