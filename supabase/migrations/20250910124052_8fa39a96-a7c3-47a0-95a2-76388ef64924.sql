-- Add email verification columns to quiz_responses
ALTER TABLE public.quiz_responses 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token TEXT DEFAULT NULL,
ADD COLUMN email_verification_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for verification token lookup
CREATE INDEX idx_quiz_responses_verification_token 
ON public.quiz_responses(email_verification_token) 
WHERE email_verification_token IS NOT NULL;