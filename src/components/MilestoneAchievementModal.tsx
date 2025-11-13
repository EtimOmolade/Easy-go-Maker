import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MILESTONES } from "@/data/mockData";
import { Sprout, TreePine, Wheat, Flame, Gem, Crown, Globe } from "lucide-react";

// Helper to get icon component from icon name
const getMilestoneIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Sprout,
    TreePine,
    Wheat,
    Flame,
    Gem,
    Crown,
    Globe
  };
  return icons[iconName] || Sprout;
};

interface MilestoneAchievementModalProps {
  milestoneLevel: number;
  isOpen: boolean;
  onClose: () => void;
}

export const MilestoneAchievementModal = ({
  milestoneLevel,
  isOpen,
  onClose,
}: MilestoneAchievementModalProps) => {
  const [showVerse, setShowVerse] = useState(false);
  const milestone = MILESTONES.find((m) => m.level === milestoneLevel);

  useEffect(() => {
    if (isOpen && milestone) {
      // Play achievement sound
      try {
        const audio = new Audio('/achievement.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Audio play failed:', err));
      } catch (err) {
        console.log('Audio creation failed:', err);
      }

      // Fire confetti in royal blue and gold
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#2E3A87", "#D4AF37", "#4A5FC1"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#2E3A87", "#D4AF37", "#4A5FC1"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Show verse after delay
      setTimeout(() => setShowVerse(true), 500);
    }

    return () => setShowVerse(false);
  }, [isOpen, milestone]);

  if (!milestone) return null;

  const MilestoneIcon = getMilestoneIcon(milestone.icon);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="space-y-6"
          >
            {/* Badge Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 0.6,
                repeat: 2,
                repeatDelay: 0.5
              }}
              className="flex justify-center"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-accent flex items-center justify-center shadow-glow">
                <MilestoneIcon className="h-16 w-16 text-white" />
              </div>
            </motion.div>

            {/* Congratulations */}
            <div>
              <h2 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                Milestone Unlocked!
              </h2>
              <p className="text-2xl font-semibold text-foreground">
                {milestone.name}
              </p>
            </div>

            {/* Scripture Verse */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={showVerse ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="bg-accent/10 rounded-lg p-4 border border-accent/20"
            >
              <p className="text-lg italic text-foreground mb-2">
                "{milestone.scripture}"
              </p>
              <p className="text-sm text-muted-foreground">
                - {milestone.scripture_ref}
              </p>
            </motion.div>

            {/* Progress Count */}
            <p className="text-lg text-muted-foreground">
              You've completed <span className="font-bold text-primary">{milestone.streak_needed}</span> days of prayer!
            </p>

            {/* Close Button */}
            <Button
              onClick={onClose}
              className="w-full bg-gradient-accent hover:opacity-90"
              size="lg"
            >
              Continue Your Journey
            </Button>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
