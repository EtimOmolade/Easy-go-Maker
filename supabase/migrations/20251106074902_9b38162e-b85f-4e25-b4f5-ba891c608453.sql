-- Fix search path security issue for trigger function
DROP FUNCTION IF EXISTS public.trigger_send_announcement_email() CASCADE;

CREATE OR REPLACE FUNCTION public.trigger_send_announcement_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-announcement-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
    ),
    body := jsonb_build_object('message_id', NEW.id)
  );
  RETURN NEW;
END;
$function$;

-- Fix search path security issue for generate guideline function
DROP FUNCTION IF EXISTS public.generate_daily_guideline() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_daily_guideline()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_month TEXT;
  current_day INTEGER;
  guideline_title TEXT;
  month_names TEXT[] := ARRAY['January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'];
BEGIN
  current_month := month_names[EXTRACT(MONTH FROM CURRENT_DATE)];
  current_day := EXTRACT(DAY FROM CURRENT_DATE);
  guideline_title := 'Daily Guideline - ' || current_month || ' ' || current_day;

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
      'userId', '00000000-0000-0000-0000-000000000000'
    )
  );
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS send_announcement_email_trigger ON public.encouragement_messages;

CREATE TRIGGER send_announcement_email_trigger
  AFTER INSERT ON public.encouragement_messages
  FOR EACH ROW
  WHEN (NEW.type = 'announcement')
  EXECUTE FUNCTION public.trigger_send_announcement_email();