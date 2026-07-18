-- Fix RLS policy for Canadian applications to properly allow public submissions
DROP POLICY IF EXISTS "Anyone can submit Canadian applications" ON public.canadian_applications;

CREATE POLICY "Anyone can submit Canadian applications"
ON public.canadian_applications
FOR INSERT
WITH CHECK (true);