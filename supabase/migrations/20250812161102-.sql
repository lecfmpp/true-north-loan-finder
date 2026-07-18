-- Fix quiz submission RLS policy issue
-- The problem is likely that the quiz is still signed out when trying to submit

-- First, check if RLS is enabled
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'quiz_responses';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anonymous users can submit quiz responses with validation" ON public.quiz_responses;
DROP POLICY IF EXISTS "Anonymous users cannot view quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Management can view quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Management can update quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Partners can update shared_notes on assigned leads" ON public.quiz_responses;
DROP POLICY IF EXISTS "Superadmin can delete quiz responses" ON public.quiz_responses;

-- Recreate policies with proper anonymous access for submissions
CREATE POLICY "Allow anonymous quiz submissions"
ON public.quiz_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (name IS NOT NULL) AND 
  (email IS NOT NULL) AND 
  (phone IS NOT NULL) AND 
  (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) AND 
  ((char_length(name) >= 2) AND (char_length(name) <= 100)) AND 
  ((char_length(phone) >= 10) AND (char_length(phone) <= 20))
);

-- Secure viewing policies
CREATE POLICY "Management can view quiz responses"
ON public.quiz_responses
FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can update quiz responses"
ON public.quiz_responses
FOR UPDATE
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Partners can update shared_notes on assigned leads"
ON public.quiz_responses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners p
    WHERE p.user_id = auth.uid() AND p.id = quiz_responses.assigned_partner_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM partners p
    WHERE p.user_id = auth.uid() AND p.id = quiz_responses.assigned_partner_id
  )
);

CREATE POLICY "Superadmin can delete quiz responses"
ON public.quiz_responses
FOR DELETE
TO authenticated
USING (is_superadmin(auth.uid()));

-- Prevent anonymous reading (security)
CREATE POLICY "Deny anonymous read access"
ON public.quiz_responses
FOR SELECT
TO anon
USING (false);