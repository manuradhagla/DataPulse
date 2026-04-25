
-- Add storage_path column to datasets (nullable for backward compat)
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Create private bucket for original uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('dataset-files', 'dataset-files', false)
ON CONFLICT (id) DO NOTHING;

-- Users can read their own files (folder = their user id)
CREATE POLICY "Users read own dataset files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dataset-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can read all dataset files
CREATE POLICY "Admins read all dataset files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dataset-files'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Users can upload to their own folder
CREATE POLICY "Users upload own dataset files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dataset-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users delete own dataset files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dataset-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
