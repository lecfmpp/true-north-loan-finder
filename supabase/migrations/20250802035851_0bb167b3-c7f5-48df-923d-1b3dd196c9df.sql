-- Create ad spend tracking table
CREATE TABLE public.ad_spend_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel TEXT NOT NULL, -- 'google', 'meta', 'tiktok', 'linkedin'
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  campaign_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add lead attribution to quiz_responses
ALTER TABLE public.quiz_responses 
ADD COLUMN attribution_channel TEXT,
ADD COLUMN lead_value INTEGER DEFAULT 0, -- Expected/actual value from this lead in cents
ADD COLUMN conversion_status TEXT DEFAULT 'new'; -- 'new', 'qualified', 'converted', 'lost'

-- Enable RLS
ALTER TABLE public.ad_spend_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad spend
CREATE POLICY "Management can manage ad spend records" 
ON public.ad_spend_records 
FOR ALL 
USING (has_management_access(auth.uid()));

-- Create function to calculate ROI metrics
CREATE OR REPLACE FUNCTION public.get_roi_metrics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_leads BIGINT,
  total_spend INTEGER,
  cost_per_lead NUMERIC,
  total_revenue INTEGER,
  roi_percentage NUMERIC,
  channel_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lead_count BIGINT;
  spend_amount INTEGER;
  revenue_amount INTEGER;
BEGIN
  -- Get total leads in date range
  SELECT COUNT(*) INTO lead_count
  FROM public.quiz_responses 
  WHERE DATE(created_at) BETWEEN start_date AND end_date;
  
  -- Get total spend in date range
  SELECT COALESCE(SUM(amount), 0) INTO spend_amount
  FROM public.ad_spend_records 
  WHERE date BETWEEN start_date AND end_date;
  
  -- Get total revenue in date range
  SELECT COALESCE(SUM(lead_value), 0) INTO revenue_amount
  FROM public.quiz_responses 
  WHERE DATE(created_at) BETWEEN start_date AND end_date
  AND conversion_status = 'converted';
  
  RETURN QUERY SELECT 
    lead_count,
    spend_amount,
    CASE WHEN lead_count > 0 THEN ROUND(spend_amount::NUMERIC / lead_count, 2) ELSE 0 END,
    revenue_amount,
    CASE WHEN spend_amount > 0 THEN ROUND(((revenue_amount::NUMERIC - spend_amount) / spend_amount) * 100, 2) ELSE 0 END,
    '{}'::JSONB; -- Channel breakdown to be implemented
END;
$$;

-- Update timestamps trigger
CREATE TRIGGER update_ad_spend_records_updated_at
  BEFORE UPDATE ON public.ad_spend_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();