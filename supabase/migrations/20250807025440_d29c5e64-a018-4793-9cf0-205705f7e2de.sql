-- Remove the mixed approach policy
DROP POLICY IF EXISTS "Allow broker application submissions" ON public.lender_broker_applications;

-- Recreate the original broker application policy for authenticated users only
CREATE POLICY "Allow broker application submissions" 
ON public.lender_broker_applications 
FOR INSERT 
WITH CHECK (
  -- Only allow authenticated broker/lender applications  
  (auth.uid() IS NOT NULL AND status = 'pending' AND application_type IN ('lender', 'broker') AND applicant_name IS NOT NULL AND applicant_email IS NOT NULL AND company_name IS NOT NULL AND applicant_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND char_length(applicant_name) >= 2 AND char_length(applicant_name) <= 100 AND char_length(company_name) >= 2 AND char_length(company_name) <= 200)
);

-- Create a dedicated clients table for lead simulation and client contacts
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  lead_source TEXT DEFAULT 'lead_simulation',
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for the clients table
CREATE POLICY "Anyone can submit client contacts with validation" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  name IS NOT NULL AND 
  email IS NOT NULL AND 
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND 
  char_length(name) >= 2 AND char_length(name) <= 100 AND
  (phone IS NULL OR char_length(phone) >= 10)
);

CREATE POLICY "Management users can view all clients" 
ON public.clients 
FOR SELECT 
USING (has_management_access(auth.uid()));

CREATE POLICY "Management users can update clients" 
ON public.clients 
FOR UPDATE 
USING (has_management_access(auth.uid()));

CREATE POLICY "Superadmin can delete clients" 
ON public.clients 
FOR DELETE 
USING (is_superadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();