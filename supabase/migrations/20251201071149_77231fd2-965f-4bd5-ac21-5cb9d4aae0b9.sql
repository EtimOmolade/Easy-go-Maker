-- ============================================
-- SECURITY FIX: Profiles Table RLS
-- ============================================
-- Drop the overly permissive policy that exposes all data
DROP POLICY IF EXISTS "Everyone can view profile names" ON public.profiles;

-- Create a view that only exposes safe profile data (id and name)
-- This prevents email exposure while allowing name lookups
CREATE OR REPLACE VIEW public.public_profile_info AS
SELECT id, name
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profile_info TO anon, authenticated;

-- Create a more restrictive policy for the profiles table itself
-- Only allow viewing own full profile or admin viewing all
CREATE POLICY "Users can view own full profile or public view"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);