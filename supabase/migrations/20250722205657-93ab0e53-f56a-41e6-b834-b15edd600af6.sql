-- Create table for Canadian business applications
CREATE TABLE public.canadian_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Business Information
  legal_business_name TEXT NOT NULL,
  dba_name TEXT,
  physical_address TEXT NOT NULL,
  mailing_address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  business_fax TEXT,
  type_of_entity TEXT NOT NULL,
  federal_tax_id TEXT NOT NULL,
  business_start_date DATE NOT NULL,
  number_of_locations INTEGER NOT NULL DEFAULT 1,
  business_property_type TEXT NOT NULL,
  monthly_rent_or_mortgage INTEGER,
  landlord_or_bank_company_name TEXT,
  landlord_or_bank_phone TEXT,
  annual_gross_sales INTEGER NOT NULL,
  amount_requested INTEGER NOT NULL,
  use_of_funds TEXT NOT NULL,
  existing_advance BOOLEAN NOT NULL DEFAULT false,
  if_so_with_who TEXT,
  outstanding_balance INTEGER,
  
  -- Ownership Information
  principal_owner_name TEXT NOT NULL,
  ownership_percentage INTEGER NOT NULL,
  ssn TEXT NOT NULL,
  dob DATE NOT NULL,
  home_address TEXT NOT NULL,
  city_owner TEXT NOT NULL,
  state_owner TEXT NOT NULL,
  zip_owner TEXT NOT NULL,
  home_phone TEXT,
  cell_phone TEXT,
  email_address TEXT NOT NULL,
  
  -- Secondary Owner (if applicable)
  principal_owner_name_2 TEXT,
  ownership_percentage_2 INTEGER,
  ssn_2 TEXT,
  dob_2 DATE,
  home_address_2 TEXT,
  city_owner_2 TEXT,
  state_owner_2 TEXT,
  zip_owner_2 TEXT,
  home_phone_2 TEXT,
  cell_phone_2 TEXT,
  email_address_2 TEXT,
  
  -- Credit Card Processing Information
  current_credit_card_processor TEXT,
  annual_credit_card_sales INTEGER,
  average_monthly_cc_volume INTEGER,
  processing_statements JSONB DEFAULT '[]'::jsonb,
  
  -- Document files
  document_files JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  status TEXT NOT NULL DEFAULT 'applicant' CHECK (status IN ('applicant', 'in_review', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.canadian_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can submit applications
CREATE POLICY "Anyone can submit Canadian applications"
ON public.canadian_applications
FOR INSERT
WITH CHECK (true);

-- Management users can view all applications
CREATE POLICY "Management users can view Canadian applications"
ON public.canadian_applications
FOR SELECT
USING (public.has_management_access(auth.uid()));

-- Management users can update applications
CREATE POLICY "Management users can update Canadian applications"
ON public.canadian_applications
FOR UPDATE
USING (public.has_management_access(auth.uid()));

-- Superadmin can delete applications
CREATE POLICY "Superadmin can delete Canadian applications"
ON public.canadian_applications
FOR DELETE
USING (public.is_superadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_canadian_applications_updated_at
BEFORE UPDATE ON public.canadian_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();