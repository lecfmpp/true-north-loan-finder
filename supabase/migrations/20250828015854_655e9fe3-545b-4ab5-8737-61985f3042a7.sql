-- Add bank_account_type column to quiz_responses table
ALTER TABLE public.quiz_responses 
ADD COLUMN bank_account_type text;