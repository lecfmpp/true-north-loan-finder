-- First update existing invalid status values
UPDATE public.quiz_responses 
SET status = 'qualified' 
WHERE status = 'pre_qualified';

-- Drop the existing constraint
ALTER TABLE public.quiz_responses 
DROP CONSTRAINT IF EXISTS quiz_responses_status_check;

-- Add the correct check constraint for status values
ALTER TABLE public.quiz_responses 
ADD CONSTRAINT quiz_responses_status_check 
CHECK (status IN ('new', 'pending', 'contacted', 'qualified', 'closed', 'archived'));