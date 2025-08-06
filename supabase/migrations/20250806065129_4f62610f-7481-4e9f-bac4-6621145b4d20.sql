-- Fix search path security warnings for functions

-- Fix check_email_exists function
CREATE OR REPLACE FUNCTION public.check_email_exists(email_address text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_address
  );
$$;

-- Fix validate_partner_role function
CREATE OR REPLACE FUNCTION public.validate_partner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user already has any role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'User already has a role assigned. Partners can only have broker or lender role.';
  END IF;
  
  -- Ensure role is only broker or lender
  IF NEW.role NOT IN ('broker', 'lender') THEN
    RAISE EXCEPTION 'Partners can only be assigned broker or lender roles.';
  END IF;
  
  RETURN NEW;
END;
$$;