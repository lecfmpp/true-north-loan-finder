-- Check current RLS policy for quiz_responses and recreate it properly
DROP POLICY IF EXISTS "Allow public quiz submissions" ON public.quiz_responses;

-- Create a proper policy that allows anyone to submit quiz responses
CREATE POLICY "Allow public quiz submissions"
ON public.quiz_responses
FOR INSERT
WITH CHECK (true);

-- Also ensure quiz_responses can be read back for the results page
CREATE POLICY IF NOT EXISTS "Allow public quiz response reads"
ON public.quiz_responses
FOR SELECT
USING (true);