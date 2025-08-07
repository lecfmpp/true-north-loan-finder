-- Create lead_sources table for better tracking and categorization
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE,
  source_category TEXT NOT NULL, -- 'paid', 'organic', 'referral', 'direct', 'social'
  source_type TEXT NOT NULL, -- 'search', 'social', 'email', 'display', 'affiliate', etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  cost_per_lead DECIMAL(10,2), -- for paid sources
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_sources
CREATE POLICY "Anyone can view active lead sources" 
ON public.lead_sources 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Superadmin can manage lead sources" 
ON public.lead_sources 
FOR ALL 
USING (is_superadmin(auth.uid()));

-- Insert common lead sources with proper categorization
INSERT INTO public.lead_sources (source_name, source_category, source_type, cost_per_lead) VALUES
-- Paid Search
('google_ads', 'paid', 'search', 45.00),
('microsoft_ads', 'paid', 'search', 35.00),
('bing_ads', 'paid', 'search', 35.00),

-- Organic Search
('google_organic', 'organic', 'search', NULL),
('bing_organic', 'organic', 'search', NULL),
('yahoo_organic', 'organic', 'search', NULL),

-- Paid Social
('facebook_ads', 'paid', 'social', 65.00),
('linkedin_ads', 'paid', 'social', 85.00),
('instagram_ads', 'paid', 'social', 55.00),
('twitter_ads', 'paid', 'social', 40.00),

-- Organic Social
('facebook_organic', 'organic', 'social', NULL),
('linkedin_organic', 'organic', 'social', NULL),
('instagram_organic', 'organic', 'social', NULL),
('twitter_organic', 'organic', 'social', NULL),
('youtube_organic', 'organic', 'social', NULL),

-- Email Marketing
('email_campaign', 'owned', 'email', 15.00),
('newsletter', 'owned', 'email', 10.00),

-- Referral Sources
('partner_referral', 'referral', 'affiliate', 25.00),
('broker_referral', 'referral', 'affiliate', 30.00),

-- Direct Traffic
('direct', 'direct', 'direct', NULL),
('manual_entry', 'direct', 'manual', NULL),

-- Internal Sources
('lead_simulation', 'internal', 'lead_magnet', 20.00),
('quiz', 'internal', 'lead_magnet', 25.00);

-- Create function to get lead source analytics
CREATE OR REPLACE FUNCTION public.get_lead_source_analytics(
  start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  source_name TEXT,
  source_category TEXT,
  source_type TEXT,
  lead_count BIGINT,
  cost_per_lead DECIMAL,
  total_estimated_cost DECIMAL,
  conversion_rate DECIMAL,
  avg_loan_amount DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.source_name,
    ls.source_category,
    ls.source_type,
    COUNT(qr.id) as lead_count,
    ls.cost_per_lead,
    CASE 
      WHEN ls.cost_per_lead IS NOT NULL THEN ls.cost_per_lead * COUNT(qr.id)
      ELSE NULL
    END as total_estimated_cost,
    ROUND(
      (COUNT(CASE WHEN qr.conversion_status = 'converted' THEN 1 END)::DECIMAL / 
       NULLIF(COUNT(qr.id), 0)) * 100, 2
    ) as conversion_rate,
    ROUND(AVG(qr.loan_amount), 2) as avg_loan_amount
  FROM public.lead_sources ls
  LEFT JOIN public.quiz_responses qr ON ls.source_name = qr.attribution_channel
    AND qr.created_at::DATE BETWEEN start_date AND end_date
  WHERE ls.is_active = true
  GROUP BY ls.source_name, ls.source_category, ls.source_type, ls.cost_per_lead
  ORDER BY lead_count DESC, ls.source_category, ls.source_name;
END;
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_lead_sources_updated_at
BEFORE UPDATE ON public.lead_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();