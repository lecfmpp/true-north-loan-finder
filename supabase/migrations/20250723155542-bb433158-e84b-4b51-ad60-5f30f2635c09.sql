-- Fix RLS policy for canadian_applications to allow users to view only their own applications
DROP POLICY IF EXISTS "Users can view their own Canadian applications" ON public.canadian_applications;

-- Create proper policy that allows users to view only their own applications
CREATE POLICY "Users can view their own Canadian applications"
ON public.canadian_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also fix usa_applications to allow users to view their own applications
CREATE POLICY "Users can view their own USA applications"
ON public.usa_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);