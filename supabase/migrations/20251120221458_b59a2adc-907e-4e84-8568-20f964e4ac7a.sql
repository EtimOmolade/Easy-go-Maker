-- Add audio_urls column to prayer_library for multi-voice support
ALTER TABLE prayer_library 
ADD COLUMN IF NOT EXISTS audio_urls JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN prayer_library.audio_urls IS 'Stores multiple voice audio URLs: {"sarah": "url1", "theo": "url2", "megan": "url3"}';

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_prayer_library_audio_urls ON prayer_library USING GIN (audio_urls);