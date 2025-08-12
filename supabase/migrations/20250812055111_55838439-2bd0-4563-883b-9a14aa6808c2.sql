-- Create simplified USA applications table matching the 2-step flow
CREATE TABLE IF NOT EXISTS public.usa_applications_simplified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tracking
  application_reference_number TEXT DEFAULT public.generate_application_reference('usa'),
  status TEXT NOT NULL DEFAULT 'applicant',
  admin_notes TEXT,
  lead_source TEXT DEFAULT 'direct',
  conversion_stage TEXT DEFAULT 'application',

  -- Associations
  user_id UUID,
  quiz_response_id UUID,

  -- Company Information (Step 1)
  legal_corporation_name TEXT NOT NULL,
  dba_name TEXT,
  physical_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  telephone_number TEXT NOT NULL,
  fax_number TEXT,
  website TEXT,
  email_address TEXT NOT NULL,

  -- Federal & State (Step 1)
  federal_tax_id TEXT NOT NULL, -- EIN
  state_tax_id TEXT,
  state_of_incorporation TEXT,
  date_incorporated DATE,

  -- Principal (Step 2)
  principal_name TEXT NOT NULL,
  principal_title TEXT NOT NULL,
  principal_ssn TEXT NOT NULL,
  principal_date_of_birth DATE NOT NULL,
  principal_home_address TEXT NOT NULL,
  principal_city TEXT NOT NULL,
  principal_state TEXT NOT NULL,
  principal_zip TEXT NOT NULL,
  principal_home_phone TEXT,
  principal_cell_phone TEXT,
  principal_email TEXT NOT NULL,
  principal_ownership_percentage INTEGER NOT NULL,

  -- Loan (Step 1)
  loan_amount_requested INTEGER NOT NULL,
  use_of_funds TEXT NOT NULL,

  -- Documents
  document_files JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.usa_applications_simplified ENABLE ROW LEVEL SECURITY;

-- Policies (mirror canadian_applications semantics)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usa_applications_simplified' AND policyname = 'Authenticated users can submit USA applications (simplified)'
  ) THEN
    CREATE POLICY "Authenticated users can submit USA applications (simplified)"
    ON public.usa_applications_simplified
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usa_applications_simplified' AND policyname = 'Management users can update USA applications (simplified)'
  ) THEN
    CREATE POLICY "Management users can update USA applications (simplified)"
    ON public.usa_applications_simplified
    FOR UPDATE
    USING (public.has_management_access(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usa_applications_simplified' AND policyname = 'Management users can view USA applications (simplified)'
  ) THEN
    CREATE POLICY "Management users can view USA applications (simplified)"
    ON public.usa_applications_simplified
    FOR SELECT
    USING (public.has_management_access(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usa_applications_simplified' AND policyname = 'Superadmin can delete USA applications (simplified)'
  ) THEN
    CREATE POLICY "Superadmin can delete USA applications (simplified)"
    ON public.usa_applications_simplified
    FOR DELETE
    USING (public.is_superadmin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usa_applications_simplified' AND policyname = 'Users can view their own USA applications (simplified)'
  ) THEN
    CREATE POLICY "Users can view their own USA applications (simplified)"
    ON public.usa_applications_simplified
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Triggers
DROP TRIGGER IF EXISTS trg_usa_simplified_updated_at ON public.usa_applications_simplified;
CREATE TRIGGER trg_usa_simplified_updated_at
BEFORE UPDATE ON public.usa_applications_simplified
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- On insert, sync quiz response status
DROP TRIGGER IF EXISTS trg_usa_simplified_sync_quiz ON public.usa_applications_simplified;
CREATE TRIGGER trg_usa_simplified_sync_quiz
AFTER INSERT ON public.usa_applications_simplified
FOR EACH ROW EXECUTE FUNCTION public.update_lead_status_on_application();