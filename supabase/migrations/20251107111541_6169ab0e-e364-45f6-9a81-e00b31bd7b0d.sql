-- Drop the old trigger that creates announcements
DROP TRIGGER IF EXISTS on_guideline_created ON public.guidelines;

-- Create new trigger function that creates encouragement messages instead
CREATE OR REPLACE FUNCTION public.create_guideline_encouragement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into encouragement_messages instead of announcements
  INSERT INTO public.encouragement_messages (
    content,
    type,
    created_by
  ) VALUES (
    '🕊️ New Prayer Guideline Available!' || E'\n\n' || 
    'Title: ' || NEW.title || E'\n' ||
    'Tap to begin your prayer journey for ' || NEW.month || ' ' || NEW.day || '.',
    'general',
    NEW.created_by
  );
  RETURN NEW;
END;
$$;

-- Create trigger on guidelines table
CREATE TRIGGER on_guideline_created
  AFTER INSERT ON public.guidelines
  FOR EACH ROW
  EXECUTE FUNCTION public.create_guideline_encouragement();

-- Create trigger on encouragement_messages to send emails
CREATE OR REPLACE FUNCTION public.trigger_send_encouragement_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only send email if it's a general encouragement (like guideline notifications)
  IF NEW.type = 'general' THEN
    PERFORM net.http_post(
      url := 'https://wmdtsdicaonrdtcfqyyr.supabase.co/functions/v1/send-announcement-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHRzZGljYW9ucmR0Y2ZxeXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDc5MywiZXhwIjoyMDc1NjYwNzkzfQ.pBBXmD3BzAGmLJKDWvKzYjT0XEh8qYF-7LqPr8vOPEQ'
      ),
      body := jsonb_build_object('message_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on encouragement_messages
DROP TRIGGER IF EXISTS on_encouragement_created ON public.encouragement_messages;
CREATE TRIGGER on_encouragement_created
  AFTER INSERT ON public.encouragement_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_encouragement_email();