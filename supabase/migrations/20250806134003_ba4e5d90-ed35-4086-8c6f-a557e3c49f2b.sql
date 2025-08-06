-- Add delivery tracking columns to lead_custom_emails table
ALTER TABLE public.lead_custom_emails 
ADD COLUMN resend_email_id text,
ADD COLUMN delivery_status text DEFAULT 'pending',
ADD COLUMN delivered_at timestamp with time zone,
ADD COLUMN error_message text;