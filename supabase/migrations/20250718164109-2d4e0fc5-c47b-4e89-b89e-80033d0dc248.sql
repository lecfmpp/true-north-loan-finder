-- Add booking_link field to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN booking_link TEXT;