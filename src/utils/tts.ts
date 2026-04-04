import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export async function speak(text: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.speak({
        text: text,
        lang: 'ja-JP',
        rate: 0.9,
        pitch: 1.0,
        category: 'ambient',
      });
      return;
    }
  } catch (e) {
    console.error("Capacitor TTS Error:", e);
  }

  // Fallback to Web Speech API for web preview
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
