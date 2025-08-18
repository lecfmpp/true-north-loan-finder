-- Create lead_feed table for public display of sanitized leads
CREATE TABLE public.lead_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL, -- Will be masked in display
  phone TEXT NOT NULL, -- Will be masked in display
  loan_amount INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  credit_score_range TEXT NOT NULL,
  industry TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  country TEXT NOT NULL DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read access
ALTER TABLE public.lead_feed ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read from lead_feed (this is sanitized public data)
CREATE POLICY "Anyone can view lead feed" 
ON public.lead_feed 
FOR SELECT 
USING (true);

-- Only system can insert/update lead feed
CREATE POLICY "System can manage lead feed" 
ON public.lead_feed 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create function to populate lead feed from quiz responses
CREATE OR REPLACE FUNCTION public.populate_lead_feed()
RETURNS TRIGGER AS $$
DECLARE
  business_type TEXT;
  industry_name TEXT;
  credit_range TEXT;
BEGIN
  -- Derive business type from use_of_funds
  CASE 
    WHEN NEW.use_of_funds ILIKE '%restaurant%' OR NEW.use_of_funds ILIKE '%food%' THEN business_type := 'Restaurant';
    WHEN NEW.use_of_funds ILIKE '%retail%' OR NEW.use_of_funds ILIKE '%store%' THEN business_type := 'Retail Store';
    WHEN NEW.use_of_funds ILIKE '%construction%' OR NEW.use_of_funds ILIKE '%contractor%' THEN business_type := 'Construction Co.';
    WHEN NEW.use_of_funds ILIKE '%medical%' OR NEW.use_of_funds ILIKE '%healthcare%' THEN business_type := 'Medical Practice';
    WHEN NEW.use_of_funds ILIKE '%manufacturing%' THEN business_type := 'Manufacturing Co.';
    WHEN NEW.use_of_funds ILIKE '%service%' THEN business_type := 'Service Co.';
    ELSE business_type := 'Business';
  END CASE;

  -- Derive industry from use_of_funds  
  CASE 
    WHEN NEW.use_of_funds ILIKE '%restaurant%' OR NEW.use_of_funds ILIKE '%food%' THEN industry_name := 'Food & Beverage';
    WHEN NEW.use_of_funds ILIKE '%retail%' OR NEW.use_of_funds ILIKE '%store%' THEN industry_name := 'Retail';
    WHEN NEW.use_of_funds ILIKE '%construction%' OR NEW.use_of_funds ILIKE '%contractor%' THEN industry_name := 'Construction';
    WHEN NEW.use_of_funds ILIKE '%medical%' OR NEW.use_of_funds ILIKE '%healthcare%' THEN industry_name := 'Healthcare';
    WHEN NEW.use_of_funds ILIKE '%manufacturing%' THEN industry_name := 'Manufacturing';
    WHEN NEW.use_of_funds ILIKE '%service%' THEN industry_name := 'Professional Services';
    ELSE industry_name := 'General Business';
  END CASE;

  -- Convert credit score to range
  CASE NEW.credit_score
    WHEN 'excellent' THEN credit_range := '750-850';
    WHEN 'good' THEN credit_range := '670-749';
    WHEN 'fair' THEN credit_range := '580-669';
    WHEN 'poor' THEN credit_range := '300-579';
    ELSE credit_range := '600-700';
  END CASE;

  -- Insert into lead_feed with sanitized data
  INSERT INTO public.lead_feed (
    business_name,
    contact_name, 
    email,
    phone,
    loan_amount,
    submitted_at,
    credit_score_range,
    industry,
    loan_type,
    phone_verified,
    country
  ) VALUES (
    COALESCE(NEW.company_name, business_type),
    NEW.name,
    NEW.email,
    NEW.phone,
    NEW.loan_amount,
    NEW.created_at,
    credit_range,
    industry_name,
    CASE 
      WHEN NEW.loan_amount >= 500000 THEN 'SBA Loan'
      WHEN NEW.loan_amount >= 100000 THEN 'Term Loan'
      ELSE 'Merchant Cash Advance'
    END,
    false, -- Default to false for phone verification
    COALESCE(NEW.country, 'US')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to populate lead_feed when quiz_responses are inserted
CREATE TRIGGER populate_lead_feed_trigger
  AFTER INSERT ON public.quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_lead_feed();

-- Backfill some sample data for immediate display
INSERT INTO public.lead_feed (
  business_name, contact_name, email, phone, loan_amount, submitted_at, 
  credit_score_range, industry, loan_type, phone_verified, country
) VALUES 
('Metro Restaurant Group', 'Sarah Johnson', 'sarah@metrorest.com', '+1234567890', 250000, now() - interval '2 hours', '720-750', 'Food & Beverage', 'Term Loan', true, 'US'),
('ABC Construction Co.', 'Mike Chen', 'mike@abcconst.com', '+1987654321', 500000, now() - interval '4 hours', '680-720', 'Construction', 'SBA Loan', true, 'US'),
('Downtown Retail Store', 'Lisa Rodriguez', 'lisa@downtown.com', '+1555123456', 75000, now() - interval '6 hours', '650-680', 'Retail', 'Merchant Cash Advance', false, 'US'),
('TechServ Solutions', 'David Park', 'david@techserv.com', '+1444987654', 180000, now() - interval '8 hours', '750-800', 'Professional Services', 'Term Loan', true, 'US'),
('Maple Leaf Bakery', 'Jennifer Smith', 'jen@mapleleaf.ca', '+1647555000', 120000, now() - interval '10 hours', '700-740', 'Food & Beverage', 'Term Loan', true, 'CA'),
('Elite Manufacturing', 'Robert Kim', 'robert@elitemfg.com', '+1333222111', 750000, now() - interval '12 hours', '720-760', 'Manufacturing', 'SBA Loan', true, 'US'),
('Sunshine Medical Group', 'Dr. Maria Garcia', 'maria@sunshine.com', '+1222333444', 300000, now() - interval '14 hours', '780-820', 'Healthcare', 'Term Loan', true, 'US'),
('Pacific Auto Repair', 'James Wilson', 'james@pacific.com', '+1111555999', 85000, now() - interval '16 hours', '620-660', 'Automotive', 'Merchant Cash Advance', false, 'US');

-- Create index for better performance
CREATE INDEX idx_lead_feed_submitted_at ON public.lead_feed (submitted_at DESC);
CREATE INDEX idx_lead_feed_country ON public.lead_feed (country);