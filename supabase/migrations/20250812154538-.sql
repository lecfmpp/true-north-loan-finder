-- Fix critical security vulnerability: Remove overly permissive RLS policy
-- The "Public can read their own quiz response by ID" policy currently allows 
-- ANY user to read ALL quiz responses due to "Using Expression: true"

-- Drop the problematic policy that allows public read access to all quiz responses
DROP POLICY IF EXISTS "Public can read their own quiz response by ID" ON public.quiz_responses;

-- The remaining policies properly restrict access:
-- 1. Anonymous users can submit quiz responses (INSERT only)
-- 2. Management can view/update quiz responses (for admin purposes)  
-- 3. Partners can update shared_notes on assigned leads (limited access)
-- 4. Superadmin can delete quiz responses (admin maintenance)

-- This ensures customer PII (names, emails, phones) is only accessible to:
-- - Management users (admins, lenders, brokers) who need it for business operations
-- - Partners who can only update shared_notes on their assigned leads
-- - No public/anonymous access to read sensitive customer data