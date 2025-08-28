-- Add webhook_url column to make_integration_settings if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'make_integration_settings' 
      AND column_name = 'webhook_url'
  ) THEN
    ALTER TABLE public.make_integration_settings
    ADD COLUMN webhook_url TEXT;
  END IF;
END $$;

-- Ensure default row has webhook_url set to NULL if not present
UPDATE public.make_integration_settings
SET webhook_url = COALESCE(webhook_url, NULL);
