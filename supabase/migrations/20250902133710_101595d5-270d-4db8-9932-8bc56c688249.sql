-- Secure Storage: Make application-documents bucket private and add strict RLS policies
UPDATE storage.buckets 
SET public = false 
WHERE id = 'application-documents';

-- Remove overly permissive storage policies for application-documents
DELETE FROM storage.objects WHERE bucket_id = 'application-documents';

-- Create strict RLS policies for application-documents bucket
CREATE POLICY "Users can only access their own application documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'application-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can only upload to their own folder in application-documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'application-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can only update their own application documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'application-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can only delete their own application documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'application-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.uid() IS NOT NULL
);

-- Management can access all documents for support
CREATE POLICY "Management can access all application documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'application-documents' AND 
  public.has_management_access(auth.uid())
);

-- Keep blog-images bucket public with existing policies (no changes needed)
-- Blog images should remain publicly accessible for website performance