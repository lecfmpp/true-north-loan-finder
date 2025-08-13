-- Introduce a safe bypass flag for system-initiated updates and ensure
-- canadian application inserts can sync lead status without client permissions

-- 1) Update the field-level protection trigger to honor a scoped GUC flag
CREATE OR REPLACE FUNCTION public.allow_only_shared_notes_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_manager BOOLEAN;
  is_partner_allowed BOOLEAN;
  bypass_flag TEXT;
BEGIN
  -- Respect a scoped system bypass flag set by trusted functions/triggers
  bypass_flag := current_setting('app.system_update', true);
  IF bypass_flag = 'true' THEN
    RETURN NEW;
  END IF;

  -- Allow truly system-initiated operations with no auth context
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Management can update anything
  SELECT public.has_management_access(auth.uid()) INTO is_manager;
  IF is_manager THEN
    RETURN NEW;
  END IF;

  -- Only partners assigned to this lead can update
  SELECT EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.user_id = auth.uid()
      AND p.id = COALESCE(NEW.assigned_partner_id, OLD.assigned_partner_id)
  ) INTO is_partner_allowed;

  IF NOT is_partner_allowed THEN
    RAISE EXCEPTION 'Not authorized to update this lead';
  END IF;

  -- Partners can only change shared_notes (allow updated_at)
  IF (to_jsonb(NEW) - 'shared_notes' - 'updated_at') <> (to_jsonb(OLD) - 'shared_notes' - 'updated_at') THEN
    RAISE EXCEPTION 'Only shared_notes can be updated by partners';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Ensure the quiz_responses sync functions set the bypass flag around their updates
CREATE OR REPLACE FUNCTION public.update_lead_status_on_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only act when a quiz_response_id is provided
  IF NEW.quiz_response_id IS NOT NULL THEN
    -- Set a transaction-scoped bypass so field-level trigger allows the update
    PERFORM set_config('app.system_update', 'true', true);

    UPDATE public.quiz_responses 
    SET 
      status = 'application_sent',
      conversion_status = 'application_sent',
      updated_at = now()
    WHERE id = NEW.quiz_response_id;

    -- Optionally revert the flag (not strictly necessary as it's local to the txn)
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
      status = 'application_sent',
      conversion_status = 'application_sent',
      updated_at = now()
    WHERE id = NEW.quiz_response_id;

    PERFORM set_config('app.system_update', 'false', true);
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Add triggers on canadian_applications to automatically sync lead status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_lead_status_on_ca_app'
  ) THEN
    CREATE TRIGGER trg_update_lead_status_on_ca_app
    AFTER INSERT ON public.canadian_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_lead_status_on_application();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_quiz_response_on_ca_app'
  ) THEN
    CREATE TRIGGER trg_sync_quiz_response_on_ca_app
    AFTER INSERT ON public.canadian_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_quiz_response_on_canadian_application();
  END IF;
END$$;