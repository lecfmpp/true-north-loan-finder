-- Add company_name field to quiz_responses table
ALTER TABLE public.quiz_responses 
ADD COLUMN company_name text;