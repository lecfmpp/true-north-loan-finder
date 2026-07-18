-- Update RLS policy to allow anonymous users to submit lead simulation forms
DROP POLICY IF EXISTS "Allow broker application submissions" ON public.lender_broker_applications;

CREATE POLICY "Allow broker application submissions" 
ON public.lender_broker_applications 
FOR INSERT 
WITH CHECK (
  -- Allow anonymous lead simulation submissions
  (auth.role() = 'anon' AND status = 'lead_simulation_interest' AND application_type = 'client')
  OR
  -- Allow authenticated broker/lender applications  
  (auth.uid() IS NOT NULL AND status = 'pending' AND application_type IN ('lender', 'broker') AND applicant_name IS NOT NULL AND applicant_email IS NOT NULL AND company_name IS NOT NULL AND applicant_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND char_length(applicant_name) >= 2 AND char_length(applicant_name) <= 100 AND char_length(company_name) >= 2 AND char_length(company_name) <= 200)
);