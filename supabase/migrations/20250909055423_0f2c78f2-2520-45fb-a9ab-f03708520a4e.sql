-- Create campaigns table to track different quiz forms
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quiz_form_id TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bidding_campaigns table for real bidding data
CREATE TABLE public.bidding_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  bid_amount INTEGER NOT NULL, -- in cents
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  lead_criteria JSONB NOT NULL DEFAULT '{}',
  daily_cap INTEGER,
  weekly_cap INTEGER,
  monthly_cap INTEGER,
  current_daily_count INTEGER NOT NULL DEFAULT 0,
  current_weekly_count INTEGER NOT NULL DEFAULT 0,
  current_monthly_count INTEGER NOT NULL DEFAULT 0,
  leads_won INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  last_weekly_reset DATE DEFAULT CURRENT_DATE,
  last_monthly_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, partner_id)
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bidding_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
CREATE POLICY "Management can view campaigns" ON public.campaigns FOR SELECT USING (has_management_access(auth.uid()));
CREATE POLICY "Superadmin can manage campaigns" ON public.campaigns FOR ALL USING (is_superadmin(auth.uid()));

-- Create policies for bidding_campaigns
CREATE POLICY "Management can view bidding campaigns" ON public.bidding_campaigns FOR SELECT USING (has_management_access(auth.uid()));
CREATE POLICY "Superadmin can manage bidding campaigns" ON public.bidding_campaigns FOR ALL USING (is_superadmin(auth.uid()));
CREATE POLICY "Partners can view their own bidding campaigns" ON public.bidding_campaigns FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Insert default campaign
INSERT INTO public.campaigns (name, quiz_form_id, description) VALUES 
('Business Loan Campaign', 'TruenorthBusinessloan', 'Main business loan acquisition campaign');

-- Create updated_at trigger
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bidding_campaigns_updated_at BEFORE UPDATE ON public.bidding_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();