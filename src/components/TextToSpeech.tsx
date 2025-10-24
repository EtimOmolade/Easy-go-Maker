import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { toast } from "sonner";

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
}

export const TextToSpeech = ({ text, autoPlay = false }: TextToSpeechProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if browser supports speech synthesis
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in your browser");
      return;
    }

    // Clean up on unmount
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech is not supported");
      return;
    }

    // If currently speaking, pause it
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    // If paused, resume
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Start new speech
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure voice settings
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      toast.error("Failed to play audio");
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSpeak}
        disabled={!text}
      >
        {isPlaying && !isPaused ? (
          <>
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </>
        ) : isPaused ? (
          <>
            <Play className="h-4 w-4 mr-2" />
            Resume
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4 mr-2" />
            Listen
          </>
        )}
      </Button>
      
      {isPlaying && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
        >
          <VolumeX className="h-4 w-4 mr-2" />
          Stop
        </Button>
      )}
    </div>
  );
};
