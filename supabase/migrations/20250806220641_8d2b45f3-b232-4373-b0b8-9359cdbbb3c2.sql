
-- Create a simple, separate table for lead simulation submissions with no complex constraints
CREATE TABLE public.lead_simulation_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS but keep it very simple - allow anyone to insert and admins to view
ALTER TABLE public.lead_simulation_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to submit lead simulation forms
CREATE POLICY "Anyone can submit lead simulation forms" 
  ON public.lead_simulation_submissions 
  FOR INSERT 
  WITH CHECK (true);

-- Allow management users to view all submissions
CREATE POLICY "Management can view lead simulation submissions" 
  ON public.lead_simulation_submissions 
  FOR SELECT 
  USING (has_management_access(auth.uid()));

-- Allow management users to update submissions (for admin notes, status changes, etc.)
CREATE POLICY "Management can update lead simulation submissions" 
  ON public.lead_simulation_submissions 
  FOR UPDATE 
  USING (has_management_access(auth.uid()));
