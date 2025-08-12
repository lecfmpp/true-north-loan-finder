-- Fix quiz_responses RLS policy - the current policy is too restrictive for anonymous users
-- Allow anonymous insertions without complex validations, keeping basic required fields

DROP POLICY IF EXISTS "Allow anonymous quiz submissions" ON public.quiz_responses;

CREATE POLICY "Allow anonymous quiz submissions"
ON public.quiz_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (
  loan_amount > 0 
  AND name IS NOT NULL 
  AND email IS NOT NULL 
  AND phone IS NOT NULL
  AND score IS NOT NULL
);