-- Fix security warnings: Set search_path for functions to prevent mutable search path issues
-- Update functions to have immutable search_path parameter

-- Create or replace functions with proper search_path security
CREATE OR REPLACE FUNCTION public.validate_email(email_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Check if email matches basic pattern and has reasonable length
  RETURN email_address ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
    AND char_length(email_address) BETWEEN 5 AND 254;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_phone(phone_number text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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