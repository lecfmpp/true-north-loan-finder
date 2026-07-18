-- Add detailed profile fields to lender_broker_applications table
ALTER TABLE public.lender_broker_applications 
ADD COLUMN business_types TEXT[],
ADD COLUMN preferred_industries TEXT[],
ADD COLUMN min_monthly_revenue TEXT,
ADD COLUMN max_monthly_revenue TEXT,
ADD COLUMN min_time_in_business TEXT,
ADD COLUMN min_credit_score TEXT,
ADD COLUMN min_loan_amount TEXT,
ADD COLUMN max_loan_amount TEXT,
ADD COLUMN funding_purposes TEXT[],
ADD COLUMN geographic_areas TEXT[],
ADD COLUMN additional_requirements TEXT;