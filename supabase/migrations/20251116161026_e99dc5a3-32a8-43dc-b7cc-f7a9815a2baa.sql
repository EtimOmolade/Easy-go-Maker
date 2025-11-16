-- Fix generate_daily_guideline function - remove status SELECT
CREATE OR REPLACE FUNCTION public.generate_daily_guideline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_month TEXT;
  current_day INTEGER;
  guideline_title TEXT;
  admin_user_id UUID;
  month_names TEXT[] := ARRAY['January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'];
BEGIN
  -- Log function execution
  RAISE LOG 'generate_daily_guideline() started at %', now();
  
  current_month := month_names[EXTRACT(MONTH FROM CURRENT_DATE)];
  current_day := EXTRACT(DAY FROM CURRENT_DATE);
  guideline_title := 'Daily Guideline - ' || current_month || ' ' || current_day;

  RAISE LOG 'Generating guideline for: % %', current_month, current_day;

  -- Get the first admin user ID
  SELECT user_id INTO admin_user_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE WARNING 'No admin user found for guideline creation';
  ELSE
    RAISE LOG 'Using admin user ID: %', admin_user_id;
  END IF;

  BEGIN
    -- Call the edge function
    PERFORM net.http_post(
      url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/generate-weekly-guideline',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
      ),
      body := jsonb_build_object(
        'month', current_month,
        'day', current_day,
        'title', guideline_title,
        'userId', COALESCE(admin_user_id::text, 'null')
      ),
      timeout_milliseconds := 120000
    );
    
    RAISE LOG 'Successfully triggered generate-weekly-guideline edge function';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error calling generate-weekly-guideline edge function: %', SQLERRM;
  END;
END;
$function$;