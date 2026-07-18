-- Insert sample partner credit data for testing
INSERT INTO public.partner_lead_credits (user_id, available_credits, total_purchased, total_used)
VALUES ('47621a5d-4268-4de1-8ec7-d537756b7cfb9', 10, 25, 15)
ON CONFLICT (user_id) DO UPDATE SET
  available_credits = EXCLUDED.available_credits,
  total_purchased = EXCLUDED.total_purchased,
  total_used = EXCLUDED.total_used;

-- Insert sample payment record
INSERT INTO public.payment_records (user_id, amount, status, payment_type, leads_purchased)
VALUES ('47621a5d-4268-4de1-8ec7-d537756b7cfb9', 50000, 'completed', 'lead_credits', 25);

-- Insert sample credit transaction
INSERT INTO public.lead_credit_transactions (user_id, transaction_type, credits_amount, balance_after, description)
VALUES ('47621a5d-4268-4de1-8ec7-d537756b7cfb9', 'purchase', 25, 25, 'Initial credit purchase');

INSERT INTO public.lead_credit_transactions (user_id, transaction_type, credits_amount, balance_after, description)
VALUES ('47621a5d-4268-4de1-8ec7-d537756b7cfb9', 'usage', -15, 10, 'Credits used for lead assignments');