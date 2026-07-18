-- Update submit_quiz_response function to include homeowner_status
CREATE OR REPLACE FUNCTION public.submit_quiz_response(p jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    attribution_url,
    bank_account_type,
    homeowner_status
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
    NULLIF(p->>'attribution_url',''),
    NULLIF(p->>'bank_account_type',''),
    NULLIF(p->>'homeowner_status','')
  )
  RETURNING id::text INTO new_id;

  RETURN new_id;
END;
$function$;