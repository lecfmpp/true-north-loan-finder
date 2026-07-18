-- Fix security vulnerability in broker_signups table by requiring authentication

-- 1) Remove the public INSERT policy that allows anonymous submissions
DROP POLICY IF EXISTS "Public can submit broker signups" ON public.broker_signups;

-- 2) Create a new policy that requires authentication and email validation
CREATE POLICY "Authenticated users can submit broker signups with email validation"
ON public.broker_signups
FOR INSERT 
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL 
  AND
  -- Email must match authenticated user's email
  applicant_email = get_current_user_email()
  AND
  -- Keep existing validation checks
  applicant_name IS NOT NULL 
  AND applicant_email IS NOT NULL 
  AND company_name IS NOT NULL 
  AND applicant_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text 
  AND char_length(applicant_name) >= 2 
  AND char_length(applicant_name) <= 100 
  AND char_length(company_name) >= 2 
  AND char_length(company_name) <= 200 
  AND (applicant_phone IS NULL OR char_length(applicant_phone) >= 10)
);

-- 3) Add a policy to allow users to view their own broker signups
CREATE POLICY "Users can view their own broker signups"
ON public.broker_signups
FOR SELECT
USING (applicant_email = get_current_user_email());