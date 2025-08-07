-- First, remove the broker role from the specific user
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lecfmpp@gmail.com') 
AND role = 'broker';

-- Drop the existing unique constraint if it exists
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add a unique constraint to ensure only one role per user
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Update the validation trigger to prevent multiple roles
CREATE OR REPLACE FUNCTION public.validate_single_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user already has any role when inserting
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'User can only have one role. Please update the existing role instead of adding a new one.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to enforce single role validation
DROP TRIGGER IF EXISTS validate_single_role_trigger ON public.user_roles;
CREATE TRIGGER validate_single_role_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_single_role();