-- First, let's see what constraint currently exists and drop it
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'quiz_responses_status_check' 
               AND table_name = 'quiz_responses') THEN
        ALTER TABLE public.quiz_responses DROP CONSTRAINT quiz_responses_status_check;
    END IF;
END $$;

-- Update all existing status values to valid ones
UPDATE public.quiz_responses 
SET status = 'qualified' 
WHERE status = 'pre_qualified';

-- Now add the constraint with the proper allowed values
ALTER TABLE public.quiz_responses 
ADD CONSTRAINT quiz_responses_status_check 
CHECK (status IN ('new', 'pending', 'contacted', 'qualified', 'closed', 'archived'));