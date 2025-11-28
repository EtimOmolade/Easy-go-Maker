-- Set default reminder times for all existing users who don't have settings
INSERT INTO public.prayer_reminders (user_id, reminder_times, enabled, notification_methods)
SELECT 
  p.id,
  ARRAY['07:00', '20:00']::text[],
  true,
  ARRAY['in-app', 'push']::text[]
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.prayer_reminders pr WHERE pr.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;