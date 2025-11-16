-- Step 1: Drop unused tables
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.prayer_points CASCADE;

-- Step 2: Clean up RLS policies on encouragement_messages
-- Drop the duplicate INSERT policy
DROP POLICY IF EXISTS "Admins and system can create announcements" ON public.encouragement_messages;

-- Keep only one INSERT policy with proper admin check
DROP POLICY IF EXISTS "Admins can create encouragement messages" ON public.encouragement_messages;
CREATE POLICY "Admins can create encouragement messages"
ON public.encouragement_messages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add a new policy for system/trigger inserts (using security definer context)
CREATE POLICY "System can create messages"
ON public.encouragement_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 3: Update trigger to handle both 'general' and 'testimony_approved' types
CREATE OR REPLACE FUNCTION public.trigger_send_encouragement_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Encouragement email trigger fired for message ID: %, type: %', NEW.id, NEW.type;
  
  -- Send email for both general announcements and testimony approvals
  IF NEW.type IN ('general', 'testimony_approved') THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-announcement-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
        ),
        body := jsonb_build_object('message_id', NEW.id),
        timeout_milliseconds := 60000
      );
      
      RAISE LOG 'Successfully called send-announcement-email for message ID: %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send encouragement email: %', SQLERRM;
    END;
  ELSE
    RAISE LOG 'Skipping email for message type: %', NEW.type;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Update generate_daily_guideline function with better logging
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
  http_response INTEGER;
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
    SELECT status INTO http_response
    FROM net.http_post(
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
    
    RAISE LOG 'Edge function response status: %', http_response;
    
    IF http_response >= 200 AND http_response < 300 THEN
      RAISE LOG 'Successfully generated daily guideline for % %', current_month, current_day;
    ELSE
      RAISE WARNING 'Edge function returned non-success status: %', http_response;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error calling generate-weekly-guideline edge function: %', SQLERRM;
  END;
END;
$function$;