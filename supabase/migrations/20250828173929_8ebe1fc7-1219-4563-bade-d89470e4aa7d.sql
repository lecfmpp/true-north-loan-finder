-- Fix security warnings: Set search_path for all functions

-- Update validate_application_identity function with search_path
CREATE OR REPLACE FUNCTION public.validate_application_identity()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update check_sensitive_data_access function with search_path
CREATE OR REPLACE FUNCTION public.check_sensitive_data_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update validate_sensitive_field_access function with search_path
CREATE OR REPLACE FUNCTION public.validate_sensitive_field_access(
  p_user_id UUID,
  p_record_owner_id UUID,
  p_table_name TEXT,
  p_record_id UUID
) RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;