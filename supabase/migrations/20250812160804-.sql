-- Fix quiz submission issue by updating the RLS policy
-- The issue is that the quiz is trying to submit anonymously but we broke that in the previous migration

DROP POLICY IF EXISTS "Allow anonymous quiz submissions with validation" ON public.quiz_responses;
DROP POLICY IF EXISTS "Public cannot view quiz responses" ON public.quiz_responses;

-- Allow anonymous quiz submissions with proper validation (this is needed for the quiz to work)
CREATE POLICY "Anonymous users can submit quiz responses with validation"
ON public.quiz_responses
FOR INSERT
TO anon
WITH CHECK (
  (name IS NOT NULL) AND 
  (email IS NOT NULL) AND 
  (phone IS NOT NULL) AND 
  (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) AND 
  ((char_length(name) >= 2) AND (char_length(name) <= 100)) AND 
  ((char_length(phone) >= 10) AND (char_length(phone) <= 20))
);

-- Prevent anonymous users from reading quiz responses (security fix)
CREATE POLICY "Anonymous users cannot view quiz responses"
ON public.quiz_responses
FOR SELECT
TO anon
USING (false);