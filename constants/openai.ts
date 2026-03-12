export const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export const OPENAI_MODELS = {
  chat: 'gpt-4o-mini',
  whisper: 'whisper-1',
  tts: 'tts-1',
} as const;

export const TTS_VOICE = 'nova' as const;

export const CONVERSATION_SYSTEM_PROMPT = `You are a friendly English conversation partner helping the user practice spoken English.
Keep your responses natural, concise (1-3 sentences), and conversational.
If the user makes a grammatical mistake, gently correct it in your response.
Always respond in English. Encourage the user to keep talking.`;

export const SILENCE_THRESHOLD_DB = -40;
export const SILENCE_DURATION_MS = 1500;
export const METERING_INTERVAL_MS = 250;
