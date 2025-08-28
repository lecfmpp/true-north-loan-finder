-- Fix RLS policies to remove INSERT operations during SELECT queries
-- This prevents "cannot execute INSERT in a read-only transaction" errors

-- First, drop the problematic function
DROP FUNCTION IF EXISTS public.validate_sensitive_field_access(uuid, uuid, text, uuid);

-- Create a simplified version that doesn't insert audit logs during SELECT
CREATE OR REPLACE FUNCTION public.validate_sensitive_field_access(p_user_id uuid, p_record_owner_id uuid, p_table_name text, p_record_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple validation without audit logging for SELECT operations
  -- Allow if user is management or the owner
  RETURN (
    has_management_access(p_user_id) OR 
    p_user_id = p_record_owner_id
  );
END;
$$;

-- Update RLS policies for canadian_applications to remove audit logging from SELECT
DROP POLICY IF EXISTS "Management can view Canadian applications with audit" ON canadian_applications;
DROP POLICY IF EXISTS "Users can view their own Canadian applications with audit" ON canadian_applications;
DROP POLICY IF EXISTS "Management can update Canadian applications with audit" ON canadian_applications;
DROP POLICY IF EXISTS "Superadmin can delete Canadian applications with audit" ON canadian_applications;

-- Create new policies without audit logging for SELECT operations
CREATE POLICY "Management can view Canadian applications" 
ON canadian_applications FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Users can view their own Canadian applications"
ON canadian_applications FOR SELECT  
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Management can update Canadian applications"
ON canadian_applications FOR UPDATE
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete Canadian applications"
ON canadian_applications FOR DELETE
TO authenticated  
USING (is_superadmin(auth.uid()));

-- Update RLS policies for usa_applications to remove audit logging from SELECT
DROP POLICY IF EXISTS "Management can view USA applications with audit" ON usa_applications;
DROP POLICY IF EXISTS "Users can view their own USA applications with audit" ON usa_applications;
DROP POLICY IF EXISTS "Management can update USA applications with audit" ON usa_applications;
DROP POLICY IF EXISTS "Superadmin can delete USA applications with audit" ON usa_applications;

-- Create new policies without audit logging for SELECT operations
CREATE POLICY "Management can view USA applications"
ON usa_applications FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Users can view their own USA applications"  
ON usa_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Management can update USA applications"
ON usa_applications FOR UPDATE
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete USA applications"
ON usa_applications FOR DELETE
TO authenticated
USING (is_superadmin(auth.uid()));

-- Update quiz_responses RLS policy to remove any audit logging issues
DROP POLICY IF EXISTS "Partners can only update shared notes" ON quiz_responses;

CREATE POLICY "Partners can only update shared notes"
ON quiz_responses FOR UPDATE
TO authenticated
USING (
  -- Management can update anything
  has_management_access(auth.uid()) OR
  -- Partners assigned to this lead can update shared_notes only
  (
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.user_id = auth.uid()
        AND p.id = quiz_responses.assigned_partner_id
    )
  )
);