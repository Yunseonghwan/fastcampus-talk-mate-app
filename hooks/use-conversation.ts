import { AudioModule, createAudioPlayer } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { useCallback, useRef, useState } from 'react';

import {
  CONVERSATION_SYSTEM_PROMPT,
  METERING_INTERVAL_MS,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MODELS,
  SILENCE_DURATION_MS,
  SILENCE_THRESHOLD_DB,
} from '@/constants/openai';
import type {
  ConversationMessage,
  ConversationSegment,
  ConversationSession,
} from '@/stores/audio-store';
import { synthesizeSpeech } from '@/utils/synthesize-speech';

type ConversationState = 'idle' | 'listening' | 'processing' | 'ai_speaking';

type RecorderHandle = {
  prepareToRecordAsync: () => Promise<void>;
  record: () => void;
  stop: () => Promise<void>;
  uri: string | null;
  getStatus: () => { metering?: number; isRecording?: boolean };
};

const ensureRecordingsDir = (): Directory => {
  const dir = new Directory(Paths.document, 'recordings');
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
};

async function transcribeAudio(audioUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  } as unknown as Blob);
  formData.append('model', OPENAI_MODELS.whisper);

  const res = await fetch(`${OPENAI_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Whisper API error: ${res.status}`);
  const data = await res.json();
  return data.text ?? '';
}

async function chatCompletion(
  history: ConversationMessage[],
): Promise<string> {
  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODELS.chat,
      messages: [
        { role: 'system', content: CONVERSATION_SYSTEM_PROMPT },
        ...history,
      ],
    }),
  });

  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}


export type UseConversationReturn = {
  state: ConversationState;
  messages: ConversationMessage[];
  currentAiText: string;
  isConnected: boolean;
  error: string | null;
  start: (recorder: RecorderHandle) => Promise<void>;
  stop: () => Promise<ConversationSession | null>;
};

