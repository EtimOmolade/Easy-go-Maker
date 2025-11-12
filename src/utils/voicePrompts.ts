// Voice prompt utilities for guided prayer sessions
//
// VOICE DIFFERENTIATION STRATEGY:
// - Voice Prompts: Use MALE voice (Speechmatics 'theo') - calm, deep, father-like
// - Prayer Audio: Use FEMALE voice (Speechmatics 'sarah') - clear, gentle
// This helps users distinguish between guidance and prayer content
//

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

export const playVoicePrompt = async (text: string) => {
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
      currentAudio = new Audio(PROMPT_AUDIO_URLS[promptKey]);
      currentAudio.volume = 0.95;
      await currentAudio.play();
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

    window.speechSynthesis.speak(utterance);
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
