-- Add additional fields to clients table for broker signup data
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS company_website text,
ADD COLUMN IF NOT EXISTS years_of_experience integer,
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS business_description text,
ADD COLUMN IF NOT EXISTS preferred_industries text[],
ADD COLUMN IF NOT EXISTS min_monthly_revenue text,
ADD COLUMN IF NOT EXISTS max_monthly_revenue text,
ADD COLUMN IF NOT EXISTS min_time_in_business text,
ADD COLUMN IF NOT EXISTS min_credit_score text,
ADD COLUMN IF NOT EXISTS min_loan_amount text,
ADD COLUMN IF NOT EXISTS max_loan_amount text,
ADD COLUMN IF NOT EXISTS geographic_areas text[],
ADD COLUMN IF NOT EXISTS additional_requirements text,
ADD COLUMN IF NOT EXISTS application_type text DEFAULT 'client',
ADD COLUMN IF NOT EXISTS tracking_id text,
ADD COLUMN IF NOT EXISTS utm_params jsonb DEFAULT '{}';

-- Update RLS policies to allow public access for broker signups
DROP POLICY IF EXISTS "Public can insert broker client data" ON public.clients;
CREATE POLICY "Public can insert broker client data" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  name IS NOT NULL 
  AND email IS NOT NULL 
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND char_length(name) >= 2 
  AND char_length(name) <= 100
);

-- Allow management to view all clients
DROP POLICY IF EXISTS "Management can view all clients" ON public.clients;
CREATE POLICY "Management can view all clients" 
ON public.clients 
FOR SELECT 
USING (has_management_access(auth.uid()));

-- Allow management to update clients
DROP POLICY IF EXISTS "Management can update clients" ON public.clients;
CREATE POLICY "Management can update clients" 
ON public.clients 
FOR UPDATE 
USING (has_management_access(auth.uid()));

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;