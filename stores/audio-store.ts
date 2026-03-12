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

type PersistedAudioState = {
  recordings: AudioRecording[];
};

type AudioState = PersistedAudioState & {
  addRecording: (recording: AudioRecording) => void;
  removeRecording: (id: string) => void;
  clearRecordings: () => void;
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

      addRecording: (recording) =>
        set((state) => ({
          recordings: [recording, ...state.recordings],
        })),

      removeRecording: (id) =>
        set((state) => ({
          recordings: state.recordings.filter((r) => r.id !== id),
        })),

      clearRecordings: () => set({ recordings: [] }),
    }),
    {
      name: AUDIO_STORAGE_KEY,
      storage: createJSONStorage<PersistedAudioState>(() => secureStorage),
      partialize: (state) => ({ recordings: state.recordings }),
    },
  ),
);
