-- Fix push notification triggers to use hardcoded URLs instead of current_setting

CREATE OR REPLACE FUNCTION public.trigger_send_push_for_guideline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
    ),
    body := jsonb_build_object(
      'type', 'guideline_new',
      'title', '🕊️ New Prayer Guideline Available',
      'message', COALESCE(NEW.month, '') || ' ' || COALESCE(NEW.day::TEXT, '') || ' - ' || NEW.title,
      'url', '/guidelines',
      'userId', NULL
    )
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_send_push_for_encouragement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Send push notification to all users (NO notification center entry)
  PERFORM net.http_post(
    url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
    ),
    body := jsonb_build_object(
      'type', 'encouragement',
      'title', '📢 Community Update',
      'message', NEW.content,
      'url', '/dashboard',
      'userId', NULL
    ),
    timeout_milliseconds := 60000
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_send_push_for_testimony()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM net.http_post(
      url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
      ),
      body := jsonb_build_object(
        'type', 'testimony_approved',
        'title', '✨ New Testimony Shared',
        'message', 'A new testimony has been approved! Check it out.',
        'url', '/testimonies',
        'userId', NULL
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_streak_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  -- Check if milestone reached (7, 30, 100, 365 days)
  IF NEW.streak_count IN (7, 30, 100, 365) AND 
     (OLD.streak_count IS NULL OR OLD.streak_count != NEW.streak_count) THEN
    
    -- Create notification in database (personal)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      related_type
    ) VALUES (
      NEW.id,
      'streak_milestone',
      '🔥 Streak Milestone Reached!',
      'Congratulations on ' || NEW.streak_count || ' days of consecutive prayer!',
      'profile'
    ) RETURNING id INTO notification_id;
    
    -- Send push notification
    PERFORM net.http_post(
      url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
      ),
      body := jsonb_build_object(
        'type', 'streak_milestone',
        'title', '🔥 Streak Milestone Reached!',
        'message', 'Congratulations on ' || NEW.streak_count || ' days!',
        'url', '/profile',
        'userId', NEW.id,
        'notificationId', notification_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;