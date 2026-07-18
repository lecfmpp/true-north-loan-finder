-- Fix security issues by properly updating existing policies

-- 1. Fix lead_sources table security
DROP POLICY IF EXISTS "Anyone can view active lead sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Superadmin can manage lead sources" ON public.lead_sources;

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

-- 2. Fix lead_pricing table security  
DROP POLICY IF EXISTS "Anyone can view active pricing" ON public.lead_pricing;
DROP POLICY IF EXISTS "Superadmin can manage pricing" ON public.lead_pricing;

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

-- 3. Add explicit denial for anonymous access to partners (defense in depth)
DROP POLICY IF EXISTS "Deny anonymous access to partners" ON public.partners;

CREATE POLICY "Deny anonymous access to partners"
ON public.partners
FOR ALL
TO anon
USING (false)
WITH CHECK (false);