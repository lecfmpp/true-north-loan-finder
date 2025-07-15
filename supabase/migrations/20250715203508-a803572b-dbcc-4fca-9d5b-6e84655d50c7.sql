-- Clean up duplicate email enrollments, keeping only the latest one for each user-sequence combination
WITH ranked_enrollments AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_email, sequence_id 
           ORDER BY created_at DESC
         ) as rn
  FROM email_enrollments
)
DELETE FROM email_enrollments 
WHERE id IN (
  SELECT id 
  FROM ranked_enrollments 
  WHERE rn > 1
);