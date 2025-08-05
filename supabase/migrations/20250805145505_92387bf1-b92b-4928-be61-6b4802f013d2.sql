-- Fix search_path for remaining functions by setting to empty string for security
CREATE OR REPLACE FUNCTION public.has_management_access(user_id_param uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $$
  SELECT public.has_any_management_role(user_id_param)
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(user_id_param uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $$
  SELECT public.is_user_superadmin(user_id_param)
$$;

-- Update the new function we created as well
CREATE OR REPLACE FUNCTION public.update_lead_status_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update the quiz response status to 'application_sent' when an application is created
  IF NEW.quiz_response_id IS NOT NULL THEN
    UPDATE public.quiz_responses 
    SET 
      status = 'application_sent',
      conversion_stage = 'application_sent',
      updated_at = now()
    WHERE id = NEW.quiz_response_id;
  END IF;
  
  RETURN NEW;
END;
$$;