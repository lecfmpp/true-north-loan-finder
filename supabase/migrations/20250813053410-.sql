-- Fix database functions to use correct column name 'conversion_status' instead of 'conversion_stage'

CREATE OR REPLACE FUNCTION public.sync_quiz_response_on_canadian_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.quiz_response_id IS NOT NULL THEN
    UPDATE public.quiz_responses 
    SET 
      additional_information = COALESCE(NEW.additional_information, additional_information),
      status = 'application_sent',
      conversion_status = 'application_sent',
      updated_at = now()
    WHERE id = NEW.quiz_response_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lead_status_on_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update the quiz response status to 'application_sent' when an application is created
  IF NEW.quiz_response_id IS NOT NULL THEN
    UPDATE public.quiz_responses 
    SET 
      status = 'application_sent',
      conversion_status = 'application_sent',
      updated_at = now()
    WHERE id = NEW.quiz_response_id;
  END IF;
  
  RETURN NEW;
END;
$function$;