-- Fix the allow_only_shared_notes_update function to allow system-initiated updates
-- while maintaining security for user-initiated updates

CREATE OR REPLACE FUNCTION public.allow_only_shared_notes_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_manager BOOLEAN;
  is_partner_allowed BOOLEAN;
  is_system_update BOOLEAN;
BEGIN
  -- Check if this is a system-initiated update (no authenticated user context)
  -- This happens when triggers from application submissions update quiz_responses
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

  -- Partners can only change shared_notes (and let updated_at be handled elsewhere if present)
  IF (to_jsonb(NEW) - 'shared_notes' - 'updated_at') <> (to_jsonb(OLD) - 'shared_notes' - 'updated_at') THEN
    RAISE EXCEPTION 'Only shared_notes can be updated by partners';
  END IF;

  RETURN NEW;
END;
$function$;