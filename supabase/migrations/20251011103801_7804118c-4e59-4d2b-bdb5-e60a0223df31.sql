-- Add testimony_text column to journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS testimony_text TEXT;

-- Create encouragement_messages table for admin daily encouragements
CREATE TABLE IF NOT EXISTS public.encouragement_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on encouragement_messages
ALTER TABLE public.encouragement_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can view encouragement messages
CREATE POLICY "Everyone can view encouragement messages"
ON public.encouragement_messages
FOR SELECT
USING (true);

-- Only admins can create encouragement messages
CREATE POLICY "Admins can create encouragement messages"
ON public.encouragement_messages
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update encouragement messages
CREATE POLICY "Admins can update encouragement messages"
ON public.encouragement_messages
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete encouragement messages
CREATE POLICY "Admins can delete encouragement messages"
ON public.encouragement_messages
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));