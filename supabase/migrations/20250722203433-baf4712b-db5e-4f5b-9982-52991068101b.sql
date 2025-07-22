-- Create business_applications table for loan applications
CREATE TABLE public.business_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Company Information
  legal_corporation_name TEXT NOT NULL,
  dba_name TEXT,
  physical_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  telephone_number TEXT NOT NULL,
  fax_number TEXT,
  website TEXT,
  email_address TEXT NOT NULL,
  -- Federal & State Information
  federal_tax_id TEXT NOT NULL,
  state_tax_id TEXT,
  state_of_incorporation TEXT,
  date_incorporated DATE,
  -- Principal Information
  principal_name TEXT NOT NULL,
  principal_title TEXT NOT NULL,
  principal_ssn TEXT NOT NULL,
  principal_date_of_birth DATE NOT NULL,
  principal_home_address TEXT NOT NULL,
  principal_city TEXT NOT NULL,
  principal_state TEXT NOT NULL,
  principal_zip TEXT NOT NULL,
  principal_home_phone TEXT,
  principal_cell_phone TEXT,
  principal_email TEXT NOT NULL,
  principal_ownership_percentage INTEGER NOT NULL,
  -- Business Information
  years_in_business INTEGER NOT NULL,
  months_in_business INTEGER NOT NULL,
  number_of_employees INTEGER NOT NULL,
  business_type TEXT NOT NULL,
  business_description TEXT NOT NULL,
  -- Bank Information
  bank_name TEXT NOT NULL,
  bank_account_type TEXT NOT NULL,
  bank_routing_number TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  months_with_bank INTEGER NOT NULL,
  -- Financial Information
  average_monthly_deposits INTEGER NOT NULL,
  monthly_rent_mortgage INTEGER NOT NULL,
  -- Processing Information
  accept_cards TEXT[] NOT NULL DEFAULT '{}',
  current_processor TEXT,
  mid_number TEXT,
  monthly_processing_volume INTEGER,
  average_ticket INTEGER,
  high_ticket INTEGER,
  -- Loan Information
  loan_amount_requested INTEGER NOT NULL,
  use_of_funds TEXT NOT NULL,
  -- Metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  admin_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.business_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can submit applications
CREATE POLICY "Anyone can submit business applications"
ON public.business_applications
FOR INSERT
WITH CHECK (true);

-- Management users can view all applications
CREATE POLICY "Management users can view business applications"
ON public.business_applications
FOR SELECT
USING (public.has_management_access(auth.uid()));

-- Management users can update applications
CREATE POLICY "Management users can update business applications"
ON public.business_applications
FOR UPDATE
USING (public.has_management_access(auth.uid()));

-- Superadmin can delete applications
CREATE POLICY "Superadmin can delete business applications"
ON public.business_applications
FOR DELETE
USING (public.is_superadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_business_applications_updated_at
BEFORE UPDATE ON public.business_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();