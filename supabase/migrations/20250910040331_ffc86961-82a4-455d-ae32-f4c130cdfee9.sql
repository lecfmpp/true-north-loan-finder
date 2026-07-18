-- Create tier-based pricing table to replace single lead pricing
CREATE TABLE public.lead_tier_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL,
  tier_description TEXT,
  base_price_min INTEGER NOT NULL, -- in cents
  base_price_max INTEGER NOT NULL, -- in cents  
  currency TEXT NOT NULL DEFAULT 'usd',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tier_name, is_active) -- Only one active pricing per tier
);

-- Enable RLS
ALTER TABLE public.lead_tier_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Management can view tier pricing"
ON public.lead_tier_pricing
FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can manage tier pricing"
ON public.lead_tier_pricing
FOR ALL
TO authenticated
USING (is_superadmin(auth.uid()));

-- Insert new tier-based pricing structure
INSERT INTO public.lead_tier_pricing (tier_name, tier_description, base_price_min, base_price_max, is_active) VALUES
('Potential', 'Score 0-44: Entry-level, high-volume tier for pipeline filling', 3000, 4500, true), -- $30-45
('Qualified', 'Score 45-84: Core product with solid fundamentals and high application rate', 6000, 8000, true), -- $60-80
('Exceptional', 'Score 85+: Premium tier with largest deal sizes and most stable businesses', 26000, 30000, true); -- $260-300

-- Add update trigger
CREATE TRIGGER update_lead_tier_pricing_updated_at
BEFORE UPDATE ON public.lead_tier_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();