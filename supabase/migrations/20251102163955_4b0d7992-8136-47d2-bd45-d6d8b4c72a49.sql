-- Update prayer_library schema to support month/day organization
ALTER TABLE public.prayer_library
ADD COLUMN IF NOT EXISTS month TEXT,
ADD COLUMN IF NOT EXISTS day INTEGER,
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2025,
ADD COLUMN IF NOT EXISTS intercession_number INTEGER;

-- Create index for efficient month/day queries
CREATE INDEX IF NOT EXISTS idx_prayer_library_month_day 
ON public.prayer_library(month, day, year);

CREATE INDEX IF NOT EXISTS idx_prayer_library_category_date 
ON public.prayer_library(category, month, day);

-- Update guidelines to support flexible date structure
ALTER TABLE public.guidelines
ADD COLUMN IF NOT EXISTS month TEXT,
ADD COLUMN IF NOT EXISTS day INTEGER,
ADD COLUMN IF NOT EXISTS day_of_week TEXT;

-- Create index for guidelines date queries
CREATE INDEX IF NOT EXISTS idx_guidelines_month_day 
ON public.guidelines(month, day);

-- Add placeholder detection field
ALTER TABLE public.prayer_library
ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.prayer_library.month IS 'Month name (e.g., June, July)';
COMMENT ON COLUMN public.prayer_library.day IS 'Day of month (1-31)';
COMMENT ON COLUMN public.prayer_library.is_placeholder IS 'True if this is auto-generated placeholder content';