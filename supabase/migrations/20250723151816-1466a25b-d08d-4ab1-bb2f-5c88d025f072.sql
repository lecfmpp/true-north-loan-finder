-- Fix RLS policies for quiz_responses to allow public access
DROP POLICY IF EXISTS "Allow public quiz submissions" ON public.quiz_responses;
DROP POLICY IF EXISTS "Allow public quiz response reads" ON public.quiz_responses;

-- Create proper policies that allow anyone to submit and read quiz responses
CREATE POLICY "Allow public quiz submissions"
ON public.quiz_responses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public quiz response reads"
ON public.quiz_responses
FOR SELECT
USING (true);