-- Add 'client' role to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE 'client';

-- Update the lender_broker_applications table to use 'client' as default application_type
-- This will help distinguish between commission-based partners and pay-per-lead clients
ALTER TABLE public.lender_broker_applications 
ALTER COLUMN application_type SET DEFAULT 'client';

-- Add a comment to clarify the distinction
COMMENT ON TYPE public.app_role IS 'User roles: admin, superadmin, user, broker, lender (commission-based partners), client (pay-per-lead)';