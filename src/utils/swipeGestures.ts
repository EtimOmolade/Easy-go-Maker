/**
 * Swipe Gesture Detection Utility
 * Enables swipe-based navigation for mobile users
 */

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  threshold?: number; // Minimum distance for swipe (default: 50px)
  timeout?: number; // Maximum time for swipe (default: 300ms)
}

export const useSwipeGestures = (
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) => {
  const { threshold = 50, timeout = 300 } = config;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;

    // Check if swipe was fast enough
    if (deltaTime > timeout) return;

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * React Hook for swipe gestures
 */
import { useEffect, useRef } from "react";

export const useSwipe = (handlers: SwipeHandlers, config?: SwipeConfig) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const gestures = useSwipeGestures(handlers, config);

    element.addEventListener("touchstart", gestures.onTouchStart as any);
    element.addEventListener("touchend", gestures.onTouchEnd as any);

    return () => {
      element.removeEventListener("touchstart", gestures.onTouchStart as any);
      element.removeEventListener("touchend", gestures.onTouchEnd as any);
    };
  }, [handlers, config]);

  return ref;
};
