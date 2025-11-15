import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PrayerReminderModal from "./PrayerReminderModal";

/**
 * ReminderSystem Component
 * Handles time-based reminders using real database data
 * Shows prominent modal popups for prayer reminders
 */
const ReminderSystem = () => {
  const { user } = useAuth();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [scriptureVerse] = useState(
    "Be joyful in hope, patient in affliction, faithful in prayer. - Romans 12:12"
  );

  useEffect(() => {
    if (!user) return;

    const checkReminders = async () => {
      try {
        // Get user's reminder settings
        const { data: reminderSettings, error: settingsError } = await supabase
          .from("prayer_reminders")
          .select("*")
          .eq("user_id", user.id)
          .eq("enabled", true)
          .single();

        if (settingsError) {
          if (settingsError.code === 'PGRST116') {
            // No settings found, create default
            const { error: insertError } = await supabase.from("prayer_reminders").insert({
              user_id: user.id,
              reminder_type: "daily",
              reminder_times: ["07:00", "20:00"],
              notification_methods: ["in-app"],
              enabled: true
            });
            if (insertError) console.error("Error creating default settings:", insertError);
            return;
          }
          throw settingsError;
        }

        // Check if currently snoozed
        if (reminderSettings.snooze_until) {
          const snoozeUntil = new Date(reminderSettings.snooze_until);
          if (snoozeUntil > new Date()) {
            return; // Still snoozed
          }
        }

        // Check if user has prayed today
        const today = new Date().toISOString().split('T')[0];
        const { data: todaysPrayer } = await supabase
          .from("daily_prayers")
          .select("id")
          .eq("user_id", user.id)
          .gte("completed_at", today)
          .maybeSingle();

        if (todaysPrayer) {
          return; // Already prayed today
        }

        // Get user's streak count
        const { data: profile } = await supabase
          .from("profiles")
          .select("streak_count")
          .eq("id", user.id)
          .single();

        if (profile) {
          setStreakCount(profile.streak_count);
        }

        // Check if it's time to show reminder
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const shouldRemind = reminderSettings.reminder_times.some((time: string) => {
          const [hours, minutes] = time.split(':');
          const reminderTime = `${hours}:${minutes}`;
          return currentTime === reminderTime;
        });

        // Only show reminder once per time slot
        const lastReminded = reminderSettings.last_reminded_at 
          ? new Date(reminderSettings.last_reminded_at) 
          : null;
        
        const shouldShowReminder = shouldRemind && (
          !lastReminded || 
          now.getTime() - lastReminded.getTime() > 60000 // At least 1 minute since last reminder
        );

        if (shouldShowReminder) {
          // Create notification in database
          const { data: notification } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'prayer_reminder',
              title: '🕊️ Time for Prayer',
              message: `Keep your ${streakCount} day streak going!`,
              related_type: 'guideline',
              related_id: null,
            })
            .select()
            .single();

          // Send push notification if enabled
          const notificationMethods = reminderSettings.notification_methods || [];
          if (notificationMethods.includes('push')) {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                type: 'prayer_reminder',
                title: '🕊️ Time for Prayer',
                message: `Keep your ${streakCount} day streak going!`,
                url: '/guidelines',
                userId: user.id,
                notificationId: notification?.id,
              },
            });
          }

          // Show in-app modal
          setShowReminderModal(true);
          
          // Update last_reminded_at
          await supabase
            .from("prayer_reminders")
            .update({ 
              last_reminded_at: now.toISOString(),
              snooze_until: null // Clear snooze when showing new reminder
            })
            .eq("user_id", user.id);
        }
      } catch (error) {
        console.error("Error checking reminders:", error);
      }
    };

    // Check immediately on mount
    checkReminders();

    // Check every minute for reminders
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <PrayerReminderModal
      isOpen={showReminderModal}
      onClose={() => setShowReminderModal(false)}
      streakCount={streakCount}
      scriptureVerse={scriptureVerse}
    />
  );
};

export default ReminderSystem;
