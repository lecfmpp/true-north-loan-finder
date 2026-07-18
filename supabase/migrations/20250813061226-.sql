-- Fix constraint violation by not modifying quiz_responses.status
-- Keep conversion_status updates only and preserve additional_information sync

CREATE OR REPLACE FUNCTION public.update_lead_status_on_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.quiz_response_id IS NOT NULL THEN
    PERFORM set_config('app.system_update', 'true', true);

    UPDATE public.quiz_responses 
    SET 
      conversion_status = 'application_sent',
      updated_at = now()
    WHERE id = NEW.quiz_response_id;

    PERFORM set_config('app.system_update', 'false', true);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_quiz_response_on_canadian_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.quiz_response_id IS NOT NULL THEN
    PERFORM set_config('app.system_update', 'true', true);

    UPDATE public.quiz_responses 
    SET 
      additional_information = COALESCE(NEW.additional_information, additional_information),
      conversion_status = 'application_sent',
      updated_at = now()
    WHERE id = NEW.quiz_response_id;

    PERFORM set_config('app.system_update', 'false', true);
  END IF;
  RETURN NEW;
END;
$function$;