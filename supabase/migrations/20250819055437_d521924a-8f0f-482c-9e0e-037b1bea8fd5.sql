-- Update all partners' credit usage to match actual lead assignments
-- This reconciles the credit system with the actual leads assigned

-- Update partner_lead_credits to reflect actual usage
UPDATE public.partner_lead_credits 
SET 
  total_used = lead_counts.actual_leads,
  available_credits = total_purchased - lead_counts.actual_leads,
  updated_at = now()
FROM (
  SELECT 
    p.user_id,
    COUNT(la.id) as actual_leads
  FROM public.partners p
  LEFT JOIN public.lead_assignments la ON p.id = la.partner_id
  WHERE p.is_active = true
  GROUP BY p.user_id
) AS lead_counts
WHERE partner_lead_credits.user_id = lead_counts.user_id
AND partner_lead_credits.total_used != lead_counts.actual_leads;

-- Insert adjustment transactions for the changes made
INSERT INTO public.lead_credit_transactions (
  user_id,
  transaction_type,
  credits_amount,
  balance_after,
  description,
  created_by
)
SELECT 
  plc.user_id,
  'adjustment',
  lead_counts.actual_leads - plc_old.old_total_used as credits_amount,
  plc.total_purchased - lead_counts.actual_leads as balance_after,
  'Reconciliation: Updated usage to match ' || lead_counts.actual_leads || ' assigned leads (was ' || plc_old.old_total_used || ')' as description,
  auth.uid()
FROM public.partner_lead_credits plc
JOIN (
  SELECT 
    p.user_id,
    COUNT(la.id) as actual_leads
  FROM public.partners p
  LEFT JOIN public.lead_assignments la ON p.id = la.partner_id
  WHERE p.is_active = true
  GROUP BY p.user_id
) AS lead_counts ON plc.user_id = lead_counts.user_id
-- Get the old values before our update
CROSS JOIN (
  SELECT 
    user_id,
    total_used as old_total_used
  FROM public.partner_lead_credits
) AS plc_old
WHERE plc_old.user_id = plc.user_id
AND lead_counts.actual_leads != plc_old.old_total_used;