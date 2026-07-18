-- Make application-documents bucket publicly readable and allow public uploads
UPDATE storage.buckets SET public = true WHERE id = 'application-documents';

-- Allow public (anon) to read objects in the application-documents bucket
CREATE POLICY "Public can view application documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'application-documents');

-- Allow public (anon) to upload objects to the application-documents bucket
CREATE POLICY "Public can upload application documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'application-documents');

-- Allow anyone (including anon) to submit USA applications with validation
CREATE POLICY "Anyone can submit USA applications (validated)"
ON public.usa_applications
FOR INSERT
WITH CHECK (
  (legal_corporation_name IS NOT NULL) AND
  (principal_name IS NOT NULL) AND
  (email_address IS NOT NULL) AND
  (federal_tax_id IS NOT NULL) AND
  (email_address ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$') AND
  ((char_length(legal_corporation_name) >= 2) AND (char_length(legal_corporation_name) <= 200)) AND
  ((char_length(principal_name) >= 2) AND (char_length(principal_name) <= 100)) AND
  ((char_length(federal_tax_id) >= 9) AND (char_length(federal_tax_id) <= 12))
);