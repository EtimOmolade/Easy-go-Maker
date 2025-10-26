// Voice prompt utilities for guided prayer sessions

export const VOICE_PROMPTS = {
  KINGDOM_START: "Now pray for kingdom purposes. Let's intercede for God's work in the world.",
  KINGDOM_NEXT: "Continue praying for the next kingdom-focused point.",
  PERSONAL_START: "Now bring your personal requests to God. You have five minutes to share what's on your heart.",
  LISTENING_START: "Take a moment to listen and meditate on these scriptures. Let God speak to you.",
  JOURNALING_START: "Open your journal and write down what you sense or learned during prayer.",
  SESSION_COMPLETE: "Well done! You've completed today's prayer session. May God bless you."
};

export const playVoicePrompt = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  }
};

export const stopVoicePrompt = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
