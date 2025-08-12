-- Add additional_information to quiz_responses and canadian_applications, and sync via trigger on Canadian applications

-- 1) Columns
ALTER TABLE public.quiz_responses
  ADD COLUMN IF NOT EXISTS additional_information text;

ALTER TABLE public.canadian_applications
  ADD COLUMN IF NOT EXISTS additional_information text;

-- 2) Trigger function to sync quiz response when a Canadian application is created
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
      conversion_stage = 'application_sent',
      updated_at = now()
    WHERE id = NEW.quiz_response_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Create trigger on canadian_applications to run after insert
DROP TRIGGER IF EXISTS trg_sync_quiz_response_on_canadian_application ON public.canadian_applications;
CREATE TRIGGER trg_sync_quiz_response_on_canadian_application
AFTER INSERT ON public.canadian_applications
FOR EACH ROW EXECUTE FUNCTION public.sync_quiz_response_on_canadian_application();