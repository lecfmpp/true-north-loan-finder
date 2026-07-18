-- Remove partner confirmation system and add email uniqueness constraints

-- Drop the partner confirmation related policies
DROP POLICY IF EXISTS "Allow unauthenticated users to read partners for confirmation" ON public.partners;
DROP POLICY IF EXISTS "Allow unauthenticated users to update partners during confirmation" ON public.partners;
DROP POLICY IF EXISTS "Anyone can insert confirmation tokens" ON public.partner_confirmation_tokens;
DROP POLICY IF EXISTS "System can manage confirmation tokens" ON public.partner_confirmation_tokens;

-- Drop the confirmation tokens table entirely
DROP TABLE IF EXISTS public.partner_confirmation_tokens;

-- Create function to check if email exists in auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(email_address text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_address
  );
$$;

-- Create function to prevent duplicate roles for partners
CREATE OR REPLACE FUNCTION public.validate_partner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for partner role validation
CREATE TRIGGER validate_partner_role_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  WHEN (NEW.role IN ('broker', 'lender'))
  EXECUTE FUNCTION public.validate_partner_role();

-- Update partners table to remove status enum and simplify
ALTER TABLE public.partners 
  DROP COLUMN IF EXISTS status,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add unique constraint on email in partners table
ALTER TABLE public.partners 
  ADD CONSTRAINT partners_email_unique UNIQUE (email);

-- Update partner policies to be simpler
DROP POLICY IF EXISTS "Partners can view their own data" ON public.partners;
DROP POLICY IF EXISTS "Superadmin can manage partners" ON public.partners;

-- New simplified policies
CREATE POLICY "Superadmin can manage all partners" 
ON public.partners 
FOR ALL 
USING (is_superadmin(auth.uid()));

CREATE POLICY "Partners can view their own data" 
ON public.partners 
FOR SELECT 
USING (auth.uid() = user_id);