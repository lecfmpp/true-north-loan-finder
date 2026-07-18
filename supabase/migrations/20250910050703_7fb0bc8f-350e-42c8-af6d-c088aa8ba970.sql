-- Create price decay rules table for time-based lead pricing
CREATE TABLE public.lead_price_decay_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  description TEXT,
  time_brackets JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint to ensure only one active rule at a time
  CONSTRAINT unique_active_rule EXCLUDE (is_active WITH =) WHERE (is_active = true)
);

-- Enable RLS
ALTER TABLE public.lead_price_decay_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Superadmin can manage price decay rules"
ON public.lead_price_decay_rules
FOR ALL
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Management can view price decay rules"
ON public.lead_price_decay_rules
FOR SELECT
USING (has_management_access(auth.uid()));

-- Create function to calculate lead price with decay
CREATE OR REPLACE FUNCTION public.calculate_lead_price_with_decay(
  lead_created_at TIMESTAMP WITH TIME ZONE,
  base_price INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  age_minutes INTEGER;
  rule_record RECORD;
  bracket JSONB;
  percentage NUMERIC := 100; -- Default to 100% if no rules apply
BEGIN
  -- Calculate lead age in minutes
  age_minutes := EXTRACT(EPOCH FROM (now() - lead_created_at)) / 60;
  
  -- Get the active price decay rule
  SELECT * INTO rule_record
  FROM public.lead_price_decay_rules
  WHERE is_active = true
  LIMIT 1;
  
  -- If no active rule, return base price
  IF rule_record IS NULL THEN
    RETURN base_price;
  END IF;
  
  -- Find the appropriate time bracket
  FOR bracket IN SELECT jsonb_array_elements(rule_record.time_brackets)
  LOOP
    -- Check if age falls within this bracket
    IF age_minutes >= (bracket->>'min_minutes')::INTEGER 
       AND (bracket->>'max_minutes' IS NULL OR age_minutes < (bracket->>'max_minutes')::INTEGER) THEN
      percentage := (bracket->>'percentage')::NUMERIC;
      EXIT;
    END IF;
  END LOOP;
  
  -- Apply percentage to base price
  RETURN ROUND(base_price * percentage / 100.0);
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_lead_price_decay_rules_updated_at
  BEFORE UPDATE ON public.lead_price_decay_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default decay rule
INSERT INTO public.lead_price_decay_rules (
  rule_name,
  description,
  time_brackets,
  is_active
) VALUES (
  'Standard Age-Based Pricing',
  'Default pricing strategy that decreases lead value over time',
  '[
    {"label": "Hot (0-5 min)", "min_minutes": 0, "max_minutes": 5, "percentage": 100},
    {"label": "Warm (5-60 min)", "min_minutes": 5, "max_minutes": 60, "percentage": 85},
    {"label": "Aged (1-24 hours)", "min_minutes": 60, "max_minutes": 1440, "percentage": 60},
    {"label": "Old (24+ hours)", "min_minutes": 1440, "max_minutes": null, "percentage": 40}
  ]'::jsonb,
  true
);