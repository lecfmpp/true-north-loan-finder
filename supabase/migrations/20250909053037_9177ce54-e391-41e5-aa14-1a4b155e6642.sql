-- Create lead score rules table
CREATE TABLE public.lead_score_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  criteria_field TEXT NOT NULL,
  criteria_operator TEXT NOT NULL,
  criteria_value TEXT NOT NULL,
  score_points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_score_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Superadmin can manage lead score rules"
ON public.lead_score_rules
FOR ALL
USING (is_superadmin(auth.uid()));

-- Add indexes for better performance
CREATE INDEX idx_lead_score_rules_active ON public.lead_score_rules(is_active);
CREATE INDEX idx_lead_score_rules_field ON public.lead_score_rules(criteria_field);

-- Add trigger for updated_at
CREATE TRIGGER update_lead_score_rules_updated_at
BEFORE UPDATE ON public.lead_score_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();