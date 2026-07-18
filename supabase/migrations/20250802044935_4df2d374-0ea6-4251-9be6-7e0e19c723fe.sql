-- Drop the constraint first so we can update the data
ALTER TABLE public.quiz_responses 
DROP CONSTRAINT IF EXISTS quiz_responses_status_check;

-- Update all existing status values to the new format
UPDATE public.quiz_responses SET status = 'New' WHERE status = 'new';
UPDATE public.quiz_responses SET status = 'Contacted' WHERE status = 'contacted';
UPDATE public.quiz_responses SET status = 'Application Sent' WHERE status = 'qualified';
UPDATE public.quiz_responses SET status = 'Disqualified' WHERE status = 'disqualified';

-- Set default status for any null values
UPDATE public.quiz_responses SET status = 'New' WHERE status IS NULL;

-- Now add the constraint with the new status values
ALTER TABLE public.quiz_responses 
ADD CONSTRAINT quiz_responses_status_check 
CHECK (status IN ('New', 'No Answer', 'Wrong Number', 'Contacted', 'Application Sent', 'Disqualified', 'Loan Approved'));

-- Add loan_value column to lead_assignments table for tracking offered loan amounts
ALTER TABLE public.lead_assignments 
ADD COLUMN IF NOT EXISTS loan_value integer;

-- Add partner_notes column to lead_assignments for partner comments
ALTER TABLE public.lead_assignments 
ADD COLUMN IF NOT EXISTS partner_notes text;

-- Update lead_assignments status constraint to match new lead statuses
ALTER TABLE public.lead_assignments 
DROP CONSTRAINT IF EXISTS lead_assignments_status_check;

ALTER TABLE public.lead_assignments 
ADD CONSTRAINT lead_assignments_status_check 
CHECK (status IN ('assigned', 'contacted', 'spoken', 'closed', 'New', 'No Answer', 'Wrong Number', 'Contacted', 'Application Sent', 'Disqualified', 'Loan Approved'));

-- Create index for better performance on lead assignments
CREATE INDEX IF NOT EXISTS idx_lead_assignments_quiz_response_id ON public.lead_assignments(quiz_response_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_partner_id ON public.lead_assignments(partner_id);