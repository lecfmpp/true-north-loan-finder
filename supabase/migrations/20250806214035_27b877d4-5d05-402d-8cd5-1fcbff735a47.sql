-- Drop the existing restrictive INSERT policy
DROP POLICY "Authenticated users can submit broker applications" ON public.lender_broker_applications;

-- Create a comprehensive INSERT policy that allows both authenticated and anonymous submissions
CREATE POLICY "Allow broker application submissions" 
ON public.lender_broker_applications 
FOR INSERT 
WITH CHECK (
  -- Allow anonymous submissions for lead simulation interest
  (auth.role() = 'anon' AND status = 'lead_simulation_interest') 
  OR 
  -- Allow authenticated users to submit their own applications
  (auth.uid() = user_id AND applicant_name IS NOT NULL AND applicant_email IS NOT NULL AND company_name IS NOT NULL AND application_type IS NOT NULL AND applicant_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text AND char_length(applicant_name) >= 2 AND char_length(applicant_name) <= 100 AND char_length(company_name) >= 2 AND char_length(company_name) <= 200 AND application_type = ANY (ARRAY['lender'::text, 'broker'::text]))
);

-- Also drop the redundant anonymous policy since we're combining them
DROP POLICY "Allow anonymous lead simulation submissions" ON public.lender_broker_applications;