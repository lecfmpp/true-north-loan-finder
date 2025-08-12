-- Fix all remaining security vulnerabilities identified in the scan

-- 1. Secure lead_sources table - restrict public access to marketing intelligence
DROP POLICY IF EXISTS "Anyone can view active lead sources" ON public.lead_sources;

CREATE POLICY "Management can view lead sources"
ON public.lead_sources
FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can manage lead sources"
ON public.lead_sources
FOR ALL
TO authenticated
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));

-- 2. Secure lead_pricing table - restrict public access to pricing strategy
DROP POLICY IF EXISTS "Anyone can view active pricing" ON public.lead_pricing;

CREATE POLICY "Management can view pricing"
ON public.lead_pricing
FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can manage pricing"
ON public.lead_pricing
FOR ALL
TO authenticated
USING (is_superadmin(auth.uid()));

-- 3. Keep social_proof_notifications public but add note (this is intentionally public for marketing)
-- This table contains marketing content that needs to be publicly accessible for the social proof widget
-- The data is designed to be seen by visitors, so public access is intentional

-- 4. Add explicit policy to deny anonymous access to partners table (defense in depth)
CREATE POLICY "Deny anonymous access to partners"
ON public.partners
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 5. Verify all sensitive business data tables have proper restrictions
-- Check which tables might still be publicly accessible
SELECT 
  t.table_name,
  t.table_schema,
  CASE WHEN pg_class.relrowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_class ON pg_class.relname = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN ('partners', 'lead_sources', 'lead_pricing', 'payment_records', 'quiz_responses', 'lead_assignments')
ORDER BY t.table_name;