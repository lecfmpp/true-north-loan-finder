-- Add user_id column to lender_broker_applications if not exists
ALTER TABLE public.lender_broker_applications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add payment status tracking
ALTER TABLE public.lender_broker_applications 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'expired'));

-- Add payment link tracking
ALTER TABLE public.lender_broker_applications 
ADD COLUMN IF NOT EXISTS stripe_payment_link_id TEXT;

-- Add payment amount and currency
ALTER TABLE public.lender_broker_applications 
ADD COLUMN IF NOT EXISTS payment_amount INTEGER DEFAULT 50000; -- $500 in cents

-- Add payment deadline
ALTER TABLE public.lender_broker_applications 
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ DEFAULT (now() + interval '7 days');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lender_broker_applications_user_id ON public.lender_broker_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_lender_broker_applications_payment_status ON public.lender_broker_applications(payment_status);

-- Update RLS policies to allow users to view/edit their own applications
CREATE POLICY "Users can view their own broker applications" ON public.lender_broker_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own broker applications" ON public.lender_broker_applications
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own applications
DROP POLICY IF EXISTS "Anonymous users can submit lender/broker applications with vali" ON public.lender_broker_applications;

CREATE POLICY "Authenticated users can submit broker applications" ON public.lender_broker_applications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  applicant_name IS NOT NULL AND 
  applicant_email IS NOT NULL AND 
  company_name IS NOT NULL AND 
  application_type IS NOT NULL AND
  applicant_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  char_length(applicant_name) >= 2 AND char_length(applicant_name) <= 100 AND
  char_length(company_name) >= 2 AND char_length(company_name) <= 200 AND
  application_type = ANY (ARRAY['lender'::text, 'broker'::text])
);