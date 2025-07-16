-- Remove the admin notification template since we're using the existing lead email format
DELETE FROM public.email_templates 
WHERE purpose = 'Admin notification for new leads' AND email_order = 99;