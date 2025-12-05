-- Fix 1: Recreate public_profile_info view with SECURITY INVOKER
-- This ensures the view respects RLS policies of the underlying profiles table

DROP VIEW IF EXISTS public.public_profile_info;

CREATE VIEW public.public_profile_info
WITH (security_invoker = true)
AS
SELECT id, name
FROM public.profiles;

-- Grant select to authenticated users only
GRANT SELECT ON public.public_profile_info TO authenticated;

-- Fix 2: Drop the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more restrictive policy that only allows service_role to insert
-- This prevents anonymous users from creating notifications
CREATE POLICY "Service role can create notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add policy for authenticated users to create their own notifications (for app functionality)
CREATE POLICY "Users can create own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);