export function useConversation(): UseConversationReturn {
  const [state, setState] = useState<ConversationState>('idle');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentAiText, setCurrentAiText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<RecorderHandle | null>(null);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);
  const isProcessingTurnRef = useRef(false);
  const isStoppedRef = useRef(false);

  const segmentsRef = useRef<ConversationSegment[]>([]);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const turnStartRef = useRef(0);
  const sessionStartRef = useRef(0);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const processTurn = useCallback(async () => {
    if (isStoppedRef.current) return;

    clearSilenceTimer();
    isProcessingTurnRef.current = true;
    setState('processing');
    setError(null);

    const recorder = recorderRef.current;
    if (!recorder) return;

    try {
      await recorder.stop();
      const rawUri = recorder.uri;
      if (!rawUri) throw new Error('No recording URI');

      const userDuration = Date.now() - turnStartRef.current;
      const dir = ensureRecordingsDir();
      const userFile = new File(dir, `user_${Date.now()}.m4a`);
      new File(rawUri).move(userFile);

      if (isStoppedRef.current) return;

      const userText = await transcribeAudio(userFile.uri);

      if (!userText.trim() || isStoppedRef.current) {
        isProcessingTurnRef.current = false;
        if (!isStoppedRef.current) await beginListening();
        return;
      }

      const userMsg: ConversationMessage = { role: 'user', content: userText };
      messagesRef.current = [...messagesRef.current, userMsg];
      setMessages([...messagesRef.current]);
      segmentsRef.current.push({
        speaker: 'user',
        uri: userFile.uri,
        text: userText,
        durationMs: userDuration,
      });

      if (isStoppedRef.current) return;

      const aiText = await chatCompletion(messagesRef.current);
      setCurrentAiText(aiText);

      const aiMsg: ConversationMessage = { role: 'assistant', content: aiText };
      messagesRef.current = [...messagesRef.current, aiMsg];
      setMessages([...messagesRef.current]);

      if (isStoppedRef.current) return;

      const aiAudioUri = await synthesizeSpeech(aiText);

      if (isStoppedRef.current) return;

      setState('ai_speaking');

      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      await new Promise<void>((resolve) => {
        const player = createAudioPlayer(aiAudioUri, { updateInterval: 200 });
        playerRef.current = player;
        const playStart = Date.now();

        const sub = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            sub.remove();
            segmentsRef.current.push({
              speaker: 'ai',
              uri: aiAudioUri,
              text: aiText,
              durationMs: Date.now() - playStart,
            });
            player.remove();
            playerRef.current = null;
            setCurrentAiText('');
            resolve();
          }
        });

        player.play();
      });

      isProcessingTurnRef.current = false;
      if (!isStoppedRef.current) await beginListening();
    } catch (err) {
      console.error('Turn processing error:', err);
      const msg = err instanceof Error ? err.message : 'Processing failed';
      setError(msg);
      isProcessingTurnRef.current = false;
      if (!isStoppedRef.current) await beginListening();
    }
  }, [clearSilenceTimer]);

  const processTurnRef = useRef(processTurn);
  processTurnRef.current = processTurn;

  const startSilenceDetection = useCallback(() => {
    silenceStartRef.current = null;
    hasSpokenRef.current = false;

    silenceTimerRef.current = setInterval(() => {
      if (isStoppedRef.current || isProcessingTurnRef.current) return;

      const recorder = recorderRef.current;
      if (!recorder) return;

      const { metering = -160 } = recorder.getStatus();

      if (metering >= SILENCE_THRESHOLD_DB) {
        silenceStartRef.current = null;
        hasSpokenRef.current = true;
        return;
      }

      if (!hasSpokenRef.current) return;

      if (!silenceStartRef.current) {
        silenceStartRef.current = Date.now();
        return;
      }

      if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
        processTurnRef.current();
      }
    }, METERING_INTERVAL_MS);
  }, []);

  const beginListening = useCallback(async () => {
    if (isStoppedRef.current) return;

    const recorder = recorderRef.current;
    if (!recorder) return;

    try {
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      turnStartRef.current = Date.now();
      setState('listening');
      startSilenceDetection();
    } catch (err) {
      console.error('beginListening error:', err);
      setError('Recording failed');
    }
  }, [startSilenceDetection]);

  const beginListeningRef = useRef(beginListening);
  beginListeningRef.current = beginListening;

  const start = useCallback(async (recorder: RecorderHandle) => {
    recorderRef.current = recorder;
    isStoppedRef.current = false;
    isProcessingTurnRef.current = false;
    segmentsRef.current = [];
    messagesRef.current = [];
    sessionStartRef.current = Date.now();

    setMessages([]);
    setCurrentAiText('');
    setError(null);
    setIsConnected(true);

    await beginListeningRef.current();
  }, []);

  const stop = useCallback(async (): Promise<ConversationSession | null> => {
    isStoppedRef.current = true;
    clearSilenceTimer();

    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }

    const recorder = recorderRef.current;
    if (recorder) {
      try {
        const { isRecording } = recorder.getStatus();
        if (isRecording) {
          await recorder.stop();
          const rawUri = recorder.uri;
          if (rawUri) {
            const dir = ensureRecordingsDir();
            const destFile = new File(dir, `user_${Date.now()}.m4a`);
            new File(rawUri).move(destFile);
            segmentsRef.current.push({
              speaker: 'user',
              uri: destFile.uri,
              text: '',
              durationMs: Date.now() - turnStartRef.current,
            });
          }
        }
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
    }

    setState('idle');
    setIsConnected(false);
    setCurrentAiText('');

    if (segmentsRef.current.length === 0) return null;

    return {
      id: Date.now().toString(),
      segments: [...segmentsRef.current],
      messages: [...messagesRef.current],
      timestamp: sessionStartRef.current,
      totalDurationMs: Date.now() - sessionStartRef.current,
    };
  }, [clearSilenceTimer]);

  return { state, messages, currentAiText, isConnected, error, start, stop };
}
