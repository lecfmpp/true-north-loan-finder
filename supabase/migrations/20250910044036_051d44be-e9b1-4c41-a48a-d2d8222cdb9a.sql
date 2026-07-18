-- Create Make.com integration queue table
CREATE TABLE public.make_integration_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.quiz_responses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('lead_created', 'partner_assigned', 'lead_updated', 'application_submitted')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  priority INTEGER NOT NULL DEFAULT 100,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  payload JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.make_integration_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Superadmin can manage Make queue" 
ON public.make_integration_queue 
FOR ALL 
USING (public.is_superadmin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_make_queue_status_scheduled ON public.make_integration_queue(status, scheduled_at);
CREATE INDEX idx_make_queue_lead_id ON public.make_integration_queue(lead_id);
CREATE INDEX idx_make_queue_event_type ON public.make_integration_queue(event_type);

-- Create function to queue leads for Make.com
CREATE OR REPLACE FUNCTION public.queue_lead_for_make(
  p_lead_id UUID,
  p_event_type TEXT,
  p_priority INTEGER DEFAULT 100
) RETURNS UUID AS $$
DECLARE
  queue_id UUID;
  settings_enabled BOOLEAN;
  event_enabled BOOLEAN;
BEGIN
  -- Check if Make.com integration is enabled
  SELECT enabled INTO settings_enabled
  FROM public.make_integration_settings
  LIMIT 1;
  
  -- If no settings or disabled, skip queuing
  IF settings_enabled IS NULL OR NOT settings_enabled THEN
    RETURN NULL;
  END IF;
  
  -- Check if specific event type is enabled
  SELECT COALESCE(
    (event_toggles ->> p_event_type)::boolean, 
    false
  ) INTO event_enabled
  FROM public.make_integration_settings
  LIMIT 1;
  
  IF NOT event_enabled THEN
    RETURN NULL;
  END IF;
  
  -- Insert into queue (avoiding duplicates for same lead+event within 5 minutes)
  INSERT INTO public.make_integration_queue (
    lead_id,
    event_type,
    priority,
    scheduled_at
  ) 
  SELECT 
    p_lead_id,
    p_event_type,
    p_priority,
    now()
  WHERE NOT EXISTS (
    SELECT 1 
    FROM public.make_integration_queue 
    WHERE lead_id = p_lead_id 
      AND event_type = p_event_type 
      AND status IN ('pending', 'processing', 'retrying')
      AND created_at > now() - INTERVAL '5 minutes'
  )
  RETURNING id INTO queue_id;
  
  RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function for automatic queuing
CREATE OR REPLACE FUNCTION public.auto_queue_lead_for_make() 
RETURNS TRIGGER AS $$
BEGIN
  -- Queue for lead_created event on INSERT
  IF TG_OP = 'INSERT' THEN
    PERFORM public.queue_lead_for_make(NEW.id, 'lead_created', 100);
    RETURN NEW;
  END IF;
  
  -- Queue for partner_assigned event when assigned_partner_id changes
  IF TG_OP = 'UPDATE' THEN
    -- Partner assignment changed
    IF OLD.assigned_partner_id IS DISTINCT FROM NEW.assigned_partner_id 
       AND NEW.assigned_partner_id IS NOT NULL THEN
      PERFORM public.queue_lead_for_make(NEW.id, 'partner_assigned', 90);
    END IF;
    
    -- Lead status or conversion status changed significantly
    IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('qualified', 'application_sent', 'loan_approved')) 
       OR (OLD.conversion_status IS DISTINCT FROM NEW.conversion_status AND NEW.conversion_status IN ('application_sent', 'converted', 'funded')) THEN
      PERFORM public.queue_lead_for_make(NEW.id, 'lead_updated', 80);
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
CREATE TRIGGER trigger_auto_queue_make_leads
  AFTER INSERT OR UPDATE ON public.quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_lead_for_make();

-- Create trigger for application submissions
CREATE OR REPLACE FUNCTION public.auto_queue_application_for_make() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.quiz_response_id IS NOT NULL THEN
    PERFORM public.queue_lead_for_make(NEW.quiz_response_id, 'application_submitted', 95);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for USA and Canadian applications
CREATE TRIGGER trigger_usa_application_queue_make
  AFTER INSERT ON public.usa_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_application_for_make();

CREATE TRIGGER trigger_canadian_application_queue_make
  AFTER INSERT ON public.canadian_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_application_for_make();

-- Update timestamps trigger for queue table
CREATE TRIGGER trigger_make_queue_updated_at
  BEFORE UPDATE ON public.make_integration_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add new event types to make_integration_settings if they don't exist
DO $$
BEGIN
  -- Update existing settings to include new event types
  UPDATE public.make_integration_settings
  SET event_toggles = COALESCE(event_toggles, '{}'::jsonb) || 
    jsonb_build_object(
      'lead_updated', false,
      'application_submitted', true
    )
  WHERE NOT (event_toggles ? 'lead_updated') OR NOT (event_toggles ? 'application_submitted');
END $$;