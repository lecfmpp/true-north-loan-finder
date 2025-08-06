-- Update CTR column to allow values up to 100% (stored as percentage)
ALTER TABLE public.ad_spend_records 
ALTER COLUMN ctr TYPE NUMERIC(7,4);

-- Add constraint to ensure CTR values are between 0 and 100
ALTER TABLE public.ad_spend_records 
ADD CONSTRAINT check_ctr_range CHECK (ctr >= 0 AND ctr <= 100);