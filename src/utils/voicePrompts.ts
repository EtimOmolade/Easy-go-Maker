// Voice prompt utilities for guided prayer sessions
import { isTTSServerAvailable, speakWithCoqui, stopCoquiSpeech } from './ttsClient';

// Initialize voices - voices load asynchronously
let voicesLoaded = false;
let useCoquiTTS = false;

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
  };
  // Trigger voice loading
  window.speechSynthesis.getVoices();
}

// Check if Coqui TTS server is available on initialization
isTTSServerAvailable().then(available => {
  useCoquiTTS = available;
  if (available) {
    console.log('✅ Coqui TTS server detected - using high-quality voice');
  } else {
    console.log('ℹ️ Coqui TTS server not available - using browser voice');
  }
});

export const VOICE_PROMPTS = {
  KINGDOM_START: "Now pray for kingdom purposes. Let's intercede for God's work in the world.",
  KINGDOM_NEXT: "Continue praying for the next kingdom-focused point.",
  PERSONAL_START: "Now bring your personal requests to God. You have five minutes to share what's on your heart.",
  LISTENING_START: "Take a moment to listen and meditate on these scriptures. Let God speak to you.",
  JOURNALING_START: "Open your journal and write down what you sense or learned during prayer.",
  SESSION_COMPLETE: "Well done! You've completed today's prayer session. May God bless you."
};

export const playVoicePrompt = async (text: string) => {
  // Always try Coqui TTS first if available
  if (useCoquiTTS) {
    try {
      await speakWithCoqui(text);
      return;
    } catch (error) {
      console.warn('Coqui TTS failed, falling back to browser voice:', error);
      // Don't disable permanently, might be temporary network issue
    }
  }

  // Fallback to browser's Web Speech API
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Try to select a deep, calm, masculine voice - like a gentle father figure
    const voices = window.speechSynthesis.getVoices();

    // Priority order for natural, deep voices:
    // 1. Look for male voices with "Google" (typically high quality)
    // 2. Look for specific good male voices (Daniel, Alex, etc.)
    // 3. Fall back to any male English voice
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
      console.log('Using voice:', preferredVoice.name); // Debug: see which voice is selected
    }

    // Deep, calm, father-like voice settings
    utterance.rate = 0.75;    // Slower for a calm, contemplative pace
    utterance.pitch = 0.8;    // Lower pitch for deep, masculine tone
    utterance.volume = 0.95;  // Clear but not overwhelming

    window.speechSynthesis.speak(utterance);
  }
};

export const stopVoicePrompt = () => {
  // Stop Coqui TTS if it's being used
  if (useCoquiTTS) {
    stopCoquiSpeech();
  }

  // Stop browser speech synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
