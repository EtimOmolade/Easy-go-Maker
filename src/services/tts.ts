/**
 * Text-to-Speech Service
 * Attempts Google Cloud TTS first, falls back to Web Speech API
 */

interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: 'sarah' | 'theo' | 'megan' | string;
  onEnd?: () => void;
}

let currentAudio: HTMLAudioElement | null = null;

// Map user voice preferences to Google Cloud TTS voice names
const GOOGLE_VOICE_MAP: Record<string, string> = {
  sarah: 'en-US-Neural2-F', // Gentle female voice
  theo: 'en-US-Neural2-D',  // Calm male voice
  megan: 'en-US-Neural2-C', // Warm expressive female voice
};

/**
 * Speaks text using Google Cloud TTS with Web Speech API fallback
 * @param text - The text to speak
 * @param options - Voice configuration options
 */
export async function speak(text: string, options: TTSOptions = {}): Promise<void> {
  const { rate = 1, pitch = 1, volume = 1, voice = 'sarah', onEnd } = options;

  // Try Google Cloud TTS first if API key is available
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_TTS_API_KEY;

  if (apiKey) {
    const googleVoiceName = GOOGLE_VOICE_MAP[voice] || GOOGLE_VOICE_MAP.sarah;
    console.log(`🎙️ TTS Service: Attempting ${voice} (${googleVoiceName}) via Google TTS`);
    try {
      await speakWithGoogleTTS(text, { rate, pitch, volume, voice, onEnd });
      return;
    } catch (error) {
      console.warn('⚠️ Google Cloud TTS failed, falling back to Web Speech API:', error);
      // Fall through to Web Speech API
    }
  } else {
    console.log('🎙️ Using Web Speech API (Google TTS API key not set)');
  }

  // Fallback to Web Speech API
  speakWithWebSpeech(text, { rate, pitch, volume, voice, onEnd });
}

/**
 * Speaks text using Google Cloud Text-to-Speech API
 */
async function speakWithGoogleTTS(
  text: string,
  options: TTSOptions
): Promise<void> {
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_TTS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Cloud TTS API key not configured');
  }

  const voiceName = GOOGLE_VOICE_MAP[options.voice || 'sarah'] || 'en-US-Neural2-F';

  // Prepare the request
  const request = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: options.rate || 1,
      pitch: options.pitch || 1,
      volumeGainDb: options.volume ? (options.volume - 1) * 16 : 0, // Convert 0-1 to dB
    },
  };

  // Make API call
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.audioContent) {
    throw new Error('No audio content in response');
  }

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Play the audio
  currentAudio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
  currentAudio.volume = options.volume || 1;

  if (options.onEnd) {
    currentAudio.onended = () => {
      currentAudio = null;
      options.onEnd!();
    };
  }

  await currentAudio.play();
}

/**
 * Speaks text using Web Speech API (fallback)
 */
function speakWithWebSpeech(text: string, options: TTSOptions): void {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;

  // Voice selection strategy for Web Speech API (System Voices)
  const voices = window.speechSynthesis.getVoices();
  const selectedVoiceKey = options.voice || 'sarah';

  // Try to match voice gender
  const isMale = selectedVoiceKey === 'theo';

  let preferredVoice = voices.find(v =>
    v.lang.startsWith('en') &&
    (isMale ?
      (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('James')) :
      (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen')))
  );

  // Fallback to any English voice
  if (!preferredVoice) {
    preferredVoice = voices.find(v => v.lang.startsWith('en'));
  }

  if (preferredVoice) {
    console.log(`⚠️ TTS Service: Falling back to System Voice: ${preferredVoice.name}`);
    utterance.voice = preferredVoice;
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Cancels any ongoing speech (both Google TTS and Web Speech)
 */
export function cancelSpeech(): void {
  // Cancel Web Speech API
  window.speechSynthesis.cancel();

  // Stop Google TTS audio if playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

/**
 * Pauses any currently playing TTS audio (without stopping it)
 * Allows resuming from the same position
 */
export function pauseTTS(): void {
  // Pause Web Speech API
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }

  // Pause Google TTS audio if playing
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
  }
}

/**
 * Resumes paused TTS audio from where it was paused
 */
export function resumeTTS(): void {
  // Resume Web Speech API
  if ('speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // Resume Google TTS audio if paused
  if (currentAudio && currentAudio.paused) {
    currentAudio.play().catch(err => console.warn('Resume TTS audio failed:', err));
  }
}

/**
 * Speaks text twice consecutively (for intercession prayers)
 */
export async function speakTwice(text: string, options: TTSOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    const firstOptions = {
      ...options,
      onEnd: async () => {
        // Speak second time after first completes
        const secondOptions = {
          ...options,
          onEnd: () => {
            if (options.onEnd) {
              options.onEnd();
            }
            resolve();
          },
        };
        await speak(text, secondOptions);
      },
    };
    speak(text, firstOptions);
  });
}
