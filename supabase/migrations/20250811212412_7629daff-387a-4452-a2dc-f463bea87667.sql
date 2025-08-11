-- Backfill founding date parts for existing leads using application data

-- From USA applications
UPDATE public.quiz_responses qr
SET 
  founding_year = COALESCE(qr.founding_year, EXTRACT(YEAR FROM ua.date_incorporated)::smallint),
  founding_month = COALESCE(qr.founding_month, EXTRACT(MONTH FROM ua.date_incorporated)::smallint),
  founding_day = COALESCE(qr.founding_day, EXTRACT(DAY FROM ua.date_incorporated)::smallint)
FROM public.usa_applications ua
WHERE ua.quiz_response_id = qr.id
  AND ua.date_incorporated IS NOT NULL
  AND (
    qr.founding_year IS NULL OR 
    qr.founding_month IS NULL OR 
    qr.founding_day IS NULL
  );

-- From Canadian applications
UPDATE public.quiz_responses qr
SET 
  founding_year = COALESCE(qr.founding_year, EXTRACT(YEAR FROM ca.business_start_date)::smallint),
  founding_month = COALESCE(qr.founding_month, EXTRACT(MONTH FROM ca.business_start_date)::smallint),
  founding_day = COALESCE(qr.founding_day, EXTRACT(DAY FROM ca.business_start_date)::smallint)
FROM public.canadian_applications ca
WHERE ca.quiz_response_id = qr.id
  AND ca.business_start_date IS NOT NULL
  AND (
    qr.founding_year IS NULL OR 
    qr.founding_month IS NULL OR 
    qr.founding_day IS NULL
  );