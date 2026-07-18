-- Function to sync lead assignments and ensure only the latest assignment is kept
CREATE OR REPLACE FUNCTION sync_lead_assignments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lead_record RECORD;
  latest_assignment RECORD;
BEGIN
  -- For each lead that has assignments
  FOR lead_record IN 
    SELECT DISTINCT quiz_response_id 
    FROM lead_assignments 
  LOOP
    -- Get the latest assignment for this lead
    SELECT * INTO latest_assignment
    FROM lead_assignments la
    JOIN partners p ON la.partner_id = p.id
    WHERE la.quiz_response_id = lead_record.quiz_response_id
    ORDER BY la.assigned_at DESC, la.created_at DESC
    LIMIT 1;
    
    -- Update quiz_responses with the latest assignment
    UPDATE quiz_responses 
    SET assigned_partner_id = latest_assignment.partner_id,
        updated_at = now()
    WHERE id = lead_record.quiz_response_id;
    
    -- Remove all other assignments for this lead, keeping only the latest
    DELETE FROM lead_assignments 
    WHERE quiz_response_id = lead_record.quiz_response_id 
      AND id != latest_assignment.id;
      
  END LOOP;
  
  -- Handle leads that have assigned_partner_id but no lead_assignments record
  INSERT INTO lead_assignments (quiz_response_id, partner_id, assigned_by, assigned_at, status)
  SELECT 
    qr.id,
    qr.assigned_partner_id,
    auth.uid(), -- Current user as fallback
    qr.updated_at,
    'assigned'
  FROM quiz_responses qr
  WHERE qr.assigned_partner_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM lead_assignments la 
      WHERE la.quiz_response_id = qr.id
    );
    
  -- Clean up orphaned assignments (where partner doesn't exist)
  DELETE FROM lead_assignments 
  WHERE NOT EXISTS (
    SELECT 1 FROM partners p 
    WHERE p.id = lead_assignments.partner_id
  );
  
  -- Clean up assigned_partner_id where partner doesn't exist
  UPDATE quiz_responses 
  SET assigned_partner_id = NULL
  WHERE assigned_partner_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM partners p 
      WHERE p.id = quiz_responses.assigned_partner_id
    );
    
END;
$$;