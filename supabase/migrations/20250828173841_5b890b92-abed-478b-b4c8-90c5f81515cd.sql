-- Enhanced Security for Application Tables

-- Create audit log table for sensitive data access
CREATE TABLE public.sensitive_data_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL, -- 'select', 'insert', 'update', 'delete'
  accessed_fields JSONB, -- track which sensitive fields were accessed
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.sensitive_data_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for audit table (only superadmin can view)
CREATE POLICY "Superadmin can view audit logs"
ON public.sensitive_data_audit
FOR SELECT
USING (is_superadmin(auth.uid()));

-- Create indexes for efficient audit log queries
CREATE INDEX idx_sensitive_audit_table_record ON public.sensitive_data_audit (table_name, record_id);
CREATE INDEX idx_sensitive_audit_user_time ON public.sensitive_data_audit (user_id, created_at);

-- Enhanced validation function for application identity with audit logging
CREATE OR REPLACE FUNCTION public.validate_application_identity()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check sensitive data access permissions
CREATE OR REPLACE FUNCTION public.check_sensitive_data_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate access to specific sensitive fields
CREATE OR REPLACE FUNCTION public.validate_sensitive_field_access(
  p_user_id UUID,
  p_record_owner_id UUID,
  p_table_name TEXT,
  p_record_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Log the field access attempt
  INSERT INTO public.sensitive_data_audit (
    table_name, record_id, user_id, action,
    accessed_fields, ip_address
  ) VALUES (
    p_table_name,
    p_record_id,
    p_user_id,
    'FIELD_ACCESS',
    jsonb_build_object('field_validation', true),
    inet_client_addr()
  );
  
  -- Allow if user is management or the owner
  RETURN (
    has_management_access(p_user_id) OR 
    p_user_id = p_record_owner_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for canadian_applications
DROP POLICY IF EXISTS "Users can only submit Canadian applications with their own emai" ON public.canadian_applications;
DROP POLICY IF EXISTS "Users can view their own Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Management users can view Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Management users can update Canadian applications" ON public.canadian_applications;
DROP POLICY IF EXISTS "Superadmin can delete Canadian applications" ON public.canadian_applications;

-- Recreate with enhanced security
CREATE POLICY "Authenticated users can insert their own Canadian applications"
ON public.canadian_applications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  email_address = get_current_user_email() AND
  user_id = auth.uid() AND
  validate_sensitive_field_access(auth.uid(), user_id, 'canadian_applications', id)
);

CREATE POLICY "Users can view their own Canadian applications with audit"
ON public.canadian_applications
FOR SELECT
USING (
  auth.uid() = user_id AND
  validate_sensitive_field_access(auth.uid(), user_id, 'canadian_applications', id)
);

CREATE POLICY "Management can view Canadian applications with audit"
ON public.canadian_applications
FOR SELECT
USING (
  has_management_access(auth.uid()) AND
  validate_sensitive_field_access(auth.uid(), user_id, 'canadian_applications', id)
);

CREATE POLICY "Management can update Canadian applications with audit"
ON public.canadian_applications
FOR UPDATE
USING (
  has_management_access(auth.uid()) AND
  validate_sensitive_field_access(auth.uid(), user_id, 'canadian_applications', id)
);

CREATE POLICY "Superadmin can delete Canadian applications with audit"
ON public.canadian_applications
FOR DELETE
USING (
  is_superadmin(auth.uid()) AND
  validate_sensitive_field_access(auth.uid(), user_id, 'canadian_applications', id)
);

-- Enhanced RLS policies for usa_applications
DROP POLICY IF EXISTS "Users can only submit USA applications with their own email" ON public.usa_applications;
DROP POLICY IF EXISTS "Users can view their own USA applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Management users can view USA applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Management users can update USA applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Superadmin can delete USA applications" ON public.usa_applications;

-- Recreate with enhanced security
CREATE POLICY "Authenticated users can insert their own USA applications"
ON public.usa_applications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  email_address = get_current_user_email() AND
  principal_email = get_current_user_email() AND
  user_id = auth.uid() AND
  validate_sensitive_field_access(auth.uid(), user_id, 'usa_applications', id)
);

CREATE POLICY "Users can view their own USA applications with audit"
ON public.usa_applications
FOR SELECT
USING (
  auth.uid() = user_id AND
  validate_sensitive_field_access(auth.uid(), user_id, 'usa_applications', id)
);

CREATE POLICY "Management can view USA applications with audit"
ON public.usa_applications
FOR SELECT
USING (
  has_management_access(auth.uid()) AND
  validate_sensitive_field_access(auth.uid(), user_id, 'usa_applications', id)
);

CREATE POLICY "Management can update USA applications with audit"
ON public.usa_applications
FOR UPDATE
USING (
  has_management_access(auth.uid()) AND
  validate_sensitive_field_access(auth.uid(), user_id, 'usa_applications', id)
);

CREATE POLICY "Superadmin can delete USA applications with audit"
ON public.usa_applications
FOR DELETE
USING (
  is_superadmin(auth.uid()) AND
  validate_sensitive_field_access(auth.uid(), user_id, 'usa_applications', id)
);