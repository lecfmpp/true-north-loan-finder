-- Insert existing lender partners into the applications table
INSERT INTO public.lender_broker_applications (
  applicant_name,
  applicant_email,
  company_name,
  application_type,
  status,
  admin_notes
) VALUES 
(
  'IOU Representative',
  'contact@ioufinancial.com',
  'IOU Financial',
  'lender',
  'pending',
  'Existing partner - needs to complete full profile with funding preferences'
),
(
  'Driven Representative', 
  'contact@drivenfinancial.com',
  'Driven Financial',
  'lender',
  'pending',
  'Existing partner - needs to complete full profile with funding preferences'
),
(
  'Greenbox Representative',
  'contact@greenboxcapital.com', 
  'Greenbox Capital',
  'lender',
  'pending',
  'Existing partner - needs to complete full profile with funding preferences'
),
(
  'Merchant Growth Representative',
  'contact@merchantgrowth.com',
  'Merchant Growth',
  'lender', 
  'pending',
  'Existing partner - needs to complete full profile with funding preferences'
),
(
  '2M7 Representative',
  'contact@2m7capital.com',
  '2M7 Capital',
  'lender',
  'pending', 
  'Existing partner - needs to complete full profile with funding preferences'
),
(
  'Northpoint Representative',
  'contact@northpointcommercial.com',
  'Northpoint Commercial Finance',
  'lender',
  'pending',
  'Existing partner - needs to complete full profile with funding preferences'
);