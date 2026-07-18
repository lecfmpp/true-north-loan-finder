-- Refresh RLS policies by disabling and re-enabling RLS
ALTER TABLE public.quiz_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Ensure the public INSERT policy exists and is correct
DROP POLICY IF EXISTS "Allow public quiz submissions" ON public.quiz_responses;
CREATE POLICY "Allow public quiz submissions" 
ON public.quiz_responses 
FOR INSERT 
TO public
WITH CHECK (true);