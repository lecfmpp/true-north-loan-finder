-- Harden phone validation: sanitize then validate digits-only
CREATE OR REPLACE FUNCTION public.validate_phone(phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  digits_only text;
BEGIN
  -- Strip all non-digits
  digits_only := regexp_replace(phone_number, '[^\d]', '', 'g');

  -- Require 10-15 digits and not starting with 0
  IF digits_only ~ '^[1-9]\d{9,14}$' THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;