-- Fix Canadian applications RLS policy specifically for submission
DROP POLICY IF EXISTS "Anyone can submit Canadian applications" ON public.canadian_applications;

-- Recreate the policy to ensure Canadian applications can be submitted
CREATE POLICY "Anyone can submit Canadian applications"
ON public.canadian_applications
FOR INSERT
WITH CHECK (true);