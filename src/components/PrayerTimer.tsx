import { useEffect, useState } from 'react';
import { Clock, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PrayerTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  autoStart?: boolean;
  label?: string;
}

export const PrayerTimer = ({ duration, onComplete, autoStart = true, label }: PrayerTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          {label && <span className="text-sm font-medium">{label}</span>}
        </div>
        <div className="text-3xl font-bold font-mono">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <Button
        onClick={toggleTimer}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isRunning ? (
          <>
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Resume
          </>
        )}
      </Button>
    </div>
  );
};
