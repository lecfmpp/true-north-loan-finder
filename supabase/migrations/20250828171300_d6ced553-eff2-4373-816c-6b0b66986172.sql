-- Add missing homeowner_status column to quiz_responses table
ALTER TABLE public.quiz_responses 
ADD COLUMN homeowner_status TEXT;