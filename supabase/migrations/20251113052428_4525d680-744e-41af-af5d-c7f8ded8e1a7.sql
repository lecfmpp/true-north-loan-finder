-- Drop the trigger first
DROP TRIGGER IF EXISTS auto_send_clickup_on_lead_assignment ON lead_assignments;

-- Drop the function
DROP FUNCTION IF EXISTS trigger_auto_send_clickup();

-- Remove ClickUp columns from partners table
ALTER TABLE partners 
  DROP COLUMN IF EXISTS clickup_api_key,
  DROP COLUMN IF EXISTS clickup_list_id,
  DROP COLUMN IF EXISTS clickup_enabled,
  DROP COLUMN IF EXISTS auto_send_to_clickup;