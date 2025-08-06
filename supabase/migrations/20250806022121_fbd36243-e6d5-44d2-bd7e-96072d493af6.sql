-- Add new columns to ad_spend_records table for enhanced tracking
ALTER TABLE ad_spend_records ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
ALTER TABLE ad_spend_records ADD COLUMN IF NOT EXISTS ctr DECIMAL(5,4) DEFAULT 0; -- CTR as percentage (e.g., 2.5 for 2.5%)
ALTER TABLE ad_spend_records ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN ad_spend_records.clicks IS 'Number of clicks received';
COMMENT ON COLUMN ad_spend_records.ctr IS 'Click-through rate as percentage';
COMMENT ON COLUMN ad_spend_records.conversions IS 'Number of conversions achieved';