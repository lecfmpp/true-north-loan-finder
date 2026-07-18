-- Create table for lender and broker applications
CREATE TABLE public.lender_broker_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  company_name TEXT NOT NULL,
  company_website TEXT,
  application_type TEXT NOT NULL CHECK (application_type IN ('lender', 'broker')),
  license_number TEXT,
  years_of_experience INTEGER,
  business_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lender_broker_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can submit applications
CREATE POLICY "Anyone can submit lender/broker applications"
ON public.lender_broker_applications
FOR INSERT
WITH CHECK (true);

-- Management users can view all applications
CREATE POLICY "Management users can view all applications"
ON public.lender_broker_applications
FOR SELECT
USING (public.has_management_access(auth.uid()));

-- Management users can update applications (for notes, assignments)
CREATE POLICY "Management users can update applications"
ON public.lender_broker_applications
FOR UPDATE
USING (public.has_management_access(auth.uid()));

-- Only superadmin can approve/reject applications
CREATE POLICY "Superadmin can manage application status"
ON public.lender_broker_applications
FOR UPDATE
USING (
  public.is_superadmin(auth.uid()) OR
  (public.has_management_access(auth.uid()) AND status = 'pending')
);

-- Only superadmin can delete applications
CREATE POLICY "Superadmin can delete applications"
ON public.lender_broker_applications
FOR DELETE
USING (public.is_superadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lender_broker_applications_updated_at
BEFORE UPDATE ON public.lender_broker_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();