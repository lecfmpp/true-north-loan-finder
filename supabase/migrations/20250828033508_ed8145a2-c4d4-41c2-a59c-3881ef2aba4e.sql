-- Create Make.com integration logs table
CREATE TABLE public.make_integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.quiz_responses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  http_status INTEGER,
  error_message TEXT,
  response_data JSONB,
  attempts INTEGER NOT NULL DEFAULT 1,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Make.com integration settings table
CREATE TABLE public.make_integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  event_toggles JSONB NOT NULL DEFAULT '{"lead_created": false, "partner_assigned": false, "application_submitted": false}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.make_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.make_integration_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for make_integration_logs
CREATE POLICY "Superadmin can view Make integration logs"
ON public.make_integration_logs
FOR SELECT
USING (is_superadmin(auth.uid()));

CREATE POLICY "System can insert Make integration logs"
ON public.make_integration_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update Make integration logs"
ON public.make_integration_logs
FOR UPDATE
USING (true);

-- RLS Policies for make_integration_settings
CREATE POLICY "Superadmin can manage Make integration settings"
ON public.make_integration_settings
FOR ALL
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));

-- Insert default settings record
INSERT INTO public.make_integration_settings (enabled, event_toggles)
VALUES (false, '{"lead_created": false, "partner_assigned": false, "application_submitted": false}'::jsonb);

-- Create trigger for updated_at
CREATE TRIGGER update_make_integration_logs_updated_at
BEFORE UPDATE ON public.make_integration_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_make_integration_settings_updated_at
BEFORE UPDATE ON public.make_integration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();