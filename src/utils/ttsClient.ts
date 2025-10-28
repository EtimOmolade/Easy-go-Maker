/**
 * Coqui TTS Client
 * Interfaces with the local TTS server for high-quality voice generation
 */

const TTS_SERVER_URL = 'http://localhost:5000';

let currentAudio: HTMLAudioElement | null = null;

/**
 * Check if TTS server is available
 */
export const isTTSServerAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${TTS_SERVER_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.warn('TTS server not available:', error);
    return false;
  }
};

/**
 * Generate speech from text using Coqui TTS
 * @param text - The text to convert to speech
 * @returns Promise that resolves when speech finishes playing
 */
export const speakWithCoqui = async (text: string): Promise<void> => {
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  try {
    // Request audio synthesis
    const response = await fetch(`${TTS_SERVER_URL}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS server error: ${response.statusText}`);
    }

    // Get audio blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Play audio
    return new Promise((resolve, reject) => {
      currentAudio = new Audio(audioUrl);

      currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        resolve();
      };

      currentAudio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        reject(error);
      };

      currentAudio.play().catch(reject);
    });
  } catch (error) {
    console.error('Coqui TTS error:', error);
    throw error;
  }
};

/**
 * Stop currently playing speech
 */
export const stopCoquiSpeech = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};

/**
 * Get audio URL for text (for caching/preloading)
 * @param text - The text to convert
 * @returns URL to the audio file
 */
export const getCoquiAudioUrl = async (text: string): Promise<string> => {
  try {
    const response = await fetch(`${TTS_SERVER_URL}/synthesize_url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.audio_url;
  } catch (error) {
    console.error('Error getting Coqui audio URL:', error);
    throw error;
  }
};
