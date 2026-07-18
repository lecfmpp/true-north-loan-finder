-- Restrict public access to lead_feed and provide a safe public RPC

-- 1) Remove public SELECT access
DROP POLICY IF EXISTS "Anyone can view lead feed" ON public.lead_feed;

-- 2) Allow only management users to view lead_feed directly
CREATE POLICY "Management can view lead feed"
ON public.lead_feed
FOR SELECT
USING (has_management_access(auth.uid()));

-- 3) Create a SECURITY DEFINER function to expose only masked data publicly
CREATE OR REPLACE FUNCTION public.get_public_lead_feed(p_country text DEFAULT 'US', p_limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  business_name text,
  contact_name text,
  email text,
  phone text,
  loan_amount integer,
  submitted_at timestamptz,
  credit_score_range text,
  industry text,
  loan_type text,
  country text,
  phone_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    lf.id,
    -- Mask business name (first 2 letters shown)
    CASE 
      WHEN lf.business_name IS NULL OR lf.business_name = '' THEN 'Business'
      ELSE substring(lf.business_name from 1 for 2) || repeat('*', GREATEST(char_length(lf.business_name)-2,0))
    END AS business_name,
    -- Mask contact name (first letter shown)
    CASE 
      WHEN lf.contact_name IS NULL OR lf.contact_name = '' THEN 'Contact'
      ELSE substring(lf.contact_name from 1 for 1) || repeat('*', GREATEST(char_length(lf.contact_name)-1,0))
    END AS contact_name,
    -- Mask email (keep first char and domain)
    CASE 
      WHEN lf.email IS NULL OR lf.email = '' THEN NULL
      ELSE LEFT(split_part(lf.email,'@',1),1) || '***@' || split_part(lf.email,'@',2)
    END AS email,
    -- Mask phone (show last 4 digits only)
    CASE 
      WHEN lf.phone IS NULL OR lf.phone = '' THEN NULL
      ELSE '***-***-' || RIGHT(regexp_replace(lf.phone, '[^0-9]', '', 'g'), 4)
    END AS phone,
    lf.loan_amount,
    lf.submitted_at,
    lf.credit_score_range,
    lf.industry,
    lf.loan_type,
    lf.country,
    COALESCE(lf.phone_verified, false) AS phone_verified
  FROM public.lead_feed lf
  WHERE lf.country = COALESCE(p_country, 'US')
  ORDER BY lf.submitted_at DESC
  LIMIT COALESCE(p_limit, 20);
END;
$function$;

-- 4) Allow anonymous and authenticated clients to call the RPC
GRANT EXECUTE ON FUNCTION public.get_public_lead_feed(text, integer) TO anon, authenticated;