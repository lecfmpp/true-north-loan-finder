-- CRITICAL SECURITY FIX: Make user_id NOT NULL and strengthen policies

-- Make user_id NOT NULL on all application tables to prevent security bypasses
ALTER TABLE public.usa_applications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.usa_applications_simplified ALTER COLUMN user_id SET NOT NULL;  
ALTER TABLE public.canadian_applications ALTER COLUMN user_id SET NOT NULL;

-- Drop only existing policies that need to be replaced
DROP POLICY IF EXISTS "Users can view their own USA applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Management can view USA applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Authenticated users can insert their own USA applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Management can update USA applications" ON public.usa_applications;

-- USA Applications Simplified  
DROP POLICY IF EXISTS "Users can view their own USA applications (simplified)" ON public.usa_applications_simplified;
DROP POLICY IF EXISTS "Management users can view USA applications (simplified)" ON public.usa_applications_simplified;
DROP POLICY IF EXISTS "Users can only submit simplified USA applications with their ow" ON public.usa_applications_simplified;
DROP POLICY IF EXISTS "Management users can update USA applications (simplified)" ON public.usa_applications_simplified;

-- Canadian Applications
DROP POLICY IF EXISTS "Users can view their own Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Management can view Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Authenticated users can insert their own Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Management can update Canadian applications" ON public.canadian_applications;

-- Create stronger policies for USA Applications
CREATE POLICY "Users can view only their own USA applications" ON public.usa_applications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Management can view all USA applications" ON public.usa_applications
    FOR SELECT TO authenticated  
    USING (has_management_access(auth.uid()));

CREATE POLICY "Secure USA application creation" ON public.usa_applications
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        email_address = get_current_user_email() AND
        principal_email = get_current_user_email()
    );

CREATE POLICY "Management can update USA applications" ON public.usa_applications
    FOR UPDATE TO authenticated
    USING (has_management_access(auth.uid()));

-- Create stronger policies for USA Applications Simplified
CREATE POLICY "Users can view only their own simplified USA applications" ON public.usa_applications_simplified
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Management can view all simplified USA applications" ON public.usa_applications_simplified
    FOR SELECT TO authenticated
    USING (has_management_access(auth.uid()));

CREATE POLICY "Secure simplified USA application creation" ON public.usa_applications_simplified
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        email_address = get_current_user_email() AND
        principal_email = get_current_user_email()
    );

CREATE POLICY "Management can update simplified USA applications" ON public.usa_applications_simplified
    FOR UPDATE TO authenticated
    USING (has_management_access(auth.uid()));

-- Create stronger policies for Canadian Applications
CREATE POLICY "Users can view only their own Canadian applications" ON public.canadian_applications
    FOR SELECT TO authenticated  
    USING (auth.uid() = user_id);

CREATE POLICY "Management can view all Canadian applications" ON public.canadian_applications
    FOR SELECT TO authenticated
    USING (has_management_access(auth.uid()));

CREATE POLICY "Secure Canadian application creation" ON public.canadian_applications
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        email_address = get_current_user_email()
    );

CREATE POLICY "Management can update Canadian applications" ON public.canadian_applications
    FOR UPDATE TO authenticated
    USING (has_management_access(auth.uid()));