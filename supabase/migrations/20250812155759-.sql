-- Check if partners table has proper RLS restriction for anonymous users
-- The security scanner detected that partners table is publicly readable

-- First, let's see the current policies and verify they're working properly
-- Re-create the policies to ensure they properly restrict anonymous access

-- Drop existing policies to recreate them with explicit restrictions
DROP POLICY IF EXISTS "Partners can view their own data" ON public.partners;
DROP POLICY IF EXISTS "Superadmin can manage all partners" ON public.partners;

-- Create secure policies that explicitly restrict anonymous access
-- Partners can only view their own data when authenticated
CREATE POLICY "Partners can view their own data"
ON public.partners
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only superadmins can manage all partner data when authenticated
CREATE POLICY "Superadmin can manage all partners"
ON public.partners
FOR ALL
TO authenticated
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));

-- Partners can update their own data when authenticated
CREATE POLICY "Partners can update their own data"
ON public.partners
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- This ensures:
-- 1. No anonymous/public access to any partner data
-- 2. Partners can only see/update their own information
-- 3. Only superadmins have full access to all partner data
-- 4. All access requires authentication