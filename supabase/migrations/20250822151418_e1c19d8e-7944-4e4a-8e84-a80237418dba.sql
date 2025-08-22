-- Create GHL activity logs table
CREATE TABLE public.ghl_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'contact_created', 'contact_updated', 'opportunity_created', 'opportunity_moved', 'error'
  ghl_contact_id TEXT,
  ghl_opportunity_id TEXT,
  pipeline_id TEXT,
  stage_id TEXT,
  status TEXT NOT NULL, -- 'success', 'error', 'warning'
  error_message TEXT,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.ghl_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management can view GHL activity logs" 
ON public.ghl_activity_logs 
FOR SELECT 
USING (has_management_access(auth.uid()));

CREATE POLICY "System can insert GHL activity logs" 
ON public.ghl_activity_logs 
FOR INSERT 
WITH CHECK (true);