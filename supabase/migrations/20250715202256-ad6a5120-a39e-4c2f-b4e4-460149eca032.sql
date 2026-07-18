-- Update existing credit scores to convert descriptive text to numeric ranges
UPDATE quiz_responses 
SET credit_score = CASE 
  WHEN LOWER(credit_score) IN ('excellent', 'very good') THEN '750'
  WHEN LOWER(credit_score) IN ('good') THEN '700'
  WHEN LOWER(credit_score) IN ('fair', 'average') THEN '650'
  WHEN LOWER(credit_score) IN ('poor', 'bad') THEN '600'
  WHEN LOWER(credit_score) IN ('unsure', 'unknown', 'not sure') THEN '650'
  ELSE credit_score  -- Keep existing numeric values as-is
END
WHERE credit_score ~ '^[a-zA-Z]'  -- Only update non-numeric entries