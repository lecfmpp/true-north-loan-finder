UPDATE quiz_responses 
SET credit_score = CASE 
  WHEN LOWER(credit_score) = 'excellent' THEN '750'
  WHEN LOWER(credit_score) = 'good' THEN '700'
  WHEN LOWER(credit_score) = 'fair' THEN '650'
  WHEN LOWER(credit_score) = 'poor' THEN '600'
  WHEN LOWER(credit_score) = 'unsure' THEN '650'
  ELSE credit_score
END;