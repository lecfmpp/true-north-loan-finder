-- Add impressions column to ad_spend_records table if it doesn't exist
ALTER TABLE ad_spend_records 
ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;

-- Update existing records to have default impressions value
UPDATE ad_spend_records 
SET impressions = 0 
WHERE impressions IS NULL;