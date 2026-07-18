-- Update quiz responses with null country to Canada
UPDATE quiz_responses 
SET country = 'Canada'
WHERE country IS NULL AND status = 'new';