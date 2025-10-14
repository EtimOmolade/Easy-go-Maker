import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { checkAndShowDailyReminder, checkAndShowWeeklyReminder, getUnreadNotifications } from "@/data/mockData";

/**
 * ReminderSystem Component
 * Handles time-based reminders and shows toast notifications
 * This is a background component that doesn't render anything visible
 */
const ReminderSystem = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      // Check daily reminder (7 AM)
      const showedDaily = checkAndShowDailyReminder(user.id);
      if (showedDaily) {
        const notifications = getUnreadNotifications(user.id, false);
        const dailyNotif = notifications.find(n => n.type === 'daily_reminder' && !n.read);
        if (dailyNotif) {
          toast.info(dailyNotif.message, {
            duration: 5000,
          });
        }
      }

      // Check weekly reminder (Monday 6 AM)
      const showedWeekly = checkAndShowWeeklyReminder(user.id);
      if (showedWeekly) {
        const notifications = getUnreadNotifications(user.id, false);
        const weeklyNotif = notifications.find(n => n.type === 'weekly_reminder' && !n.read);
        if (weeklyNotif) {
          toast.info(weeklyNotif.message, {
            duration: 5000,
          });
        }
      }
    };

    // Check immediately on mount
    checkReminders();

    // Check every minute for reminders
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [user]);

  // This component doesn't render anything
  return null;
};

export default ReminderSystem;
