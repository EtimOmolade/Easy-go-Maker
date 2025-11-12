-- Update prayer-audio bucket to accept audio/wav files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav']
WHERE name = 'prayer-audio';