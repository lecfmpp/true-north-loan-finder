-- Add email engagement tracking columns to email_sends table
ALTER TABLE public.email_sends 
ADD COLUMN open_count integer NOT NULL DEFAULT 0,
ADD COLUMN click_count integer NOT NULL DEFAULT 0,
ADD COLUMN replied boolean NOT NULL DEFAULT false;

-- Update existing records that have opened_at to have at least 1 open
UPDATE public.email_sends 
SET open_count = 1 
WHERE opened_at IS NOT NULL AND open_count = 0;

-- Update existing records that have clicked_at to have at least 1 click
UPDATE public.email_sends 
SET click_count = 1 
WHERE clicked_at IS NOT NULL AND click_count = 0;