-- Update Gaurav's used credits based on recent email activity
-- First, let's identify Gaurav's partner record and update credits accordingly

-- Update partner credits for Gaurav (adjust the number based on actual emails sent)
UPDATE partner_lead_credits 
SET total_used = total_used + 5, -- Adjust this number based on actual emails sent
    available_credits = GREATEST(0, available_credits - 5), -- Prevent negative credits
    updated_at = now()
WHERE user_id = (
  SELECT user_id 
  FROM partners 
  WHERE email ILIKE '%gaurav%' OR name ILIKE '%gaurav%'
  LIMIT 1
);

-- Create a transaction record for this manual adjustment
INSERT INTO lead_credit_transactions (
  user_id,
  transaction_type,
  credits_amount,
  balance_after,
  description,
  created_by
)
SELECT 
  p.user_id,
  'usage'::text,
  -5, -- negative for usage
  plc.available_credits, -- after the update above
  'Manual adjustment for recent email sends to Gaurav',
  (SELECT id FROM auth.users WHERE email = get_current_user_email()) -- current admin user
FROM partners p
JOIN partner_lead_credits plc ON p.user_id = plc.user_id
WHERE (p.email ILIKE '%gaurav%' OR p.name ILIKE '%gaurav%')
AND EXISTS (SELECT 1 FROM partner_lead_credits WHERE user_id = p.user_id)
LIMIT 1;