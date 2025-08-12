-- Add separate commission percentages for partners
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS broker_commission_percentage numeric,
  ADD COLUMN IF NOT EXISTS platform_commission_percentage numeric;

-- Optional: add simple range constraints to prevent invalid percentages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partners_broker_commission_percentage_range'
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT partners_broker_commission_percentage_range
      CHECK (
        broker_commission_percentage IS NULL OR 
        (broker_commission_percentage >= 0 AND broker_commission_percentage <= 100)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partners_platform_commission_percentage_range'
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT partners_platform_commission_percentage_range
      CHECK (
        platform_commission_percentage IS NULL OR 
        (platform_commission_percentage >= 0 AND platform_commission_percentage <= 100)
      );
  END IF;
END $$;