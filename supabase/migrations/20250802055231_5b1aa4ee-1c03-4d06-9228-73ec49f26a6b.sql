-- First, let's create a lead_pricing table for configurable pricing
CREATE TABLE public.lead_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_per_lead INTEGER NOT NULL DEFAULT 5000, -- $50.00 in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active pricing" 
ON public.lead_pricing 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Superadmin can manage pricing" 
ON public.lead_pricing 
FOR ALL 
USING (is_superadmin(auth.uid()));

-- Insert default pricing
INSERT INTO public.lead_pricing (price_per_lead, is_active, created_at) 
VALUES (5000, true, now());

-- Add update trigger
CREATE TRIGGER update_lead_pricing_updated_at
BEFORE UPDATE ON public.lead_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();