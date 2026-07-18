-- Simplify partner system by removing redundant data
-- Clean up test applications (keeping only the latest one)
DELETE FROM lender_broker_applications 
WHERE user_id = '47621a5d-4268-4de1-8ec7-d53756b7cfb9'
AND id != (
  SELECT id FROM lender_broker_applications 
  WHERE user_id = '47621a5d-4268-4de1-8ec7-d53756b7cfb9'
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Add operational fields to lender_broker_applications to replace partners table
ALTER TABLE lender_broker_applications 
ADD COLUMN IF NOT EXISTS total_leads_assigned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leads_contacted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leads_spoken INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deals_closed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS operational_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS partner_notes TEXT;