-- Phase 1: Clean up duplicate prayer reminder records
-- Keep only the most recent record per user
DELETE FROM prayer_reminders 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM prayer_reminders 
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE prayer_reminders 
ADD CONSTRAINT prayer_reminders_user_id_key UNIQUE (user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_prayer_reminders_user_enabled 
ON prayer_reminders(user_id, enabled);

-- Phase 5: Enable realtime for notifications table
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;