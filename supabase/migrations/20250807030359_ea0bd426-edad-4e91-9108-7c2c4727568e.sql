-- Add payment tracking fields to clients table
ALTER TABLE public.clients 
ADD COLUMN payment_status text DEFAULT 'waiting_payment',
ADD COLUMN stripe_payment_link_id text,
ADD COLUMN stripe_session_id text,
ADD COLUMN payment_reminder_sent_at timestamp with time zone,
ADD COLUMN payment_completed_at timestamp with time zone;

-- Create payment reminder email template
INSERT INTO public.email_sequences (name, description, sequence_type, is_active)
VALUES ('payment_reminder', 'Payment reminder for lead simulation submissions', 'payment_reminder', true);

-- Get the sequence ID for the payment reminder
DO $$
DECLARE
    seq_id UUID;
BEGIN
    SELECT id INTO seq_id FROM public.email_sequences WHERE sequence_type = 'payment_reminder';
    
    -- Create the payment reminder email template
    INSERT INTO public.email_templates (
        sequence_id,
        email_order,
        delay_hours,
        purpose,
        subject_line,
        email_content,
        is_active
    ) VALUES (
        seq_id,
        1,
        0,
        'Payment Reminder',
        'Complete Your Payment - Lead Simulation Access',
        '<h1>Complete Your Payment</h1>
        <p>Hi [First Name],</p>
        <p>Thank you for your interest in our lead simulation service. To complete your access, please complete your payment using the link below:</p>
        <p><a href="[Payment Link]" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Payment</a></p>
        <p>If you have any questions, please don''t hesitate to contact our support team.</p>
        <p>Best regards,<br>Your Team</p>',
        true
    );
END $$;