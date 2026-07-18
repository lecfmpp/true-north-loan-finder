-- Add full lead source URL to quiz_responses
ALTER TABLE public.quiz_responses
ADD COLUMN IF NOT EXISTS attribution_url text;

-- Optional: comment for clarity
COMMENT ON COLUMN public.quiz_responses.attribution_url IS 'Full URL of the lead source/referrer for this lead';