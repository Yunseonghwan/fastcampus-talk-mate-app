import { Directory, File, Paths } from 'expo-file-system';

import {
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MODELS,
  TTS_VOICE,
} from '@/constants/openai';

const ensureRecordingsDir = (): Directory => {
  const dir = new Directory(Paths.document, 'recordings');
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
};

export async function synthesizeSpeech(text: string): Promise<string> {
  const res = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODELS.tts,
      voice: TTS_VOICE,
      input: text,
    }),
  });

  if (!res.ok) throw new Error(`TTS API error: ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();
  const dir = ensureRecordingsDir();
  const filename = `ai_tts_${Date.now()}.mp3`;
  const file = new File(dir, filename);
  file.create({ overwrite: true });
  file.write(new Uint8Array(arrayBuffer));
  return file.uri;
}
