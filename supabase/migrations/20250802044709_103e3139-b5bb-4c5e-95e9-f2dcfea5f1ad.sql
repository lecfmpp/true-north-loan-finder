-- Update quiz_responses table to support better lead statuses
ALTER TABLE public.quiz_responses 
DROP CONSTRAINT IF EXISTS quiz_responses_status_check;

ALTER TABLE public.quiz_responses 
ADD CONSTRAINT quiz_responses_status_check 
CHECK (status IN ('New', 'No Answer', 'Wrong Number', 'Contacted', 'Application Sent', 'Disqualified', 'Loan Approved'));

-- Update existing status values to match new format
UPDATE public.quiz_responses 
SET status = CASE 
  WHEN status = 'new' THEN 'New'
  WHEN status = 'contacted' THEN 'Contacted'
  WHEN status = 'qualified' THEN 'Application Sent'
  WHEN status = 'disqualified' THEN 'Disqualified'
  ELSE 'New'
END;

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