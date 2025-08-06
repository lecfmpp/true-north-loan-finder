-- Fix the remaining functions with search path issues

-- Fix deduct_lead_credit_on_assignment function
CREATE OR REPLACE FUNCTION public.deduct_lead_credit_on_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  partner_user_id UUID;
BEGIN
  -- Get the partner's user_id from the partners table
  SELECT user_id INTO partner_user_id
  FROM public.partners 
  WHERE id = NEW.partner_id;
  
  IF partner_user_id IS NOT NULL THEN
    -- Deduct one credit for the lead assignment
    PERFORM public.update_partner_credits(
      partner_user_id,
      -1,
      'usage',
      'Lead assigned: ' || NEW.id,
      NEW.id,
      NEW.assigned_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_partner_credits function
CREATE OR REPLACE FUNCTION public.update_partner_credits(p_user_id uuid, p_credit_change integer, p_transaction_type text, p_description text DEFAULT NULL::text, p_reference_id uuid DEFAULT NULL::uuid, p_created_by uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current credits or create record if doesn't exist
  INSERT INTO public.partner_lead_credits (user_id, available_credits, total_purchased, total_used)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance
  SELECT available_credits INTO current_credits 
  FROM public.partner_lead_credits 
  WHERE user_id = p_user_id;
  
  -- Calculate new balance
  new_balance := current_credits + p_credit_change;
  
  -- Prevent negative balance for usage transactions
  IF p_transaction_type = 'usage' AND new_balance < 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Update credits
  UPDATE public.partner_lead_credits 
  SET 
    available_credits = new_balance,
    total_purchased = CASE 
      WHEN p_transaction_type = 'purchase' THEN total_purchased + p_credit_change
      ELSE total_purchased 
    END,
    total_used = CASE 
      WHEN p_transaction_type = 'usage' THEN total_used + ABS(p_credit_change)
      ELSE total_used 
    END,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO public.lead_credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    balance_after,
    reference_id,
    description,
    created_by
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_credit_change,
    new_balance,
    p_reference_id,
    p_description,
    COALESCE(p_created_by, auth.uid())
  );
  
  RETURN TRUE;
END;
$$;