
-- ============================================
-- PRAYER LIBRARY EMAIL TRIGGER & CRON JOBS (Fixed)
-- ============================================

-- 1. Create function to send announcement emails on new announcement
CREATE OR REPLACE FUNCTION trigger_send_announcement_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-announcement-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('message_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger for announcement emails
DROP TRIGGER IF EXISTS on_announcement_created ON public.encouragement_messages;
CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.encouragement_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_announcement_email();

-- 3. Set up cron jobs for automated emails
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Weekly Summary Email (Every Sunday at 8 AM UTC)
SELECT cron.schedule(
  'send-weekly-summary',
  '0 8 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-weekly-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Daily Prayer Reminder (Every day at 6 PM UTC)
SELECT cron.schedule(
  'send-daily-prayer-reminders',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-prayer-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
