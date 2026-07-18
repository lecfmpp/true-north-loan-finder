-- Add GHL integration columns to quiz_responses table
ALTER TABLE public.quiz_responses 
ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_opportunity_id TEXT;