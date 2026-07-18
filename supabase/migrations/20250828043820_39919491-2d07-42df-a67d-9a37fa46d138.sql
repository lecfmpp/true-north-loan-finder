-- Fix function search path security warnings by setting search_path on functions

-- Fix get_current_user_email function
CREATE OR REPLACE FUNCTION public.get_current_user_email()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT email FROM auth.users WHERE id = auth.uid();
$function$;

-- Fix check_email_exists function
CREATE OR REPLACE FUNCTION public.check_email_exists(email_address text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_address
  );
$function$;