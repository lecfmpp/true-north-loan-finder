-- Drop existing INSERT policy for quiz_responses
DROP POLICY IF EXISTS "Anyone can submit quiz responses" ON public.quiz_responses;

-- Create a new INSERT policy with explicit check
CREATE POLICY "Enable insert for all users" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;