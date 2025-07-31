-- Create partners table for approved partners
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  phone TEXT,
  application_type TEXT NOT NULL, -- 'lender' or 'broker'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  total_leads_assigned INTEGER NOT NULL DEFAULT 0,
  leads_contacted INTEGER NOT NULL DEFAULT 0,
  leads_spoken INTEGER NOT NULL DEFAULT 0,
  deals_closed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create policies for partners table
CREATE POLICY "Superadmin can manage partners" 
ON public.partners 
FOR ALL 
USING (is_superadmin(auth.uid()));

CREATE POLICY "Partners can view their own data" 
ON public.partners 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create lead assignments tracking table
CREATE TABLE public.lead_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_response_id UUID NOT NULL REFERENCES public.quiz_responses(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'contacted', 'spoken', 'closed', 'rejected'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lead_assignments table
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_assignments table
CREATE POLICY "Management can manage lead assignments" 
ON public.lead_assignments 
FOR ALL 
USING (has_management_access(auth.uid()));

CREATE POLICY "Partners can view their assigned leads" 
ON public.lead_assignments 
FOR SELECT 
USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- Add partner assignment fields to quiz_responses
ALTER TABLE public.quiz_responses 
ADD COLUMN assigned_partner_id UUID REFERENCES public.partners(id),
ADD COLUMN assignment_date TIMESTAMP WITH TIME ZONE;

-- Create trigger to update partner stats when assignments change
CREATE OR REPLACE FUNCTION public.update_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total leads assigned
  IF TG_OP = 'INSERT' THEN
    UPDATE public.partners 
    SET total_leads_assigned = total_leads_assigned + 1,
        updated_at = now()
    WHERE id = NEW.partner_id;
    
    -- Update quiz_responses with assignment info
    UPDATE public.quiz_responses 
    SET assigned_partner_id = NEW.partner_id,
        assignment_date = NEW.assigned_at
    WHERE id = NEW.quiz_response_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update stats based on status changes
    IF OLD.status != NEW.status THEN
      UPDATE public.partners 
      SET 
        leads_contacted = CASE WHEN NEW.status = 'contacted' THEN leads_contacted + 1 ELSE leads_contacted END,
        leads_spoken = CASE WHEN NEW.status = 'spoken' THEN leads_spoken + 1 ELSE leads_spoken END,
        deals_closed = CASE WHEN NEW.status = 'closed' THEN deals_closed + 1 ELSE deals_closed END,
        updated_at = now()
      WHERE id = NEW.partner_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.partners 
    SET total_leads_assigned = total_leads_assigned - 1,
        updated_at = now()
    WHERE id = OLD.partner_id;
    
    -- Remove assignment info from quiz_responses
    UPDATE public.quiz_responses 
    SET assigned_partner_id = NULL,
        assignment_date = NULL
    WHERE id = OLD.quiz_response_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for partner stats updates
CREATE TRIGGER update_partner_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.lead_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_partner_stats();

-- Add updated_at trigger to partners table
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger to lead_assignments table  
CREATE TRIGGER update_lead_assignments_updated_at
  BEFORE UPDATE ON public.lead_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();