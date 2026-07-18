-- Fix security warnings by setting search_path for functions
-- Update the populate_lead_feed function to include search_path
CREATE OR REPLACE FUNCTION public.populate_lead_feed()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
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
$$;