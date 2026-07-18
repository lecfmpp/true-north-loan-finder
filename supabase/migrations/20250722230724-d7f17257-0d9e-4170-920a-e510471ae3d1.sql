-- Fix the quiz_responses status check constraint
-- Drop the existing constraint that's blocking submissions
DROP CONSTRAINT IF EXISTS quiz_responses_status_check;

-- Add the correct check constraint for status values
ALTER TABLE public.quiz_responses 
ADD CONSTRAINT quiz_responses_status_check 
CHECK (status IN ('new', 'pending', 'contacted', 'qualified', 'closed', 'archived'));