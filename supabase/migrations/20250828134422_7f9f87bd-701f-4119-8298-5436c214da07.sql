-- Fix security issues in sensitive application table RLS policies

-- Fix usa_applications policies - ensure only authenticated users can access
DROP POLICY IF EXISTS "Management users can update USA applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Management users can view USA applications" ON public.usa_applications;  
DROP POLICY IF EXISTS "Superadmin can delete USA applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Users can only submit USA applications with their own email" ON public.usa_applications;

-- Recreate with proper security
CREATE POLICY "Management users can update USA applications" ON public.usa_applications
FOR UPDATE TO authenticated 
USING (has_management_access(auth.uid()));

CREATE POLICY "Management users can view USA applications" ON public.usa_applications
FOR SELECT TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete USA applications" ON public.usa_applications
FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can only submit USA applications with their own email" ON public.usa_applications
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND legal_corporation_name IS NOT NULL 
  AND principal_name IS NOT NULL 
  AND email_address IS NOT NULL 
  AND federal_tax_id IS NOT NULL 
  AND email_address ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND char_length(legal_corporation_name) >= 2 
  AND char_length(legal_corporation_name) <= 200
  AND char_length(principal_name) >= 2 
  AND char_length(principal_name) <= 100
  AND char_length(federal_tax_id) >= 9 
  AND char_length(federal_tax_id) <= 12
  AND email_address = get_current_user_email() 
  AND principal_email = get_current_user_email()
  AND user_id = auth.uid()  -- Additional security: ensure user_id matches
);

-- Fix usa_applications_simplified policies
DROP POLICY IF EXISTS "Management users can update USA applications (simplified)" ON public.usa_applications_simplified;
DROP POLICY IF EXISTS "Management users can view USA applications (simplified)" ON public.usa_applications_simplified;
DROP POLICY IF EXISTS "Superadmin can delete USA applications (simplified)" ON public.usa_applications_simplified;
DROP POLICY IF EXISTS "Users can only submit simplified USA applications with their ow" ON public.usa_applications_simplified;
DROP POLICY IF EXISTS "Users can view their own USA applications (simplified)" ON public.usa_applications_simplified;

-- Recreate with proper security  
CREATE POLICY "Management users can update USA applications (simplified)" ON public.usa_applications_simplified
FOR UPDATE TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Management users can view USA applications (simplified)" ON public.usa_applications_simplified  
FOR SELECT TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete USA applications (simplified)" ON public.usa_applications_simplified
FOR DELETE TO authenticated  
USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can only submit simplified USA applications with their own email" ON public.usa_applications_simplified
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND principal_email = get_current_user_email()
  AND user_id = auth.uid()  -- Additional security: ensure user_id matches
);

CREATE POLICY "Users can view their own USA applications (simplified)" ON public.usa_applications_simplified
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix canadian_applications policies - ensure only authenticated users  
DROP POLICY IF EXISTS "Management users can update Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Management users can view Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Superadmin can delete Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Users can only submit applications with their own email" ON public.canadian_applications;

-- Recreate with proper security
CREATE POLICY "Management users can update Canadian applications" ON public.canadian_applications
FOR UPDATE TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Management users can view Canadian applications" ON public.canadian_applications
FOR SELECT TO authenticated  
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete Canadian applications" ON public.canadian_applications
FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can only submit Canadian applications with their own email" ON public.canadian_applications
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND email_address = get_current_user_email()
  AND user_id = auth.uid()  -- Additional security: ensure user_id matches
);

-- Ensure all sensitive application tables have RLS enabled
ALTER TABLE public.usa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usa_applications_simplified ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.canadian_applications ENABLE ROW LEVEL SECURITY;