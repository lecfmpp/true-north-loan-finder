-- Fix RLS policies by removing audit logging that causes INSERT during SELECT operations
-- Step 1: Drop all policies that depend on validate_sensitive_field_access function

-- Drop Canadian application policies
DROP POLICY IF EXISTS "Authenticated users can insert their own Canadian applications" ON canadian_applications;
DROP POLICY IF EXISTS "Users can view their own Canadian applications with audit" ON canadian_applications;
DROP POLICY IF EXISTS "Management can view Canadian applications with audit" ON canadian_applications;
DROP POLICY IF EXISTS "Management can update Canadian applications with audit" ON canadian_applications;
DROP POLICY IF EXISTS "Superadmin can delete Canadian applications with audit" ON canadian_applications;

-- Drop USA application policies  
DROP POLICY IF EXISTS "Authenticated users can insert their own USA applications" ON usa_applications;
DROP POLICY IF EXISTS "Users can view their own USA applications with audit" ON usa_applications;
DROP POLICY IF EXISTS "Management can view USA applications with audit" ON usa_applications;
DROP POLICY IF EXISTS "Management can update USA applications with audit" ON usa_applications;
DROP POLICY IF EXISTS "Superadmin can delete USA applications with audit" ON usa_applications;

-- Step 2: Now we can drop the function
DROP FUNCTION IF EXISTS public.validate_sensitive_field_access(uuid, uuid, text, uuid);

-- Step 3: Recreate policies without audit logging for SELECT operations

-- Canadian Applications policies
CREATE POLICY "Authenticated users can insert their own Canadian applications"
ON canadian_applications FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (email_address = get_current_user_email()) AND 
  (user_id = auth.uid())
);

CREATE POLICY "Users can view their own Canadian applications"
ON canadian_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Management can view Canadian applications"
ON canadian_applications FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can update Canadian applications"
ON canadian_applications FOR UPDATE
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete Canadian applications"
ON canadian_applications FOR DELETE
TO authenticated
USING (is_superadmin(auth.uid()));

-- USA Applications policies
CREATE POLICY "Authenticated users can insert their own USA applications"
ON usa_applications FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (email_address = get_current_user_email()) AND 
  (user_id = auth.uid())
);

CREATE POLICY "Users can view their own USA applications"
ON usa_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Management can view USA applications"
ON usa_applications FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can update USA applications"
ON usa_applications FOR UPDATE
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete USA applications"
ON usa_applications FOR DELETE
TO authenticated
USING (is_superadmin(auth.uid()));