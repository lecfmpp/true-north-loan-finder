-- Add partner loan amount column to quiz_responses table
ALTER TABLE public.quiz_responses 
ADD COLUMN partner_loan_amount INTEGER DEFAULT NULL;

-- Add commission percentage column to partners table  
ALTER TABLE public.partners 
ADD COLUMN commission_percentage DECIMAL(5,2) DEFAULT NULL;