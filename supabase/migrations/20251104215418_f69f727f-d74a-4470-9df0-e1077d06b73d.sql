-- ========================================
-- 1.1 Testimonies Table - Add Missing Columns
-- ========================================
ALTER TABLE public.testimonies
ADD COLUMN IF NOT EXISTS alias TEXT NOT NULL DEFAULT 'Anonymous Seeker',
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS related_series TEXT,
ADD COLUMN IF NOT EXISTS gratitude_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.testimonies.alias IS 'User display name for testimony (replaces profiles.name)';
COMMENT ON COLUMN public.testimonies.location IS 'Optional location (e.g., "Lagos, Nigeria")';
COMMENT ON COLUMN public.testimonies.related_series IS 'Links testimony to a prayer guideline series';
COMMENT ON COLUMN public.testimonies.gratitude_count IS 'Number of users who celebrated this testimony';

-- ========================================
-- 1.2 Encouragement Messages - Add INSERT Policy & Type Column
-- ========================================
ALTER TABLE public.encouragement_messages
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

COMMENT ON COLUMN public.encouragement_messages.type IS 'Announcement category: general, guideline_new, testimony_pending, testimony_approved';

DROP POLICY IF EXISTS "Admins and system can create announcements" ON public.encouragement_messages;
CREATE POLICY "Admins and system can create announcements"
ON public.encouragement_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ========================================
-- 1.3 Testimony Gratitudes Table - Track Celebrations
-- ========================================
CREATE TABLE IF NOT EXISTS public.testimony_gratitudes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(testimony_id, user_id)
);

ALTER TABLE public.testimony_gratitudes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view testimony gratitudes" ON public.testimony_gratitudes;
CREATE POLICY "Everyone can view testimony gratitudes"
ON public.testimony_gratitudes
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can add their own gratitudes" ON public.testimony_gratitudes;
CREATE POLICY "Users can add their own gratitudes"
ON public.testimony_gratitudes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own gratitudes" ON public.testimony_gratitudes;
CREATE POLICY "Users can delete their own gratitudes"
ON public.testimony_gratitudes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_testimony_gratitudes_testimony_id ON public.testimony_gratitudes(testimony_id);
CREATE INDEX IF NOT EXISTS idx_testimony_gratitudes_user_id ON public.testimony_gratitudes(user_id);

COMMENT ON TABLE public.testimony_gratitudes IS 'Tracks which users have celebrated (thanked God with) each testimony - prevents duplicate celebrations';

-- ========================================
-- 1.4 Prayer Points Table - Create for Prayer Library Migration
-- ========================================
CREATE TABLE IF NOT EXISTS public.prayer_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Kingdom Focused', 'Personal Supplication', 'Listening Prayer')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view prayer points" ON public.prayer_points;
CREATE POLICY "Everyone can view prayer points"
ON public.prayer_points
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can insert prayer points" ON public.prayer_points;
CREATE POLICY "Admins can insert prayer points"
ON public.prayer_points
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update prayer points" ON public.prayer_points;
CREATE POLICY "Admins can update prayer points"
ON public.prayer_points
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete prayer points" ON public.prayer_points;
CREATE POLICY "Admins can delete prayer points"
ON public.prayer_points
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_prayer_points_category ON public.prayer_points(category);

COMMENT ON TABLE public.prayer_points IS 'Prayer library - stores intercession, personal, and listening prayer templates';

-- ========================================
-- 1.5 Storage Bucket Setup
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own voice notes" ON storage.objects;
CREATE POLICY "Users can upload their own voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Voice notes are publicly accessible" ON storage.objects;
CREATE POLICY "Voice notes are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "Users can delete their own voice notes" ON storage.objects;
CREATE POLICY "Users can delete their own voice notes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);