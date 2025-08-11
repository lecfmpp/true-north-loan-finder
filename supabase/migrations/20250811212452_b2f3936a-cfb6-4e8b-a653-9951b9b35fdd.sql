-- Widen founding date parts to integer to avoid smallint overflow
ALTER TABLE public.quiz_responses
  ALTER COLUMN founding_year TYPE integer USING founding_year::integer,
  ALTER COLUMN founding_month TYPE integer USING founding_month::integer,
  ALTER COLUMN founding_day TYPE integer USING founding_day::integer;

-- Retry backfill from USA applications
UPDATE public.quiz_responses qr
SET 
  founding_year = COALESCE(qr.founding_year, EXTRACT(YEAR FROM ua.date_incorporated)::int),
  founding_month = COALESCE(qr.founding_month, EXTRACT(MONTH FROM ua.date_incorporated)::int),
  founding_day = COALESCE(qr.founding_day, EXTRACT(DAY FROM ua.date_incorporated)::int)
FROM public.usa_applications ua
WHERE ua.quiz_response_id = qr.id
  AND ua.date_incorporated IS NOT NULL
  AND (
    qr.founding_year IS NULL OR 
    qr.founding_month IS NULL OR 
    qr.founding_day IS NULL
  );

-- Retry backfill from Canadian applications
UPDATE public.quiz_responses qr
SET 
  founding_year = COALESCE(qr.founding_year, EXTRACT(YEAR FROM ca.business_start_date)::int),
  founding_month = COALESCE(qr.founding_month, EXTRACT(MONTH FROM ca.business_start_date)::int),
  founding_day = COALESCE(qr.founding_day, EXTRACT(DAY FROM ca.business_start_date)::int)
FROM public.canadian_applications ca
WHERE ca.quiz_response_id = qr.id
  AND ca.business_start_date IS NOT NULL
  AND (
    qr.founding_year IS NULL OR 
    qr.founding_month IS NULL OR 
    qr.founding_day IS NULL
  );