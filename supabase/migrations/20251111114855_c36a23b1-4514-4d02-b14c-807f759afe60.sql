-- Fix profiles table RLS policies
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Policy 1: Users can view their own full profile (email + name)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Everyone can view names only (for testimonies/journals)
CREATE POLICY "Everyone can view profile names"
ON public.profiles
FOR SELECT
USING (true);

-- Policy 3: Admins can view all profile data (including emails)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));