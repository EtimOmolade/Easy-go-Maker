import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getBadgeForStreak } from "./StreakBadge";
import { Sparkles } from "lucide-react";
import { shouldShowEncouragementPopup } from "@/data/mockData";

interface EncouragementPopupProps {
  streakCount: number;
  previousStreak: number;
}

const getEncouragementMessage = (streak: number) => {
  if (streak === 1) return {
    title: "🎉 You've Started Your Journey!",
    message: "Congratulations on your first day of prayer! Every spiritual journey begins with a single step. Keep going!",
  };
  if (streak === 10) return {
    title: "⭐ 10 Days Strong!",
    message: "Amazing consistency! You've built a solid foundation. Your dedication to prayer is truly inspiring.",
  };
  if (streak === 20) return {
    title: "🏆 20 Days of Faith!",
    message: "Incredible milestone! Your commitment to prayer has become a powerful habit. God is pleased with your faithfulness.",
  };
  if (streak === 50) return {
    title: "👑 50 Days - Prayer Champion!",
    message: "Extraordinary achievement! You are a true prayer warrior. Your devotion is a testimony to others. Keep shining!",
  };
  return null;
};

const EncouragementPopup = ({ streakCount, previousStreak }: EncouragementPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    // Only show popup once per day on first login for milestones
    if (!shouldShowEncouragementPopup()) {
      // Already shown today, don't show again
      return;
    }

    // Check if user just hit a milestone
    const milestones = [1, 10, 20, 50];
    const justHitMilestone = milestones.some(
      milestone => streakCount === milestone && previousStreak < milestone
    );

    if (justHitMilestone) {
      const encouragement = getEncouragementMessage(streakCount);
      if (encouragement) {
        setMessage(encouragement);
        setIsOpen(true);
      }
    }
  }, [streakCount, previousStreak]);

  if (!message) return null;

  const badge = getBadgeForStreak(streakCount);
  const BadgeIcon = badge.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-accent" />
            {message.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center py-4">
            <div className={`${badge.bgColor} p-6 rounded-full`}>
              <BadgeIcon className={`${badge.color} h-16 w-16`} />
            </div>
          </div>
          <p className="text-center text-muted-foreground">{message.message}</p>
          <div className="bg-accent/10 p-4 rounded-lg text-center">
            <p className="font-semibold text-accent mb-1">New Badge Unlocked!</p>
            <p className="text-sm">{badge.label}</p>
          </div>
          <Button onClick={() => setIsOpen(false)} className="w-full">
            Continue Prayer Journey
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EncouragementPopup;
