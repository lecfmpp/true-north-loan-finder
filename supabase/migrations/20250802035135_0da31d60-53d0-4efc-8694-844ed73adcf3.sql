-- Create payment records table to track all payments
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_type TEXT NOT NULL DEFAULT 'lead_credits', -- lead_credits, subscription, etc
  leads_purchased INTEGER DEFAULT 0, -- Number of leads purchased
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create lead credits table to track available credits for each partner
CREATE TABLE public.partner_lead_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  available_credits INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create lead credit transactions table to track credit usage and additions
CREATE TABLE public.lead_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'admin_adjustment', 'refund'
  credits_amount INTEGER NOT NULL, -- Positive for additions, negative for usage
  balance_after INTEGER NOT NULL,
  reference_id UUID, -- Could reference payment_records.id or lead_assignments.id
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_lead_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_records
CREATE POLICY "Users can view their own payment records" 
ON public.payment_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Management can view all payment records" 
ON public.payment_records 
FOR SELECT 
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can update payment records" 
ON public.payment_records 
FOR UPDATE 
USING (has_management_access(auth.uid()));

CREATE POLICY "System can insert payment records" 
ON public.payment_records 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for partner_lead_credits
CREATE POLICY "Users can view their own lead credits" 
ON public.partner_lead_credits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Management can view all lead credits" 
ON public.partner_lead_credits 
FOR SELECT 
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can manage lead credits" 
ON public.partner_lead_credits 
FOR ALL 
USING (has_management_access(auth.uid()));

CREATE POLICY "System can insert lead credits" 
ON public.partner_lead_credits 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for lead_credit_transactions
CREATE POLICY "Users can view their own credit transactions" 
ON public.lead_credit_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Management can view all credit transactions" 
ON public.lead_credit_transactions 
FOR SELECT 
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can insert credit transactions" 
ON public.lead_credit_transactions 
FOR INSERT 
WITH CHECK (has_management_access(auth.uid()) OR auth.uid() = user_id);

-- Function to update lead credits and create transaction
CREATE OR REPLACE FUNCTION public.update_partner_credits(
  p_user_id UUID,
  p_credit_change INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger to update lead credits when lead is assigned
CREATE OR REPLACE FUNCTION public.deduct_lead_credit_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for lead assignments
CREATE TRIGGER trigger_deduct_credit_on_lead_assignment
  AFTER INSERT ON public.lead_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_lead_credit_on_assignment();

-- Update timestamps trigger
CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_lead_credits_updated_at
  BEFORE UPDATE ON public.partner_lead_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();