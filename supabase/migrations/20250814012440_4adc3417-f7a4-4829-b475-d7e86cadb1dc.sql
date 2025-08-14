-- Add stricter RLS policies for application tables to prevent identity theft

-- Update Canadian applications policy to ensure email matches authenticated user
DROP POLICY IF EXISTS "Authenticated users can submit Canadian applications" ON public.canadian_applications;

CREATE POLICY "Users can only submit applications with their own email" 
ON public.canadian_applications 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND email_address = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Update USA applications policy to ensure email matches authenticated user  
DROP POLICY IF EXISTS "Authenticated users can submit USA applications with validation" ON public.usa_applications;

CREATE POLICY "Users can only submit USA applications with their own email"
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
  ((char_length(federal_tax_id) >= 9) AND (char_length(federal_tax_id) <= 12)) AND
  -- Critical security check: email must match authenticated user's email
  (email_address = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Update USA simplified applications policy to ensure email matches authenticated user
DROP POLICY IF EXISTS "Authenticated users can submit USA applications (simplified)" ON public.usa_applications_simplified;

CREATE POLICY "Users can only submit simplified USA applications with their own email"
ON public.usa_applications_simplified
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  principal_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Add function to validate identity data ownership
CREATE OR REPLACE FUNCTION public.validate_application_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
BEGIN
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
  
  -- For USA simplified applications
  IF TG_TABLE_NAME = 'usa_applications_simplified' THEN
    -- Ensure the email in the application matches the user's email
    IF NEW.principal_email != user_email THEN
      RAISE EXCEPTION 'Principal email must match your account email for security';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add triggers to validate identity data
CREATE TRIGGER validate_canadian_application_identity
  BEFORE INSERT ON public.canadian_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_application_identity();

CREATE TRIGGER validate_usa_application_identity
  BEFORE INSERT ON public.usa_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_application_identity();

CREATE TRIGGER validate_usa_simplified_application_identity
  BEFORE INSERT ON public.usa_applications_simplified
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_application_identity();