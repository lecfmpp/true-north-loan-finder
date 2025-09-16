-- Create database trigger to automatically send email verification when leads are created
CREATE OR REPLACE FUNCTION public.auto_send_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send verification if email is provided and not already verified
  IF NEW.email IS NOT NULL AND NEW.email != '' AND (NEW.email_verified IS NULL OR NEW.email_verified = false) THEN
    -- Call the edge function to send verification email
    -- This is done asynchronously to avoid blocking the lead creation
    PERFORM pg_notify('send_email_verification', json_build_object(
      'lead_id', NEW.id,
      'email', NEW.email,
      'name', COALESCE(NEW.name, 'Valued Customer')
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger to auto-send email verification on lead creation
DROP TRIGGER IF EXISTS trigger_auto_send_email_verification ON public.quiz_responses;
CREATE TRIGGER trigger_auto_send_email_verification
  AFTER INSERT ON public.quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_send_email_verification();

-- Add index on email_verified column for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_email_verified ON public.quiz_responses(email_verified);

-- Add index on email_verification_sent_at for analytics
CREATE INDEX IF NOT EXISTS idx_quiz_responses_email_verification_sent ON public.quiz_responses(email_verification_sent_at);

-- Update existing leads that don't have email_verified set to false (for consistency)
UPDATE public.quiz_responses 
SET email_verified = false 
WHERE email_verified IS NULL AND email IS NOT NULL AND email != '';