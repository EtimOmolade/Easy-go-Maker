import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PrayerReminderModal from "./PrayerReminderModal";

const ReminderSystem = () => {
  const { user } = useAuth();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [scriptureVerse] = useState(
    "Be joyful in hope, patient in affliction, faithful in prayer. - Romans 12:12"
  );

  useEffect(() => {
    if (!user) return;

    console.log('🔔 ReminderSystem mounted for user:', user.id);

    const checkReminders = async () => {
      try {
        console.log('⏰ Checking reminders at:', new Date().toLocaleTimeString());

        // Get user's reminder settings
        const { data: reminderSettings, error: settingsError } = await supabase
          .from("prayer_reminders")
          .select("*")
          .eq("user_id", user.id)
          .eq("enabled", true)
          .maybeSingle();

        if (settingsError) {
          console.error("❌ Error fetching reminder settings:", settingsError);
          return;
        }

        if (!reminderSettings) {
          console.log('ℹ️ No reminder settings found or reminders disabled');
          return;
        }

        // Check if currently snoozed
        if (reminderSettings.snooze_until) {
          const snoozeUntil = new Date(reminderSettings.snooze_until);
          const now = new Date();

          if (snoozeUntil > now) {
            const minutesLeft = Math.round((snoozeUntil.getTime() - now.getTime()) / 60000);
            console.log(`⏰ Reminders snoozed for ${minutesLeft} more minutes`);
            return;
          } else {
            console.log(`✅ Snooze expired, clearing...`);
            await supabase
              .from("prayer_reminders")
              .update({ snooze_until: null })
              .eq("user_id", user.id);
          }
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

        console.log('📅 Current time:', currentTime, '| Reminder times:', reminderSettings.reminder_times);

        const shouldRemind = reminderSettings.reminder_times.some((time: string) => {
          const [hours, minutes] = time.split(':');
          const reminderTime = `${hours}:${minutes}`;
          return currentTime === reminderTime;
        });

        // Only show reminder once per time slot (prevent duplicates)
        const lastReminded = reminderSettings.last_reminded_at 
          ? new Date(reminderSettings.last_reminded_at) 
          : null;
        
        const shouldShowReminder = shouldRemind && (
          !lastReminded || 
          now.getTime() - lastReminded.getTime() > 300000 // At least 5 minutes since last reminder
        );

        if (shouldShowReminder) {
          console.log('✅ TRIGGERING REMINDER! Time:', currentTime);

          // Show in-app modal immediately
          setShowReminderModal(true);

          // Create notification in database (this will trigger push notification via DB trigger)
          const { data: notification, error: notifError } = await supabase
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

          if (notifError) {
            console.error('❌ Failed to create notification:', notifError);
          } else {
            console.log('📝 Created notification in database:', notification?.id);
          }

          // Update last_reminded_at to prevent duplicate reminders
          await supabase
            .from("prayer_reminders")
            .update({ 
              last_reminded_at: now.toISOString(),
            })
            .eq("user_id", user.id);
        }
      } catch (error) {
        console.error("❌ Error in checkReminders:", error);
      }
    };

    // Check immediately on mount
    checkReminders();

    // Align subsequent checks to minute boundaries for precise timing
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    const msUntilNextMinute = secondsUntilNextMinute * 1000 - now.getMilliseconds();

    console.log(`⏱️ Next reminder check in ${secondsUntilNextMinute} seconds`);

    let interval: NodeJS.Timeout | null = null;

    // Schedule first aligned check at next minute boundary
    const alignmentTimeout = setTimeout(() => {
      checkReminders();

      // Then check every minute exactly on the minute boundary
      interval = setInterval(checkReminders, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(alignmentTimeout);
      if (interval) clearInterval(interval);
    };
  }, [user, streakCount]);

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
