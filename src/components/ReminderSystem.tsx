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

    console.log('🔔 ReminderSystem mounted for user:', user.id);

    const checkReminders = async () => {
      try {
        console.log('⏰ Checking reminders at:', new Date().toLocaleTimeString());

        // Get user's reminder settings
        let { data: reminderSettings, error: settingsError } = await supabase
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

            if (insertError) {
              console.error("❌ Failed to create default settings:", insertError);
              throw insertError;
            }

            console.log('✅ Created default reminder settings, checking current time...');

            // Set reminderSettings to the defaults we just created
            reminderSettings = {
              user_id: user.id,
              reminder_type: "daily",
              reminder_times: ["07:00", "20:00"],
              notification_methods: ["in-app"],
              enabled: true,
              snooze_until: null,
              last_reminded_at: null,
            };

            // Continue execution to check reminder times
          } else {
            throw settingsError;
          }
        }

        // Check if currently snoozed
        if (reminderSettings.snooze_until) {
          const snoozeUntil = new Date(reminderSettings.snooze_until);
          const now = new Date();

          if (snoozeUntil > now) {
            const minutesLeft = Math.round((snoozeUntil.getTime() - now.getTime()) / 60000);
            console.log(`⏰ Reminders snoozed until ${snoozeUntil.toLocaleTimeString()} (${minutesLeft} minutes remaining)`);
            return; // Still snoozed
          } else {
            console.log(`✅ Snooze expired at ${snoozeUntil.toLocaleTimeString()}, clearing and resuming reminders`);

            // Clear expired snooze from database
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

        // Only show reminder once per time slot
        const lastReminded = reminderSettings.last_reminded_at 
          ? new Date(reminderSettings.last_reminded_at) 
          : null;
        
        const shouldShowReminder = shouldRemind && (
          !lastReminded || 
          now.getTime() - lastReminded.getTime() > 60000 // At least 1 minute since last reminder
        );

        if (shouldShowReminder) {
          console.log('✅ TRIGGERING REMINDER! Time:', currentTime);

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

          console.log('📝 Created notification in database:', notification?.id);

          // Send push notification if enabled
          const notificationMethods = reminderSettings.notification_methods || [];
          if (notificationMethods.includes('push')) {
            console.log('📲 Sending push notification...');
            const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                type: 'prayer_reminder',
                title: '🕊️ Time for Prayer',
                message: `Keep your ${streakCount} day streak going!`,
                url: '/guidelines',
                userId: user.id,
                notificationId: notification?.id,
              },
            });

            if (pushError) {
              console.error('❌ Push notification failed:', pushError);
            } else {
              console.log('✅ Push notification sent successfully:', pushData);
            }
          }

          // Show in-app modal
          console.log('🔔 Showing in-app reminder modal');
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

    // Align subsequent checks to minute boundaries for precise timing
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    const msUntilNextMinute = secondsUntilNextMinute * 1000 - now.getMilliseconds();

    console.log(`⏱️ Next reminder check in ${secondsUntilNextMinute} seconds (at ${new Date(Date.now() + msUntilNextMinute).toLocaleTimeString()})`);

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
