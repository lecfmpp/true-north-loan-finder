-- Update CTR column to allow values up to 100 (stored as percentage)
-- First check the current constraint on the CTR column
ALTER TABLE ad_spend_records 
ALTER COLUMN ctr TYPE NUMERIC(6,4);

-- Update any existing records that might be capped at 9.9999
-- This would need manual adjustment based on actual data if needed