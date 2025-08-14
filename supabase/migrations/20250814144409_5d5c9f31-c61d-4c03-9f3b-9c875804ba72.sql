-- Create a security definer function to get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the existing problematic policies for Canadian applications
DROP POLICY IF EXISTS "Users can only submit applications with their own email" ON public.canadian_applications;

-- Create new policy using the security definer function
CREATE POLICY "Users can only submit applications with their own email" 
ON public.canadian_applications 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (email_address = public.get_current_user_email())
);

-- Also update USA applications policies to use the same function
DROP POLICY IF EXISTS "Users can only submit USA applications with their own email" ON public.usa_applications;

CREATE POLICY "Users can only submit USA applications with their own email" 
ON public.usa_applications 
FOR INSERT 
WITH CHECK (
  (legal_corporation_name IS NOT NULL) AND 
  (principal_name IS NOT NULL) AND 
  (email_address IS NOT NULL) AND 
  (federal_tax_id IS NOT NULL) AND 
  (email_address ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) AND 
  ((char_length(legal_corporation_name) >= 2) AND (char_length(legal_corporation_name) <= 200)) AND 
  ((char_length(principal_name) >= 2) AND (char_length(principal_name) <= 100)) AND 
  ((char_length(federal_tax_id) >= 9) AND (char_length(federal_tax_id) <= 12)) AND 
  (email_address = public.get_current_user_email()) AND
  (principal_email = public.get_current_user_email())
);

-- Update simplified USA applications policy
DROP POLICY IF EXISTS "Users can only submit simplified USA applications with their ow" ON public.usa_applications_simplified;

CREATE POLICY "Users can only submit simplified USA applications with their own email" 
ON public.usa_applications_simplified 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (principal_email = public.get_current_user_email())
);