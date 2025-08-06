
-- Drop the existing status check constraint that's too restrictive
ALTER TABLE public.lender_broker_applications DROP CONSTRAINT IF EXISTS lender_broker_applications_status_check;

-- Create a new, comprehensive status check constraint that includes all the statuses we actually use
ALTER TABLE public.lender_broker_applications 
ADD CONSTRAINT lender_broker_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'lead_simulation_interest'));

-- Clean up the payment_status constraint to only include statuses we actually use
ALTER TABLE public.lender_broker_applications DROP CONSTRAINT IF EXISTS lender_broker_applications_payment_status_check;

ALTER TABLE public.lender_broker_applications 
ADD CONSTRAINT lender_broker_applications_payment_status_check 
CHECK (payment_status IN ('pending', 'completed', 'failed'));

-- Clean up the operational_status constraint to only include statuses we actually use  
ALTER TABLE public.lender_broker_applications DROP CONSTRAINT IF EXISTS lender_broker_applications_operational_status_check;

ALTER TABLE public.lender_broker_applications 
ADD CONSTRAINT lender_broker_applications_operational_status_check 
CHECK (operational_status IN ('active', 'inactive', 'suspended'));
