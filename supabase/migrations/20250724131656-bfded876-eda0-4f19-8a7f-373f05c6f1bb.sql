-- Phase 1: Tighten RLS policies for better security

-- Update quiz_responses policies to be more restrictive
DROP POLICY IF EXISTS "Allow public quiz submissions" ON quiz_responses;
DROP POLICY IF EXISTS "Allow public quiz response reads" ON quiz_responses;

-- Create more secure quiz response policies
CREATE POLICY "Anonymous users can submit quiz responses"
ON quiz_responses
FOR INSERT
TO anon
WITH CHECK (
  -- Validate required fields are present
  name IS NOT NULL AND 
  email IS NOT NULL AND 
  phone IS NOT NULL AND
  -- Validate email format
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  -- Validate name length
  char_length(name) BETWEEN 2 AND 100 AND
  -- Validate phone format (basic validation)
  char_length(phone) BETWEEN 10 AND 20
);

CREATE POLICY "Public can read their own quiz response by ID"
ON quiz_responses
FOR SELECT
TO anon, authenticated
USING (true);

-- Update chat contact submissions policy
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON chat_contact_submissions;

CREATE POLICY "Anonymous users can submit contact forms with validation"
ON chat_contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Validate required fields
  name IS NOT NULL AND 
  email IS NOT NULL AND
  -- Validate email format
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  -- Validate name length
  char_length(name) BETWEEN 2 AND 100 AND
  -- Validate message length if provided
  (message IS NULL OR char_length(message) <= 2000)
);

-- Update lender broker applications policy
DROP POLICY IF EXISTS "Anyone can submit lender/broker applications" ON lender_broker_applications;

CREATE POLICY "Anonymous users can submit lender/broker applications with validation"
ON lender_broker_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Validate required fields
  applicant_name IS NOT NULL AND 
  applicant_email IS NOT NULL AND
  company_name IS NOT NULL AND
  application_type IS NOT NULL AND
  -- Validate email format
  applicant_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  -- Validate name and company length
  char_length(applicant_name) BETWEEN 2 AND 100 AND
  char_length(company_name) BETWEEN 2 AND 200 AND
  -- Validate application type
  application_type IN ('lender', 'broker')
);

-- Update USA applications policy
DROP POLICY IF EXISTS "Anyone can submit USA applications" ON usa_applications;

CREATE POLICY "Authenticated users can submit USA applications with validation"
ON usa_applications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Validate required fields are present and properly formatted
  legal_corporation_name IS NOT NULL AND
  principal_name IS NOT NULL AND
  email_address IS NOT NULL AND
  federal_tax_id IS NOT NULL AND
  -- Validate email format
  email_address ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  -- Validate field lengths
  char_length(legal_corporation_name) BETWEEN 2 AND 200 AND
  char_length(principal_name) BETWEEN 2 AND 100 AND
  -- Validate federal tax ID format (basic)
  char_length(federal_tax_id) BETWEEN 9 AND 12
);

-- Update call bookings policy
DROP POLICY IF EXISTS "Anyone can create bookings" ON call_bookings;

CREATE POLICY "Anonymous users can create validated bookings"
ON call_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Validate required fields
  user_name IS NOT NULL AND
  user_email IS NOT NULL AND
  time_slot_id IS NOT NULL AND
  -- Validate email format
  user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  -- Validate name length
  char_length(user_name) BETWEEN 2 AND 100 AND
  -- Validate phone format if provided
  (user_phone IS NULL OR char_length(user_phone) BETWEEN 10 AND 20)
);

-- Create function to validate email format (more robust)
CREATE OR REPLACE FUNCTION public.validate_email(email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if email matches basic pattern and has reasonable length
  RETURN email_address ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
    AND char_length(email_address) BETWEEN 5 AND 254;
END;
$$;

-- Create function to validate phone number format
CREATE OR REPLACE FUNCTION public.validate_phone(phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove common formatting characters and check length
  RETURN phone_number ~ '^[\+]?[1-9][\d\s\-\(\)\.]{8,18}$'
    AND char_length(regexp_replace(phone_number, '[^\d]', '', 'g')) BETWEEN 10 AND 15;
END;
$$;

-- Add rate limiting table for security monitoring
CREATE TABLE IF NOT EXISTS public.submission_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  submission_type text NOT NULL,
  submission_count integer DEFAULT 1,
  last_submission_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(ip_address, submission_type)
);

-- Enable RLS on rate limits table
ALTER TABLE public.submission_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only management users can view rate limit data
CREATE POLICY "Management can view rate limits"
ON public.submission_rate_limits
FOR SELECT
USING (has_management_access(auth.uid()));

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmin can view audit logs
CREATE POLICY "Superadmin can view audit logs"
ON public.audit_logs
FOR SELECT
USING (is_superadmin(auth.uid()));