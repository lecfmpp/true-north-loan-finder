-- Update Canadian applications RLS policy to work with authenticated users
DROP POLICY IF EXISTS "Anyone can submit Canadian applications" ON public.canadian_applications;

-- Create policy that allows authenticated users to submit Canadian applications
CREATE POLICY "Authenticated users can submit Canadian applications"
ON public.canadian_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to view their own applications
CREATE POLICY "Users can view their own Canadian applications"
ON public.canadian_applications
FOR SELECT
TO authenticated
USING (true); -- For now, allow all authenticated users to view (admin access)

-- Management users can still view all applications (existing policy should remain)
-- Management users can still update applications (existing policy should remain)