-- Fix RLS policy for quiz submissions
DROP POLICY IF EXISTS "Allow public quiz submissions" ON public.quiz_responses;

CREATE POLICY "Allow public quiz submissions"
ON public.quiz_responses
FOR INSERT
WITH CHECK (true);