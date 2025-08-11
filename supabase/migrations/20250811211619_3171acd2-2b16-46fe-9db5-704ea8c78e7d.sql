-- Store exact founding date parts from quiz submissions
ALTER TABLE public.quiz_responses
  ADD COLUMN IF NOT EXISTS founding_month smallint,
  ADD COLUMN IF NOT EXISTS founding_year smallint,
  ADD COLUMN IF NOT EXISTS founding_day smallint;