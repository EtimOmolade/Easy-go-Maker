/**
 * Haptic Feedback Utility
 * Provides vibration feedback for button presses and interactions
 * Enhances mobile UX with tactile responses
 */

export const haptics = {
  /**
   * Light tap - for regular button presses
   */
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium impact - for important actions
   */
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy impact - for critical actions or errors
   */
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  },

  /**
   * Success pattern - for completed actions
   */
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern - for errors or warnings
   */
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  /**
   * Selection - for selecting items
   */
  selection: () => {
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  },
};

/**
 * Hook for easy haptic feedback in components
 */
export const useHaptics = () => {
  return haptics;
};
