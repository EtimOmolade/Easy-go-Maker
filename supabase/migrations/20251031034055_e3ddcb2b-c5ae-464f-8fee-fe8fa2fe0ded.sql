-- Phase 1: Database Schema Migration for SpiritConnect Backend
-- This migration adds missing columns and creates new tables while preserving existing data

-- ============================================
-- 1. ALTER EXISTING TABLES - Add Missing Columns
-- ============================================

-- Add voice note support to journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS voice_note_url TEXT;

-- Add comprehensive testimony tracking columns
ALTER TABLE public.testimonies 
ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS audio_note TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS resubmitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- ============================================
-- 2. CREATE NEW TABLES
-- ============================================

-- Prayer Library Table (Admin-managed prayer content pool)
CREATE TABLE IF NOT EXISTS public.prayer_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_used BOOLEAN DEFAULT false,
  week_number INTEGER,
  day_of_week TEXT CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'))
);

-- Daily Prayer Completion Tracking (for gamification)
CREATE TABLE IF NOT EXISTS public.daily_prayers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guideline_id UUID REFERENCES public.guidelines(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, guideline_id, day_of_week)
);

-- Audit Logs Table (for admin action tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.prayer_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Prayer Library Policies
CREATE POLICY "Admins can manage prayer library"
ON public.prayer_library
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view prayer library"
ON public.prayer_library
FOR SELECT
USING (true);

-- Daily Prayers Policies
CREATE POLICY "Users can view own daily prayers"
ON public.daily_prayers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily prayers"
ON public.daily_prayers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily prayers"
ON public.daily_prayers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_daily_prayers_user_id ON public.daily_prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_prayers_guideline_id ON public.daily_prayers(guideline_id);
CREATE INDEX IF NOT EXISTS idx_daily_prayers_completed_at ON public.daily_prayers(completed_at);
CREATE INDEX IF NOT EXISTS idx_prayer_library_category ON public.prayer_library(category);
CREATE INDEX IF NOT EXISTS idx_prayer_library_is_used ON public.prayer_library(is_used);
CREATE INDEX IF NOT EXISTS idx_testimonies_status ON public.testimonies(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================
-- 6. CREATE TRIGGER FOR STREAK TRACKING
-- ============================================

-- Update the existing streak trigger to work with daily_prayers table
CREATE OR REPLACE FUNCTION public.update_streak_from_daily_prayer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_date DATE;
  current_streak INTEGER;
BEGIN
  SELECT last_journal_date, streak_count
  INTO last_date, current_streak
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- If completing prayer today for the first time
  IF last_date IS NULL OR last_date < CURRENT_DATE THEN
    -- Check if it's consecutive day
    IF last_date = CURRENT_DATE - 1 THEN
      -- Increment streak
      UPDATE public.profiles
      SET streak_count = current_streak + 1,
          last_journal_date = CURRENT_DATE
      WHERE id = NEW.user_id;
    ELSIF last_date < CURRENT_DATE - 1 OR last_date IS NULL THEN
      -- Reset streak to 1
      UPDATE public.profiles
      SET streak_count = 1,
          last_journal_date = CURRENT_DATE
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on daily_prayers table
DROP TRIGGER IF EXISTS update_streak_on_daily_prayer ON public.daily_prayers;
CREATE TRIGGER update_streak_on_daily_prayer
AFTER INSERT ON public.daily_prayers
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_from_daily_prayer();

-- ============================================
-- 7. CREATE AUDIT LOG TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to key tables
DROP TRIGGER IF EXISTS audit_testimonies ON public.testimonies;
CREATE TRIGGER audit_testimonies
AFTER INSERT OR UPDATE OR DELETE ON public.testimonies
FOR EACH ROW
EXECUTE FUNCTION public.create_audit_log();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.create_audit_log();

DROP TRIGGER IF EXISTS audit_guidelines ON public.guidelines;
CREATE TRIGGER audit_guidelines
AFTER INSERT OR UPDATE OR DELETE ON public.guidelines
FOR EACH ROW
EXECUTE FUNCTION public.create_audit_log();