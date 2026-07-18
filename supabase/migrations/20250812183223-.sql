-- Create RPC to submit quiz response without relaxing RLS
CREATE OR REPLACE FUNCTION public.submit_quiz_response(p jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id text;
BEGIN
  -- Basic validations
  IF p ? 'email' AND (p->>'email') IS NOT NULL AND (p->>'email') <> '' THEN
    IF NOT public.validate_email(p->>'email') THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
  END IF;

  IF p ? 'phone' AND (p->>'phone') IS NOT NULL AND (p->>'phone') <> '' THEN
    IF NOT public.validate_phone(p->>'phone') THEN
      RAISE EXCEPTION 'Invalid phone format';
    END IF;
  END IF;

  INSERT INTO public.quiz_responses (
    loan_amount,
    use_of_funds,
    time_in_business,
    monthly_revenue,
    credit_score,
    name,
    email,
    phone,
    company_name,
    website,
    country,
    city_province,
    score,
    status,
    attribution_channel,
    attribution_url
  ) VALUES (
    NULLIF(p->>'loan_amount','')::numeric,
    NULLIF(p->>'use_of_funds',''),
    NULLIF(p->>'time_in_business',''),
    NULLIF(p->>'monthly_revenue','')::numeric,
    NULLIF(p->>'credit_score',''),
    NULLIF(p->>'name',''),
    NULLIF(p->>'email',''),
    NULLIF(p->>'phone',''),
    NULLIF(p->>'company_name',''),
    NULLIF(p->>'website',''),
    NULLIF(p->>'country',''),
    NULLIF(p->>'city_province',''),
    COALESCE(NULLIF(p->>'score','')::int, 0),
    COALESCE(NULLIF(p->>'status',''),'New'),
    NULLIF(p->>'attribution_channel',''),
    NULLIF(p->>'attribution_url','')
  )
  RETURNING id::text INTO new_id;

  RETURN new_id;
END;
$$;

-- Allow anonymous and authenticated clients to call this function
GRANT EXECUTE ON FUNCTION public.submit_quiz_response(jsonb) TO anon, authenticated;