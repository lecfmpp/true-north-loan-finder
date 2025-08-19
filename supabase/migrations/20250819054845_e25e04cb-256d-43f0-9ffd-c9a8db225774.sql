
DO $$
DECLARE
  v_partner_id UUID := '919d6632-6c3d-4cf7-b955-cc359657965b'; -- Gaurev
  v_user_id UUID;
  v_assigned INTEGER;
  v_old_avail INTEGER;
  v_old_used INTEGER;
  v_total_purchased INTEGER;
  v_new_used INTEGER;
  v_new_avail INTEGER;
  v_delta INTEGER;
BEGIN
  -- Resolve the partner's user_id
  SELECT p.user_id INTO v_user_id
  FROM partners p
  WHERE p.id = v_partner_id;

  -- Count assigned leads (all-time)
  SELECT COUNT(*) INTO v_assigned
  FROM lead_assignments la
  WHERE la.partner_id = v_partner_id;

  -- Load current credits
  SELECT plc.available_credits, plc.total_used, plc.total_purchased
    INTO v_old_avail, v_old_used, v_total_purchased
  FROM partner_lead_credits plc
  WHERE plc.user_id = v_user_id
  FOR UPDATE;

  -- Compute new values
  v_new_used := COALESCE(v_assigned, 0);
  v_new_avail := COALESCE(v_total_purchased, 0) - v_new_used;
  v_delta := v_new_avail - v_old_avail;

  -- Update credits to reflect assigned leads
  UPDATE partner_lead_credits
  SET total_used = v_new_used,
      available_credits = v_new_avail,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Audit transaction for the balance change
  INSERT INTO lead_credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    balance_after,
    description,
    created_by
  ) VALUES (
    v_user_id,
    'admin_adjustment',
    v_delta,
    v_new_avail,
    'Reconciled to assigned leads count (' || v_assigned || ')',
    NULL
  );
END $$;
