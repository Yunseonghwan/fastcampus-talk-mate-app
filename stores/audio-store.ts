import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const AUDIO_STORAGE_KEY = 'talk_mate_audio_recordings';

export type AudioRecording = {
  id: string;
  uri: string;
  timestamp: number;
  durationMs: number;
};

export type ConversationSegment = {
  speaker: 'user' | 'ai';
  uri: string;
  text: string;
  durationMs: number;
};

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ConversationSession = {
  id: string;
  segments: ConversationSegment[];
  messages: ConversationMessage[];
  timestamp: number;
  totalDurationMs: number;
};

type PersistedAudioState = {
  recordings: AudioRecording[];
  conversations: ConversationSession[];
};

type AudioState = PersistedAudioState & {
  addRecording: (recording: AudioRecording) => void;
  removeRecording: (id: string) => void;
  clearRecordings: () => void;
  addConversation: (session: ConversationSession) => void;
  removeConversation: (id: string) => void;
};

const secureStorage = {
  getItem: async (name: string) => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) =>
    await SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) =>
    await SecureStore.deleteItemAsync(name),
};

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      recordings: [],
      conversations: [],

      addRecording: (recording) =>
        set((state) => ({
          recordings: [recording, ...state.recordings],
        })),

      removeRecording: (id) =>
        set((state) => ({
          recordings: state.recordings.filter((r) => r.id !== id),
        })),

      clearRecordings: () => set({ recordings: [] }),

      addConversation: (session) =>
        set((state) => ({
          conversations: [session, ...state.conversations],
        })),

      removeConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        })),
    }),
    {
      name: AUDIO_STORAGE_KEY,
      storage: createJSONStorage<PersistedAudioState>(() => secureStorage),
      partialize: (state) => ({
        recordings: state.recordings,
        conversations: state.conversations,
      }),
    },
  ),
);
