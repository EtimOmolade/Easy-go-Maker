-- ============================================
-- SETUP EMAIL CRON JOBS
-- ============================================
-- Instructions:
-- 1. Go to your Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- ============================================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. DAILY PRAYER REMINDER (Every day at 6 PM UTC)
-- ============================================
SELECT cron.schedule(
  'send-daily-prayer-reminders',
  '0 18 * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/send-prayer-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-service-role-key"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- 2. WEEKLY SUMMARY EMAIL (Every Sunday at 8 AM UTC)
-- ============================================
SELECT cron.schedule(
  'send-weekly-summary',
  '0 8 * * 0',
  $$
  SELECT extensions.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/send-weekly-summary',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-service-role-key"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- HELPFUL COMMANDS
-- ============================================

-- View all cron jobs:
-- SELECT * FROM cron.job;

-- Unschedule a job:
-- SELECT cron.unschedule('send-daily-prayer-reminders');
-- SELECT cron.unschedule('send-weekly-summary');

-- Manually test a job:
-- SELECT cron.run_job('send-daily-prayer-reminders');

-- ============================================
-- TODO: BEFORE RUNNING
-- ============================================
-- 1. Replace 'your-project-ref' with your actual Supabase project reference
-- 2. Replace 'your-service-role-key' with your actual service role key
--    (Find both in: Supabase Dashboard → Settings → API)
