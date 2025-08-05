-- Update existing leads that have submitted USA applications
UPDATE public.quiz_responses 
SET 
  status = 'application_sent',
  conversion_status = 'application_sent',
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT quiz_response_id 
  FROM public.usa_applications 
  WHERE quiz_response_id IS NOT NULL
)
AND status != 'application_sent';

-- Update existing leads that have submitted Canadian applications
UPDATE public.quiz_responses 
SET 
  status = 'application_sent', 
  conversion_status = 'application_sent',
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT quiz_response_id 
  FROM public.canadian_applications 
  WHERE quiz_response_id IS NOT NULL  
)
AND status != 'application_sent';