-- Fix email scheduling: Update 15-minute before reminder to have correct delay
UPDATE email_templates 
SET delay_hours = -0.25, 
    updated_at = now()
WHERE id = 'f5d0b1ec-c646-4d3f-a423-6478bf0e18dc' 
AND purpose = '15min Before - Starting Soon';