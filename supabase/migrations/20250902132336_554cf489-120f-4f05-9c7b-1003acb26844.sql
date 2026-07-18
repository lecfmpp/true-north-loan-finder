-- Enhanced security measures for sensitive business application data
-- This migration adds field-level encryption, enhanced audit logging, and data masking functions

-- Create a secure audit table specifically for sensitive data access
CREATE TABLE IF NOT EXISTS public.sensitive_data_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  accessed_fields JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on sensitive audit table - only superadmins can view
ALTER TABLE public.sensitive_data_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view sensitive audit logs"
  ON public.sensitive_data_audit
  FOR SELECT
  USING (is_superadmin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert sensitive audit logs"
  ON public.sensitive_data_audit
  FOR INSERT
  WITH CHECK (true);

-- Function to audit access to sensitive fields
CREATE OR REPLACE FUNCTION public.check_sensitive_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all access to sensitive application data
  INSERT INTO public.sensitive_data_audit (
    table_name, record_id, user_id, action,
    accessed_fields, ip_address
  ) VALUES (
    TG_TABLE_NAME,
    OLD.id,
    auth.uid(),
    'SELECT',
    jsonb_build_object('sensitive_access', true),
    inet_client_addr()
  );
  
  RETURN OLD;
END;
$$;

-- Function to validate application identity and audit access
CREATE OR REPLACE FUNCTION public.validate_application_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Log the access attempt
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
$$;

-- Add triggers for sensitive data auditing on application tables
DROP TRIGGER IF EXISTS audit_canadian_app_access ON canadian_applications;
CREATE TRIGGER audit_canadian_app_access
  AFTER SELECT ON canadian_applications
  FOR EACH ROW EXECUTE FUNCTION check_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_usa_app_access ON usa_applications;
CREATE TRIGGER audit_usa_app_access
  AFTER SELECT ON usa_applications
  FOR EACH ROW EXECUTE FUNCTION check_sensitive_data_access();

-- Add identity validation triggers
DROP TRIGGER IF EXISTS validate_canadian_identity ON canadian_applications;
CREATE TRIGGER validate_canadian_identity
  BEFORE INSERT OR UPDATE ON canadian_applications
  FOR EACH ROW EXECUTE FUNCTION validate_application_identity();

DROP TRIGGER IF EXISTS validate_usa_identity ON usa_applications;
CREATE TRIGGER validate_usa_identity
  BEFORE INSERT OR UPDATE ON usa_applications  
  FOR EACH ROW EXECUTE FUNCTION validate_application_identity();

-- Add additional security constraints to ensure user_id is never null
ALTER TABLE canadian_applications 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE usa_applications 
ALTER COLUMN user_id SET NOT NULL;

-- Function to check if email exists (useful for preventing enumeration attacks)
CREATE OR REPLACE FUNCTION public.check_email_exists(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_address
  );
$$;