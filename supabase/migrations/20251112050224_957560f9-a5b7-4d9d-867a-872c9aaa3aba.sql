-- Create trigger to auto-send leads to ClickUp when assigned
CREATE OR REPLACE FUNCTION auto_send_clickup_on_lead_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger on new assignments, not updates
  IF TG_OP = 'INSERT' THEN
    -- Call the edge function asynchronously (don't block the assignment)
    PERFORM pg_notify('clickup_lead_assignment', json_build_object(
      'lead_id', NEW.quiz_response_id,
      'partner_id', NEW.partner_id,
      'assignment_id', NEW.id
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on lead_assignments table
DROP TRIGGER IF EXISTS trigger_auto_send_clickup ON public.lead_assignments;
CREATE TRIGGER trigger_auto_send_clickup
  AFTER INSERT ON public.lead_assignments
  FOR EACH ROW
  EXECUTE FUNCTION auto_send_clickup_on_lead_assignment();

COMMENT ON FUNCTION auto_send_clickup_on_lead_assignment() IS 'Automatically triggers ClickUp notification when a lead is assigned to a partner';
COMMENT ON TRIGGER trigger_auto_send_clickup ON public.lead_assignments IS 'Sends lead to ClickUp when partner has auto-send enabled';