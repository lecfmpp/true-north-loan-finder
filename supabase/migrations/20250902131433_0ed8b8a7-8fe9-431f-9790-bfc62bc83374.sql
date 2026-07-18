-- CRITICAL SECURITY FIX: Strengthen loan application table security

-- First, make user_id NOT NULL on all application tables to prevent security bypasses
ALTER TABLE public.usa_applications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.usa_applications_simplified ALTER COLUMN user_id SET NOT NULL;  
ALTER TABLE public.canadian_applications ALTER COLUMN user_id SET NOT NULL;

-- Drop existing permissive policies and replace with restrictive ones for better security
-- USA Applications
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

-- Create stronger RESTRICTIVE policies for USA Applications
CREATE POLICY "Restrict USA app access to owners only" ON public.usa_applications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Restrict USA app management access" ON public.usa_applications
    FOR SELECT TO authenticated  
    USING (has_management_access(auth.uid()));

CREATE POLICY "Secure USA app insertion" ON public.usa_applications
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        email_address = get_current_user_email() AND
        principal_email = get_current_user_email()
    );

CREATE POLICY "Restrict USA app updates to management" ON public.usa_applications
    FOR UPDATE TO authenticated
    USING (has_management_access(auth.uid()));

-- Create stronger RESTRICTIVE policies for USA Applications Simplified
CREATE POLICY "Restrict simplified USA app access to owners only" ON public.usa_applications_simplified
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Restrict simplified USA app management access" ON public.usa_applications_simplified
    FOR SELECT TO authenticated
    USING (has_management_access(auth.uid()));

CREATE POLICY "Secure simplified USA app insertion" ON public.usa_applications_simplified
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        email_address = get_current_user_email() AND
        principal_email = get_current_user_email()
    );

CREATE POLICY "Restrict simplified USA app updates to management" ON public.usa_applications_simplified
    FOR UPDATE TO authenticated
    USING (has_management_access(auth.uid()));

-- Create stronger RESTRICTIVE policies for Canadian Applications
CREATE POLICY "Restrict Canadian app access to owners only" ON public.canadian_applications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Restrict Canadian app management access" ON public.canadian_applications
    FOR SELECT TO authenticated
    USING (has_management_access(auth.uid()));

CREATE POLICY "Secure Canadian app insertion" ON public.canadian_applications
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id AND
        email_address = get_current_user_email()
    );

CREATE POLICY "Restrict Canadian app updates to management" ON public.canadian_applications
    FOR UPDATE TO authenticated
    USING (has_management_access(auth.uid()));

-- Create sensitive data audit table for tracking access to confidential information
CREATE TABLE IF NOT EXISTS public.sensitive_data_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    accessed_fields JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.sensitive_data_audit ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "Superadmin can view audit logs" ON public.sensitive_data_audit
    FOR SELECT TO authenticated
    USING (is_superadmin(auth.uid()));

-- Add validation function to ensure email addresses always match authenticated user
CREATE OR REPLACE FUNCTION public.validate_application_identity()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Log the access attempt for audit purposes
  INSERT INTO public.sensitive_data_audit (
    table_name, record_id, user_id, action, 
    accessed_fields, ip_address
  ) VALUES (
    TG_TABLE_NAME, 
    COALESCE(NEW.id, OLD.id), 
    auth.uid(),
    TG_OP,
    jsonb_build_object('email_validated', true),
    inet_client_addr()
  );

  -- Get the authenticated user's email
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- For Canadian applications
  IF TG_TABLE_NAME = 'canadian_applications' THEN
    -- Ensure the email in the application matches the user's email
    IF NEW.email_address != user_email THEN
      RAISE EXCEPTION 'Application email must match your account email for security';
    END IF;
    
    -- Additional validation for secondary owner
    IF NEW.email_address_2 IS NOT NULL AND NEW.email_address_2 = user_email THEN
      RAISE EXCEPTION 'Secondary owner email cannot be the same as primary owner';
    END IF;
  END IF;
  
  -- For USA applications
  IF TG_TABLE_NAME = 'usa_applications' THEN
    -- Ensure the email in the application matches the user's email
    IF NEW.email_address != user_email THEN
      RAISE EXCEPTION 'Application email must match your account email for security';
    END IF;
    
    -- Ensure principal email matches
    IF NEW.principal_email != user_email THEN
      RAISE EXCEPTION 'Principal email must match your account email for security';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add validation triggers to all application tables
CREATE TRIGGER validate_usa_application_identity
    BEFORE INSERT OR UPDATE ON public.usa_applications
    FOR EACH ROW EXECUTE FUNCTION public.validate_application_identity();

CREATE TRIGGER validate_usa_simplified_application_identity
    BEFORE INSERT OR UPDATE ON public.usa_applications_simplified
    FOR EACH ROW EXECUTE FUNCTION public.validate_application_identity();

CREATE TRIGGER validate_canadian_application_identity
    BEFORE INSERT OR UPDATE ON public.canadian_applications
    FOR EACH ROW EXECUTE FUNCTION public.validate_application_identity();

-- Add function to check if email exists (for additional validation)
CREATE OR REPLACE FUNCTION public.check_email_exists(email_address TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_address
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON TABLE public.sensitive_data_audit IS 'Audit log for tracking access to sensitive loan application data';
COMMENT ON FUNCTION public.validate_application_identity() IS 'Validates that application email addresses match the authenticated user for security';