-- Create trigger to send push notifications for prayer reminders
CREATE OR REPLACE FUNCTION public.trigger_send_push_for_reminder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  push_enabled BOOLEAN;
BEGIN
  -- Only process prayer_reminder type notifications
  IF NEW.type != 'prayer_reminder' THEN
    RETURN NEW;
  END IF;

  -- Check if user has push notifications enabled for reminders
  SELECT 'push' = ANY(notification_methods)
  INTO push_enabled
  FROM public.prayer_reminders
  WHERE user_id = NEW.user_id
    AND enabled = true;

  -- Send push notification if enabled
  IF push_enabled THEN
    PERFORM net.http_post(
      url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
      ),
      body := jsonb_build_object(
        'type', 'reminder',
        'title', NEW.title,
        'message', NEW.message,
        'url', '/guidelines',
        'userId', NEW.user_id::text,
        'notificationId', NEW.id::text
      ),
      timeout_milliseconds := 5000
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on notifications table
CREATE TRIGGER on_reminder_notification_send_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_push_for_reminder();