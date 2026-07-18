-- Create contact form submissions table for chat widget
CREATE TABLE public.chat_contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for contact submissions
CREATE POLICY "Anyone can submit contact forms" 
ON public.chat_contact_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all contact submissions" 
ON public.chat_contact_submissions 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));

CREATE POLICY "Admins can update contact submissions" 
ON public.chat_contact_submissions 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));

CREATE POLICY "Admins can delete contact submissions" 
ON public.chat_contact_submissions 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_contact_submissions_updated_at
BEFORE UPDATE ON public.chat_contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();