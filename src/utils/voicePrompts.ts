// Voice prompt utilities for guided prayer sessions
//
// VOICE DIFFERENTIATION STRATEGY:
// - Voice Prompts: Use MALE voice (Speechmatics 'theo') - calm, deep, father-like
// - Prayer Audio: Use FEMALE voice (Speechmatics 'sarah') - clear, gentle
// This helps users distinguish between guidance and prayer content
//

import {
  cacheVoicePrompt,
  getCachedVoicePrompt,
  downloadAndCacheVoicePrompts,
} from './offlineStorage';

// Base URL for pre-generated voice prompts (Speechmatics audio files)
const VOICE_PROMPT_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/prayer-audio/voice-prompts`;

export const VOICE_PROMPTS = {
  KINGDOM_START: "Now pray for kingdom purposes. Let's intercede for God's work in the world.",
  KINGDOM_NEXT: "Continue praying for the next kingdom-focused point.",
  PERSONAL_START: "Now bring your personal requests to God. You have five minutes to share what's on your heart.",
  LISTENING_START: "Take a moment to listen and meditate on these scriptures. Let God speak to you.",
  JOURNALING_START: "Open your journal and write down what you sense or learned during prayer.",
  SESSION_COMPLETE: "Well done! You've completed today's prayer session. May God bless you."
};

// Map prompt keys to audio file URLs
const PROMPT_AUDIO_URLS: Record<string, string> = {
  KINGDOM_START: `${VOICE_PROMPT_BASE_URL}/kingdom-start.wav`,
  KINGDOM_NEXT: `${VOICE_PROMPT_BASE_URL}/kingdom-next.wav`,
  PERSONAL_START: `${VOICE_PROMPT_BASE_URL}/personal-start.wav`,
  LISTENING_START: `${VOICE_PROMPT_BASE_URL}/listening-start.wav`,
  JOURNALING_START: `${VOICE_PROMPT_BASE_URL}/journaling-start.wav`,
  SESSION_COMPLETE: `${VOICE_PROMPT_BASE_URL}/session-complete.wav`,
};

let currentAudio: HTMLAudioElement | null = null;

// Track which prompts have been played in this session to prevent replays
const playedPrompts = new Set<string>();

/**
 * Plays a voice prompt with automatic replay prevention
 * @param text - The prompt text to play
 * @param options - Optional configuration
 * @param options.force - Force play even if already played (default: false)
 * @param options.onEnd - Callback when prompt finishes playing
 */
export const playVoicePrompt = async (
  text: string,
  options?: { force?: boolean; onEnd?: () => void }
) => {
  const { force = false, onEnd } = options || {};

  // Check if already played (unless forced)
  if (!force && playedPrompts.has(text)) {
    console.log(`⏭️ Voice prompt already played, skipping: "${text.substring(0, 40)}..."`);
    // CRITICAL FIX: Still call onEnd callback to maintain sequential audio flow
    if (onEnd) {
      console.log('📞 Calling onEnd callback despite skipped prompt to trigger prayer audio');
      onEnd();
    }
    return;
  }

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Find the audio URL for this prompt text
  const promptKey = Object.keys(VOICE_PROMPTS).find(
    key => VOICE_PROMPTS[key as keyof typeof VOICE_PROMPTS] === text
  );

  if (promptKey && PROMPT_AUDIO_URLS[promptKey]) {
    // Use pre-generated Speechmatics audio (male voice)
    try {
      // Check cache first for offline support
      const cached = await getCachedVoicePrompt(promptKey);
      let audioUrl: string;

      if (cached && cached.blob) {
        // Use cached blob for offline playback
        audioUrl = URL.createObjectURL(cached.blob);
        console.log(`📦 Using cached voice prompt: ${promptKey}`);
      } else {
        // Use network URL and cache for next time
        audioUrl = PROMPT_AUDIO_URLS[promptKey];
        console.log(`🌐 Loading voice prompt from network: ${promptKey}`);

        // Fetch and cache asynchronously (don't block playback)
        fetch(audioUrl)
          .then(response => response.blob())
          .then(blob => cacheVoicePrompt(promptKey, audioUrl, blob))
          .catch(err => console.warn(`Failed to cache voice prompt ${promptKey}:`, err));
      }

      currentAudio = new Audio(audioUrl);
      currentAudio.volume = 0.95;

      // Add onended handler for callback and cleanup
      currentAudio.onended = () => {
        // Revoke blob URL if it was created from cache
        if (cached && cached.blob) {
          URL.revokeObjectURL(audioUrl);
        }
        currentAudio = null;
        if (onEnd) onEnd();
      };

      await currentAudio.play();

      // Mark as played AFTER successful playback start
      playedPrompts.add(text);
      console.log(`✅ Playing Speechmatics voice prompt: ${promptKey}`);
      return;
    } catch (error) {
      console.warn('Failed to play Speechmatics audio, falling back to browser TTS:', error);
    }
  }

  // Fallback to browser's Web Speech API if audio file not available
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Try to select a deep, calm, masculine voice
    const preferredVoice =
      voices.find(voice =>
        voice.lang.startsWith('en') &&
        voice.name.includes('Google') &&
        !voice.name.includes('Female')
      ) ||
      voices.find(voice =>
        voice.lang.startsWith('en') &&
        (voice.name.includes('Daniel') ||
         voice.name.includes('Alex') ||
         voice.name.includes('James') ||
         voice.name.includes('Male') ||
         voice.name.toLowerCase().includes('male'))
      ) ||
      voices.find(voice =>
        voice.lang.startsWith('en') &&
        !voice.name.includes('Female')
      ) ||
      voices.find(voice => voice.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.75;
    utterance.pitch = 0.8;
    utterance.volume = 0.95;

    // Add onend handler for callback
    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);

    // Mark as played AFTER starting TTS
    playedPrompts.add(text);
    console.log('⚠️ Using fallback browser TTS for voice prompt');
  }
};

export const stopVoicePrompt = () => {
  // Stop Speechmatics audio if playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Stop browser speech synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const pauseVoicePrompt = () => {
  // Pause Speechmatics audio (don't stop, keep reference)
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
  }

  // Pause browser speech synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
};

export const resumeVoicePrompt = () => {
  // Resume Speechmatics audio
  if (currentAudio && currentAudio.paused) {
    currentAudio.play().catch(err => console.warn('Resume voice prompt failed:', err));
  }

  // Resume browser speech synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
};

/**
 * Resets voice prompt tracking for a new prayer session
 * Call this when starting a new session to allow prompts to play again
 */
export const resetVoicePromptTracking = () => {
  playedPrompts.clear();
  console.log('🔄 Voice prompt tracking reset for new session');
};

/**
 * Pre-cache all voice prompts for offline use
 * Call this during app initialization or when network is available
 * Downloads all 6 voice prompt audio files in the background
 */
export const initializeVoicePromptCache = async (): Promise<void> => {
  try {
    const prompts = Object.keys(PROMPT_AUDIO_URLS).map(key => ({
      name: key,
      url: PROMPT_AUDIO_URLS[key],
    }));

    await downloadAndCacheVoicePrompts(prompts);
    console.log('🎙️ Voice prompt cache initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize voice prompt cache:', error);
  }
};
