-- Create email sequences table
CREATE TABLE public.email_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN ('follow_up', 'pre_call_reminder')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  email_order INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  email_content TEXT NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email enrollments table
CREATE TABLE public.email_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  enrollment_data JSONB,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email sends table for tracking
CREATE TABLE public.email_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.email_enrollments(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  resend_email_id TEXT,
  recipient_email TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins only
CREATE POLICY "Admins can manage email sequences"
ON public.email_sequences
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can manage email enrollments"
ON public.email_enrollments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can manage email sends"
ON public.email_sends
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Create triggers for updated_at
CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_enrollments_updated_at
  BEFORE UPDATE ON public.email_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_sends_updated_at
  BEFORE UPDATE ON public.email_sends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial email sequences
INSERT INTO public.email_sequences (name, description, sequence_type) VALUES
  ('Follow-up Sequence', 'This sequence is sent to users who complete the Business Loan Estimator but do not book a call.', 'follow_up'),
  ('Pre-Call Reminder Sequence', 'This sequence is sent to users after they have successfully booked their Pre-Offer Call.', 'pre_call_reminder');

-- Get sequence IDs for template insertion
INSERT INTO public.email_templates (sequence_id, email_order, purpose, subject_line, email_content, delay_hours) 
SELECT 
  es.id,
  1,
  'Immediate - Your Estimate',
  'Your Business Loan Estimate is Ready',
  'Hi [First Name],

Thank you for using our Business Loan Estimator. Based on the information you provided, we''ve prepared a personalized funding estimate for your business.

Your estimated funding options are now ready for review, and our team is standing by to help you move forward with the best solution for your needs.

To get your official offers and complete your application, book a quick 15-minute call with one of our funding advisors:

[Book Your Call]

Best regards,
The Team at True North Business Loan',
  0
FROM public.email_sequences es WHERE es.sequence_type = 'follow_up';

INSERT INTO public.email_templates (sequence_id, email_order, purpose, subject_line, email_content, delay_hours) 
SELECT 
  es.id,
  2,
  '24h - Benefit Reminder',
  'A question about your funding timeline',
  'Hi [First Name],

I wanted to follow up on your business loan estimate from yesterday.

I''m curious - what''s driving your need for funding right now? Is it for:
• Equipment or inventory?
• Expansion or growth opportunities?
• Working capital for operations?
• Something else entirely?

Understanding your timeline helps us prioritize your application and ensure you get the right funding solution quickly.

If you''re ready to move forward, you can book a quick call here: [Book Your Call]

Or simply reply to this email and let me know what''s motivating your search for funding.

Best regards,
The Team at True North Business Loan',
  24
FROM public.email_sequences es WHERE es.sequence_type = 'follow_up';

-- Insert pre-call reminder templates
INSERT INTO public.email_templates (sequence_id, email_order, purpose, subject_line, email_content, delay_hours) 
SELECT 
  es.id,
  1,
  'Immediate - Confirmation',
  'Confirmed: Your Funding Strategy Call with True North is on [Date] at [Time]',
  'Hi [First Name],

Perfect! Your Funding Strategy Call is confirmed for [Date] at [Time].

Here''s what we''ll cover in our 15-minute call:
✅ Review your funding estimate and options
✅ Confirm your specific funding needs
✅ Outline next steps to get your official offers
✅ Answer any questions you have

Meeting Details:
Date: [Date]
Time: [Time]
Join Link: [Meeting Link]

We''ll also send you a reminder closer to your call time.

Looking forward to speaking with you!

Best regards,
The Team at True North Business Loan',
  0
FROM public.email_sequences es WHERE es.sequence_type = 'pre_call_reminder';

INSERT INTO public.email_templates (sequence_id, email_order, purpose, subject_line, email_content, delay_hours) 
SELECT 
  es.id,
  2,
  '24h Before - Preparation',
  'Reminder: Your call with True North is tomorrow',
  'Hi [First Name],

Just a friendly reminder that your Funding Strategy Call is scheduled for tomorrow at [Time].

To make the most of our time together, please have these details ready:
• Your approximate monthly revenue
• How much funding you''re looking for
• What you''ll use the funding for
• Your preferred timeline for receiving funds

Meeting Link: [Meeting Link]

If you need to reschedule, please let us know as soon as possible.

See you tomorrow!

Best regards,
The Team at True North Business Loan',
  -24
FROM public.email_sequences es WHERE es.sequence_type = 'pre_call_reminder';

INSERT INTO public.email_templates (sequence_id, email_order, purpose, subject_line, email_content, delay_hours) 
SELECT 
  es.id,
  3,
  '1h Before - Final Reminder',
  'Your call with True North starts in 1 hour',
  'Hi [First Name],

Just a quick reminder that your call is coming up in one hour at [Time].

If this is a virtual meeting, please ensure you are in a quiet place with a good internet connection.

Meeting Link: [Meeting Link]

Talk soon,
The Team at True North Business Loan',
  -1
FROM public.email_sequences es WHERE es.sequence_type = 'pre_call_reminder';

INSERT INTO public.email_templates (sequence_id, email_order, purpose, subject_line, email_content, delay_hours) 
SELECT 
  es.id,
  4,
  '15min Before - Starting Soon',
  'Starting soon: Your Funding Strategy Call',
  'Hi [First Name],

Your call starts in 15 minutes.

Here is the link to join:
[Meeting Link]

Please join a few minutes early if you can.

See you there,
The Team at True North Business Loan',
  0
FROM public.email_sequences es WHERE es.sequence_type = 'pre_call_reminder';