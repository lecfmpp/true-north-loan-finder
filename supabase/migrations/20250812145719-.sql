-- 1) Add shared_notes column to quiz_responses
ALTER TABLE public.quiz_responses
ADD COLUMN IF NOT EXISTS shared_notes TEXT;

-- 2) Allow partners to update shared_notes on their assigned leads only
-- Create or replace function to enforce column-level restriction for partners
CREATE OR REPLACE FUNCTION public.allow_only_shared_notes_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_manager BOOLEAN;
  is_partner_allowed BOOLEAN;
BEGIN
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
$$;

-- 3) Attach trigger to quiz_responses to enforce restriction on UPDATE
DROP TRIGGER IF EXISTS trg_only_shared_notes_update ON public.quiz_responses;
CREATE TRIGGER trg_only_shared_notes_update
BEFORE UPDATE ON public.quiz_responses
FOR EACH ROW
EXECUTE FUNCTION public.allow_only_shared_notes_update();

-- 4) RLS policy to allow partners to update rows of leads assigned to them
DROP POLICY IF EXISTS "Partners can update shared_notes on assigned leads" ON public.quiz_responses;
CREATE POLICY "Partners can update shared_notes on assigned leads"
ON public.quiz_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.user_id = auth.uid()
      AND p.id = assigned_partner_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.user_id = auth.uid()
      AND p.id = assigned_partner_id
  )
);
