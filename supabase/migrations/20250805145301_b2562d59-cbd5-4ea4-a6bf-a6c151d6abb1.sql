-- Create function to update lead status when application is submitted
CREATE OR REPLACE FUNCTION public.update_lead_status_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Create trigger for USA applications
CREATE TRIGGER trigger_update_lead_status_usa_application
  AFTER INSERT ON public.usa_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_status_on_application();

-- Create trigger for Canadian applications  
CREATE TRIGGER trigger_update_lead_status_canadian_application
  AFTER INSERT ON public.canadian_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_status_on_application();