-- Update trigger function to include prayer_reminder type for email notifications
CREATE OR REPLACE FUNCTION public.trigger_send_notification_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Notification email trigger fired for notification ID: %, type: %', NEW.id, NEW.type;
  
  -- Send emails for important notification types including prayer_reminder
  IF NEW.type IN ('testimony_rejected', 'testimony_approved', 'guideline_new', 'streak_milestone', 'admin_testimony_pending', 'prayer_reminder') THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-notification-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
        ),
        body := jsonb_build_object(
          'notification_id', NEW.id,
          'user_id', NEW.user_id,
          'title', NEW.title,
          'message', NEW.message,
          'type', NEW.type
        ),
        timeout_milliseconds := 30000
      );
      
      RAISE LOG 'Successfully called send-notification-email for notification ID: %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send notification email: %', SQLERRM;
    END;
  ELSE
    RAISE LOG 'Skipping email for notification type: %', NEW.type;
  END IF;
  
  RETURN NEW;
END;
$function$;