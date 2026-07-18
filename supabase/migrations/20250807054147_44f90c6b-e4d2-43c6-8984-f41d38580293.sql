UPDATE email_templates SET is_active = false WHERE is_active = true;

UPDATE email_sequences SET is_active = false WHERE is_active = true;