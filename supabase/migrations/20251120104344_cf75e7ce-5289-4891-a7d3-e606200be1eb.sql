-- Add voice_preference column to profiles table for prayer audio voice selection
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS voice_preference TEXT DEFAULT 'sarah' 
CHECK (voice_preference IN ('sarah', 'theo', 'megan'));