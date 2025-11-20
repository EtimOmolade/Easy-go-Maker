import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface FontSizeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

// Font size limits (as percentages)
const MIN_FONT_SIZE = 85;
const MAX_FONT_SIZE = 125;
const DEFAULT_FONT_SIZE = 100;
const FONT_SIZE_STEP = 5;

export const FontSizeProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSizeState] = useState<number>(DEFAULT_FONT_SIZE);

  // Load font size from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    if (savedFontSize) {
      const size = parseInt(savedFontSize, 10);
      if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) {
        setFontSizeState(size);
        applyFontSize(size);
      }
    }
  }, []);

  const applyFontSize = (size: number) => {
    // Apply to document root for global effect
    document.documentElement.style.fontSize = `${size}%`;
  };

  const setFontSize = (size: number) => {
    // Clamp between min and max
    const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
    setFontSizeState(clampedSize);
    localStorage.setItem("fontSize", clampedSize.toString());
    applyFontSize(clampedSize);
  };

  const increaseFontSize = () => {
    setFontSize(fontSize + FONT_SIZE_STEP);
  };

  const decreaseFontSize = () => {
    setFontSize(fontSize - FONT_SIZE_STEP);
  };

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  };

  return (
    <FontSizeContext.Provider
      value={{
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error("useFontSize must be used within a FontSizeProvider");
  }
  return context;
};

// Export constants for use in components
export { MIN_FONT_SIZE, MAX_FONT_SIZE, DEFAULT_FONT_SIZE, FONT_SIZE_STEP };
