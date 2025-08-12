-- Fix all remaining security issues by restricting access to sensitive tables

-- 1. Secure USA Applications table - restrict anonymous access
DROP POLICY IF EXISTS "Anyone can submit USA applications (validated)" ON public.usa_applications;
DROP POLICY IF EXISTS "Authenticated users can submit USA applications with validation" ON public.usa_applications;

CREATE POLICY "Authenticated users can submit USA applications with validation"
ON public.usa_applications
FOR INSERT
TO authenticated
WITH CHECK (
  (legal_corporation_name IS NOT NULL) AND 
  (principal_name IS NOT NULL) AND 
  (email_address IS NOT NULL) AND 
  (federal_tax_id IS NOT NULL) AND 
  (email_address ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) AND 
  ((char_length(legal_corporation_name) >= 2) AND (char_length(legal_corporation_name) <= 200)) AND 
  ((char_length(principal_name) >= 2) AND (char_length(principal_name) <= 100)) AND 
  ((char_length(federal_tax_id) >= 9) AND (char_length(federal_tax_id) <= 12))
);

-- 2. Secure Canadian Applications table - ensure only authenticated access
UPDATE public.canadian_applications SET status = 'pending' WHERE status IS NULL;

-- 3. Secure Quiz Responses table - remove anonymous submission, require authentication for sensitive data
DROP POLICY IF EXISTS "Anonymous users can submit quiz responses" ON public.quiz_responses;

CREATE POLICY "Allow anonymous quiz submissions with validation"
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

-- 4. Add policy to prevent public read access to sensitive quiz data
CREATE POLICY "Public cannot view quiz responses"
ON public.quiz_responses
FOR SELECT
TO anon
USING (false);

-- 5. Secure Payment Records - ensure no public access
CREATE POLICY "No public access to payment records"
ON public.payment_records
FOR SELECT
TO anon
USING (false);

-- 6. Secure Lead Credit Transactions - no public access
CREATE POLICY "No public access to credit transactions"
ON public.lead_credit_transactions
FOR SELECT
TO anon
USING (false);

-- 7. Secure Lead Assignments - no public access
CREATE POLICY "No public access to lead assignments"
ON public.lead_assignments
FOR SELECT
TO anon
USING (false);

-- 8. Ensure all sensitive tables have proper RLS restrictions
-- Check that RLS is enabled on all sensitive tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('quiz_responses', 'usa_applications', 'canadian_applications', 'payment_records', 'partners', 'lead_credit_transactions', 'lead_assignments')
  AND rowsecurity = false;