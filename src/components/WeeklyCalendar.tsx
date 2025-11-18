import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface WeeklyCalendarProps {
  completedDays: string[]; // Array of day names like ['monday', 'tuesday']
  className?: string;
}

const DAYS = [
  { name: 'Sunday', short: 'Sun', key: 'sunday' },
  { name: 'Monday', short: 'Mon', key: 'monday' },
  { name: 'Tuesday', short: 'Tue', key: 'tuesday' },
  { name: 'Wednesday', short: 'Wed', key: 'wednesday' },
  { name: 'Thursday', short: 'Thu', key: 'thursday' },
  { name: 'Friday', short: 'Fri', key: 'friday' },
  { name: 'Saturday', short: 'Sat', key: 'saturday' },
];

export const WeeklyCalendar = ({ completedDays, className = "" }: WeeklyCalendarProps) => {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  return (
    <div className={`flex gap-2 justify-center ${className}`}>
      {DAYS.map((day, index) => {
        const isCompleted = completedDays.includes(day.key);
        const isToday = index === today;

        return (
          <motion.div
            key={day.key}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`
                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                transition-all duration-300 relative
                ${isCompleted
                  ? 'bg-gradient-to-br from-primary to-primary-light shadow-glow'
                  : 'bg-muted/30 border-2 border-muted'}
                ${isToday ? 'ring-2 ring-secondary ring-offset-2' : ''}
              `}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Check className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </motion.div>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  {day.short.charAt(0)}
                </span>
              )}
            </div>
            <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
              {day.short}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
