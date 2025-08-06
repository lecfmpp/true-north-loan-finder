-- Allow anonymous users to submit lead simulation applications
CREATE POLICY "Allow anonymous lead simulation submissions" 
ON public.lender_broker_applications 
FOR INSERT 
TO anon
WITH CHECK (status = 'lead_simulation_interest');