-- Create Go High Level integration settings table
CREATE TABLE public.ghl_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  location_id TEXT NOT NULL,
  pipeline_id TEXT,
  webhook_url TEXT,
  field_mappings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(partner_id)
);

-- Enable RLS
ALTER TABLE public.ghl_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Management can view all GHL integrations" 
ON public.ghl_integrations 
FOR SELECT 
USING (public.has_management_access(auth.uid()));

CREATE POLICY "Management can create GHL integrations" 
ON public.ghl_integrations 
FOR INSERT 
WITH CHECK (public.has_management_access(auth.uid()));

CREATE POLICY "Management can update GHL integrations" 
ON public.ghl_integrations 
FOR UPDATE 
USING (public.has_management_access(auth.uid()));

CREATE POLICY "Management can delete GHL integrations" 
ON public.ghl_integrations 
FOR DELETE 
USING (public.has_management_access(auth.uid()));

-- Partners can view their own integration
CREATE POLICY "Partners can view their own GHL integration" 
ON public.ghl_integrations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.partners p 
  WHERE p.id = ghl_integrations.partner_id 
  AND p.user_id = auth.uid()
));

-- Add updated_at trigger
CREATE TRIGGER update_ghl_integrations_updated_at
BEFORE UPDATE ON public.ghl_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create integration logs table
CREATE TABLE public.ghl_integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  quiz_response_id UUID REFERENCES public.quiz_responses(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for logs
ALTER TABLE public.ghl_integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management can view all GHL logs" 
ON public.ghl_integration_logs 
FOR SELECT 
USING (public.has_management_access(auth.uid()));

CREATE POLICY "Partners can view their own GHL logs" 
ON public.ghl_integration_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.partners p 
  WHERE p.id = ghl_integration_logs.partner_id 
  AND p.user_id = auth.uid()
));