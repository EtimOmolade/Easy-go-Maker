-- Fix security warnings: Set search_path for trigger functions

CREATE OR REPLACE FUNCTION trigger_send_push_for_encouragement()
RETURNS TRIGGER AS $$
BEGIN
  -- Send push notification to all users (NO notification center entry)
  PERFORM net.http_post(
    url := current_setting('app.settings.api_url', true) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION trigger_send_push_for_guideline()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.api_url', true) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION trigger_send_push_for_testimony()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.api_url', true) || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION trigger_streak_milestone()
RETURNS TRIGGER AS $$
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
      url := current_setting('app.settings.api_url', true) || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;