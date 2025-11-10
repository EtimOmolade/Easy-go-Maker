-- Create user_2fa table for storing OTP codes
CREATE TABLE IF NOT EXISTS public.user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  otp_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Policies for user_2fa
CREATE POLICY "Users can view own 2FA settings"
  ON public.user_2fa
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings"
  ON public.user_2fa
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings"
  ON public.user_2fa
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own 2FA settings"
  ON public.user_2fa
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add 2FA enabled flag to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- Function to clean expired OTPs
CREATE OR REPLACE FUNCTION public.clean_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_2fa
  WHERE otp_expires_at < now() AND is_verified = false;
END;
$$;

-- Schedule cron job to clean expired OTPs every 10 minutes
SELECT cron.schedule(
  'clean-expired-otps',
  '*/10 * * * *',
  $$
  SELECT public.clean_expired_otps();
  $$
);