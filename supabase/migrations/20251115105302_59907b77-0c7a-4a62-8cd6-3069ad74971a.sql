-- Phase 1: Create notifications table for personal reminders only
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'prayer_reminder', 'streak_milestone', 'journal_reminder', 'achievement'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT, -- 'guideline', 'journal', 'profile'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can create notifications (via triggers and functions)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Phase 8: Trigger for encouragement messages (PUSH ONLY, NO notification center)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_encouragement_send_push
  AFTER INSERT ON public.encouragement_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_push_for_encouragement();

-- Phase 9: Trigger for new guidelines (PUSH ONLY, NO notification center)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_guideline_send_push
  AFTER INSERT ON public.guidelines
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_push_for_guideline();

-- Phase 10: Trigger for testimony approvals (PUSH ONLY, NO notification center)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_testimony_approved_send_push
  AFTER UPDATE ON public.testimonies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_push_for_testimony();

-- Phase 11: Trigger for streak milestones (BOTH notification center AND push)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_streak_milestone
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_streak_milestone();