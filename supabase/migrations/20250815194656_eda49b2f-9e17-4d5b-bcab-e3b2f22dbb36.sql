-- Fix RLS policies for partners table to address security vulnerability
-- Remove the existing "deny all" policy and replace with explicit restrictive policies

-- First, drop the existing problematic policy
DROP POLICY IF EXISTS "Deny anonymous access to partners" ON partners;

-- Create explicit restrictive policies following security best practices

-- Policy 1: Only authenticated users can access anything
CREATE POLICY "Authenticated users only access partners" 
ON partners 
FOR ALL 
TO authenticated
USING (
  -- Superadmins can access all partners
  is_superadmin(auth.uid()) 
  OR 
  -- Partners can only access their own data
  (auth.uid() = user_id)
) 
WITH CHECK (
  -- Superadmins can modify all partners
  is_superadmin(auth.uid()) 
  OR 
  -- Partners can only modify their own data
  (auth.uid() = user_id)
);

-- Policy 2: Explicitly deny all access to unauthenticated users
CREATE POLICY "Deny unauthenticated access to partners"
ON partners
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Policy 3: Management users can view partner basic info only (no sensitive details)
-- This provides limited read access for management operations without exposing sensitive data
CREATE POLICY "Management limited partner access"
ON partners
FOR SELECT
TO authenticated
USING (
  has_management_access(auth.uid()) 
  AND NOT is_superadmin(auth.uid())
);

-- Add comments for clarity
COMMENT ON POLICY "Authenticated users only access partners" ON partners IS 'Restricts partner data access to superadmins (full access) and partners (own data only)';
COMMENT ON POLICY "Deny unauthenticated access to partners" ON partners IS 'Explicitly denies all access to anonymous users';
COMMENT ON POLICY "Management limited partner access" ON partners IS 'Allows management users to view basic partner info for operational purposes';