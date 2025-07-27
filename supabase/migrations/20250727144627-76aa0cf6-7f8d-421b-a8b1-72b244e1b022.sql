-- Add country and city_province columns to quiz_responses table
ALTER TABLE public.quiz_responses 
ADD COLUMN country TEXT,
ADD COLUMN city_province TEXT;