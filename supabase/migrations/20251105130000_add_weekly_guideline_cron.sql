-- ============================================
-- WEEKLY PRAYER GUIDELINE AUTO-GENERATION CRON JOB
-- ============================================
-- This migration creates a cron job that automatically generates
-- prayer guidelines every week using the prayer library data.
--
-- Schedule: Every Sunday at midnight (00:00 UTC)
-- Generates: Guidelines for the upcoming week (7 days)
-- ============================================

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- APPROACH 1: Generate Daily (Recommended)
-- Runs every day at midnight and generates guideline for that day
-- ============================================

-- Daily Guideline Generation (Every day at 00:30 UTC)
SELECT cron.schedule(
  'generate-daily-guideline',
  '30 0 * * *',  -- 00:30 UTC daily
  $cmd$
  DO $body$
  DECLARE
    current_month TEXT;
    current_day INTEGER;
    guideline_title TEXT;
    month_names TEXT[] := ARRAY['January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
  BEGIN
    -- Get current date info
    current_month := month_names[EXTRACT(MONTH FROM CURRENT_DATE)];
    current_day := EXTRACT(DAY FROM CURRENT_DATE);
    guideline_title := 'Daily Guideline - ' || current_month || ' ' || current_day;

    -- Call the generate-weekly-guideline edge function
    PERFORM net.http_post(
      url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/generate-weekly-guideline',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'month', current_month,
        'day', current_day,
        'title', guideline_title,
        'userId', '00000000-0000-0000-0000-000000000000'  -- System user
      )
    );
  END $body$;
  $cmd$
);

-- ============================================
-- APPROACH 2: Generate Weekly (Alternative)
-- Runs every Sunday and generates 7 guidelines for the week
-- ============================================
-- NOTE: This is commented out. Use EITHER Approach 1 OR Approach 2, not both.
-- Uncomment the section below if you prefer weekly batch generation.

/*
SELECT cron.schedule(
  'generate-weekly-guidelines',
  '0 1 * * 0',  -- 01:00 UTC every Sunday
  $$
  DO $$
  DECLARE
    day_offset INTEGER;
    target_date DATE;
    target_month TEXT;
    target_day INTEGER;
    guideline_title TEXT;
    month_names TEXT[] := ARRAY['January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
  BEGIN
    -- Generate guidelines for the next 7 days (current week)
    FOR day_offset IN 0..6 LOOP
      target_date := CURRENT_DATE + day_offset;
      target_month := month_names[EXTRACT(MONTH FROM target_date)];
      target_day := EXTRACT(DAY FROM target_date);
      guideline_title := 'Weekly Guideline - ' || target_month || ' ' || target_day;

      -- Call the generate-weekly-guideline edge function for each day
      PERFORM net.http_post(
        url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/generate-weekly-guideline',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'month', target_month,
          'day', target_day,
          'title', guideline_title,
          'userId', '00000000-0000-0000-0000-000000000000'  -- System user
        )
      );

      -- Small delay between requests (optional)
      PERFORM pg_sleep(0.5);
    END LOOP;
  END $$;
  $$
);
*/

-- ============================================
-- HELPFUL COMMANDS FOR MANAGING CRON JOBS
-- ============================================

-- View all cron jobs:
-- SELECT * FROM cron.job ORDER BY jobname;

-- Unschedule the daily cron job:
-- SELECT cron.unschedule('generate-daily-guideline');

-- Unschedule the weekly cron job:
-- SELECT cron.unschedule('generate-weekly-guidelines');

-- Manually test the daily job:
-- SELECT cron.run_job('generate-daily-guideline');

-- View cron job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- ============================================
-- NOTES:
-- ============================================
-- 1. The cron job uses UTC timezone
-- 2. Adjust the schedule time ('30 0 * * *') as needed
-- 3. The userId is set to a system UUID - update if needed
-- 4. Guidelines are marked as auto-generated (is_auto_generated: true)
-- 5. Make sure service_role_key is properly configured in app.settings
