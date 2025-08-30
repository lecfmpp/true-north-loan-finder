-- Reassign Prajwal Shah and Jackie Samuels to Ezio
-- These leads were emailed to Ezio but assigned to Lance Chen in the system

-- Update lead assignments for both leads to Ezio's partner ID
UPDATE lead_assignments 
SET partner_id = 'bfd400ee-3670-4a28-a394-572bb397604f',  -- Ezio's partner ID
    assigned_at = now()
WHERE quiz_response_id IN (
  '9acf883a-299d-4a0c-b49a-08eff45e0d00', -- Prajwal Shah
  '38d9c06f-ac97-4518-ab47-0c8667b76870'  -- Jackie Samuels
);

-- The existing triggers will automatically:
-- 1. Update quiz_responses.assigned_partner_id 
-- 2. Deduct lead credits from Ezio's account
-- 3. Update partner stats