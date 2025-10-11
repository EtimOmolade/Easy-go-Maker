import { Badge } from "@/components/ui/badge";
import { Flame, Award, Star, Trophy, Crown } from "lucide-react";

interface StreakBadgeProps {
  streakCount: number;
  size?: "sm" | "md" | "lg";
}

export const getBadgeForStreak = (streak: number) => {
  if (streak >= 50) return { icon: Crown, label: "Prayer Champion", color: "text-yellow-500", bgColor: "bg-yellow-500/10" };
  if (streak >= 20) return { icon: Trophy, label: "Prayer Warrior", color: "text-purple-500", bgColor: "bg-purple-500/10" };
  if (streak >= 10) return { icon: Star, label: "Faithful Servant", color: "text-blue-500", bgColor: "bg-blue-500/10" };
  if (streak >= 1) return { icon: Award, label: "Prayer Starter", color: "text-green-500", bgColor: "bg-green-500/10" };
  return { icon: Flame, label: "Start Your Journey", color: "text-muted-foreground", bgColor: "bg-muted" };
};

const StreakBadge = ({ streakCount, size = "md" }: StreakBadgeProps) => {
  const badge = getBadgeForStreak(streakCount);
  const Icon = badge.icon;
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${badge.bgColor} p-2 rounded-full`}>
        <Icon className={`${badge.color} ${sizeClasses[size]}`} />
      </div>
      <div>
        <p className="font-semibold">{badge.label}</p>
        <p className="text-xs text-muted-foreground">
          {streakCount >= 50 ? "50+ days" : 
           streakCount >= 20 ? "20-49 days" : 
           streakCount >= 10 ? "10-19 days" : 
           streakCount >= 1 ? "1-9 days" : "0 days"}
        </p>
      </div>
    </div>
  );
};

export default StreakBadge;
