-- Remove use of funds scoring rules
DELETE FROM public.lead_score_rules 
WHERE criteria_field = 'use_of_funds';