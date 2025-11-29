import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock, Flame, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PrayerReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount?: number;
  scriptureVerse?: string;
}

const PrayerReminderModal = ({ isOpen, onClose, streakCount = 0, scriptureVerse }: PrayerReminderModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const handleStartPraying = () => {
    onClose();
    navigate("/guidelines");
  };

  const handleSnooze = async (minutes: number = 30) => {
    if (!user) return;

    setIsSnoozing(true);
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

      const { error } = await supabase
        .from("prayer_reminders")
        .update({ snooze_until: snoozeUntil.toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Reminder snoozed for ${minutes} minutes`);
      onClose();
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      toast.error("Failed to snooze reminder");
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user) return;

    setIsMarking(true);
    try {
      // Check if already prayed today
      const today = new Date().toISOString().split("T")[0];
      const { data: existingPrayer } = await supabase
        .from("daily_prayers")
        .select("id")
        .eq("user_id", user.id)
        .gte("completed_at", today)
        .maybeSingle();

      if (existingPrayer) {
        toast.info("You've already logged your prayer for today!");
        onClose();
        return;
      }

      // Create daily prayer entry
      const { error } = await supabase.from("daily_prayers").insert({
        user_id: user.id,
        day_of_week: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      });

      if (error) throw error;

      toast.success("Prayer marked as completed! 🙏");
      onClose();
    } catch (error) {
      console.error("Error marking prayer complete:", error);
      toast.error("Failed to mark prayer as complete");
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg -z-10" />

        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8 text-white" />
          </div>

          <DialogTitle className="text-2xl text-center font-heading">Time for Prayer 🕊️</DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-3 text-muted-foreground">
          {streakCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-primary font-semibold">
              <Flame className="w-5 h-5" />
              <span>{streakCount} day streak - Keep it going!</span>
            </div>
          )}

          {scriptureVerse && (
            <p className="text-sm italic bg-muted/50 p-3 rounded-lg border border-border">"{scriptureVerse}"</p>
          )}

          <p className="text-base">Take a moment to connect with God through prayer and reflection.</p>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleStartPraying}
            size="lg"
            className="w-full bg-gradient-primary opacity-90 hover:opacity-90 transition-all text-primary-foreground dark:text-white"
          >
            Start Praying Now
          </Button>

          <div className="flex gap-2">
            <Button onClick={() => handleSnooze(15)} variant="outline" size="sm" className="flex-1" disabled={isSnoozing}>
              <Clock className="w-4 h-4 mr-2" />
              {isSnoozing ? "Snoozing..." : "15 min"}
            </Button>

            <Button onClick={() => handleSnooze(30)} variant="outline" size="sm" className="flex-1" disabled={isSnoozing}>
              <Clock className="w-4 h-4 mr-2" />
              {isSnoozing ? "Snoozing..." : "30 min"}
            </Button>

            <Button onClick={handleMarkComplete} variant="outline" size="sm" className="flex-1" disabled={isMarking}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {isMarking ? "Saving..." : "Already Prayed"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrayerReminderModal;
