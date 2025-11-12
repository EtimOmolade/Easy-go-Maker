-- Create prayer-audio storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prayer-audio',
  'prayer-audio',
  true,
  5242880, -- 5MB limit per file
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Public read access for prayer audio
CREATE POLICY "Public read access for prayer audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'prayer-audio');

-- RLS Policy: Service role can upload (Edge Functions only)
CREATE POLICY "Service role can upload prayer audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prayer-audio');

-- RLS Policy: Service role can update audio files
CREATE POLICY "Service role can update prayer audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prayer-audio');