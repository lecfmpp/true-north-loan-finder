-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', false);

-- Create policies for application documents
CREATE POLICY "Users can upload application documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Management can view application documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'application-documents' AND public.has_management_access(auth.uid()));

CREATE POLICY "Management can delete application documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'application-documents' AND public.has_management_access(auth.uid()));

-- Add document_files column to business_applications table
ALTER TABLE public.business_applications 
ADD COLUMN document_files JSONB DEFAULT '[]'::jsonb;

-- Update quiz_responses status to 'pre_qualified' for existing records
UPDATE public.quiz_responses 
SET status = 'pre_qualified' 
WHERE status = 'new';

-- Update business_applications status to 'applicant' for existing records  
UPDATE public.business_applications 
SET status = 'applicant' 
WHERE status = 'pending';

-- Update status check constraints
ALTER TABLE public.quiz_responses 
DROP CONSTRAINT IF EXISTS quiz_responses_status_check;

ALTER TABLE public.quiz_responses 
ADD CONSTRAINT quiz_responses_status_check 
CHECK (status IN ('pre_qualified', 'contacted', 'converted', 'closed'));

ALTER TABLE public.business_applications 
DROP CONSTRAINT IF EXISTS business_applications_status_check;

ALTER TABLE public.business_applications 
ADD CONSTRAINT business_applications_status_check 
CHECK (status IN ('applicant', 'in_review', 'approved', 'rejected'));