-- Fix security issue: Update function with proper search path
CREATE OR REPLACE FUNCTION public.update_partner_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update total leads assigned
  IF TG_OP = 'INSERT' THEN
    UPDATE public.partners 
    SET total_leads_assigned = total_leads_assigned + 1,
        updated_at = now()
    WHERE id = NEW.partner_id;
    
    -- Update quiz_responses with assignment info
    UPDATE public.quiz_responses 
    SET assigned_partner_id = NEW.partner_id,
        assignment_date = NEW.assigned_at
    WHERE id = NEW.quiz_response_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update stats based on status changes
    IF OLD.status != NEW.status THEN
      UPDATE public.partners 
      SET 
        leads_contacted = CASE WHEN NEW.status = 'contacted' THEN leads_contacted + 1 ELSE leads_contacted END,
        leads_spoken = CASE WHEN NEW.status = 'spoken' THEN leads_spoken + 1 ELSE leads_spoken END,
        deals_closed = CASE WHEN NEW.status = 'closed' THEN deals_closed + 1 ELSE deals_closed END,
        updated_at = now()
      WHERE id = NEW.partner_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.partners 
    SET total_leads_assigned = total_leads_assigned - 1,
        updated_at = now()
    WHERE id = OLD.partner_id;
    
    -- Remove assignment info from quiz_responses
    UPDATE public.quiz_responses 
    SET assigned_partner_id = NULL,
        assignment_date = NULL
    WHERE id = OLD.quiz_response_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;