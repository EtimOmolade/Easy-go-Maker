-- Create prayer_reminders table for storing user reminder preferences
CREATE TABLE public.prayer_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'daily' CHECK (reminder_type IN ('daily', 'weekly', 'custom')),
  reminder_times TEXT[] NOT NULL DEFAULT ARRAY['07:00', '20:00'],
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  notification_methods TEXT[] NOT NULL DEFAULT ARRAY['in-app'],
  enabled BOOLEAN NOT NULL DEFAULT true,
  snooze_until TIMESTAMP WITH TIME ZONE,
  custom_message TEXT,
  last_reminded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prayer_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminders
CREATE POLICY "Users can view own reminders"
  ON public.prayer_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reminders
CREATE POLICY "Users can create own reminders"
  ON public.prayer_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reminders
CREATE POLICY "Users can update own reminders"
  ON public.prayer_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reminders
CREATE POLICY "Users can delete own reminders"
  ON public.prayer_reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all reminders
CREATE POLICY "Admins can view all reminders"
  ON public.prayer_reminders
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_prayer_reminders_updated_at
  BEFORE UPDATE ON public.prayer_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_prayer_reminders_user_id ON public.prayer_reminders(user_id);
CREATE INDEX idx_prayer_reminders_enabled ON public.prayer_reminders(enabled) WHERE enabled = true;