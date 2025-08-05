-- Create table to track custom emails sent to leads
CREATE TABLE public.lead_custom_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.quiz_responses(id) ON DELETE CASCADE,
  recipient_emails TEXT[] NOT NULL,
  sent_by UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_custom_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for lead custom emails
CREATE POLICY "Management can view all lead custom emails" 
ON public.lead_custom_emails 
FOR SELECT 
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can insert lead custom emails" 
ON public.lead_custom_emails 
FOR INSERT 
WITH CHECK (has_management_access(auth.uid()));

CREATE POLICY "Management can update lead custom emails" 
ON public.lead_custom_emails 
FOR UPDATE 
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete lead custom emails" 
ON public.lead_custom_emails 
FOR DELETE 
USING (is_superadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lead_custom_emails_updated_at
BEFORE UPDATE ON public.lead_custom_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_lead_custom_emails_lead_id ON public.lead_custom_emails(lead_id);
CREATE INDEX idx_lead_custom_emails_sent_at ON public.lead_custom_emails(sent_at DESC);