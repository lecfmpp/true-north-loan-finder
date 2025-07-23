-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.generate_application_reference(app_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
  year_part text;
  prefix text;
BEGIN
  SELECT nextval('public.application_reference_seq') INTO next_val;
  SELECT EXTRACT(YEAR FROM now())::text INTO year_part;
  
  CASE app_type
    WHEN 'usa' THEN prefix := 'USA';
    WHEN 'canadian' THEN prefix := 'CAN';
    ELSE prefix := 'APP';
  END CASE;
  
  RETURN prefix || '-' || year_part || '-' || LPAD(next_val::text, 6, '0');
END;
$$;

-- Update existing RLS policies for renamed table
DROP POLICY IF EXISTS "Management users can view business applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Management users can update business applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Superadmin can delete business applications" ON public.usa_applications;
DROP POLICY IF EXISTS "Anyone can submit business applications" ON public.usa_applications;

-- Create RLS policies for usa_applications table
CREATE POLICY "Management users can view USA applications"
ON public.usa_applications
FOR SELECT
USING (has_management_access(auth.uid()));

CREATE POLICY "Management users can update USA applications"
ON public.usa_applications
FOR UPDATE
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete USA applications"
ON public.usa_applications
FOR DELETE
USING (is_superadmin(auth.uid()));

CREATE POLICY "Anyone can submit USA applications"
ON public.usa_applications
FOR INSERT
WITH CHECK (true);