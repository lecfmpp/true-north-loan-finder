-- Fix RLS policies for quiz_responses table
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Enable insert for all users" ON public.quiz_responses;
DROP POLICY IF EXISTS "Management users can view all quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Management users can update quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Superadmin can delete quiz responses" ON public.quiz_responses;

-- Create simple, working policies
CREATE POLICY "Allow public quiz submissions" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Management can view quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can update quiz responses" 
ON public.quiz_responses 
FOR UPDATE 
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete quiz responses" 
ON public.quiz_responses 
FOR DELETE 
USING (is_superadmin(auth.uid()));