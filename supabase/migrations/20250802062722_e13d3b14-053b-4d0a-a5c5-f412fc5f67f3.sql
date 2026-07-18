-- Create or update partner confirmation process to use unified partners table

-- Ensure all partners from applications are in the partners table
INSERT INTO public.partners (
  name, 
  email, 
  company_name, 
  phone, 
  application_type, 
  status, 
  user_id,
  created_at,
  updated_at
)
SELECT 
  applicant_name as name,
  applicant_email as email,
  company_name,
  applicant_phone as phone,
  application_type,
  CASE 
    WHEN status = 'approved' AND operational_status = 'active' THEN 'active'
    WHEN status = 'approved' THEN 'pending'
    ELSE 'unconfirmed'
  END as status,
  user_id,
  created_at,
  updated_at
FROM public.lender_broker_applications 
WHERE applicant_email NOT IN (
  SELECT email FROM public.partners
)
ON CONFLICT (email) DO NOTHING;