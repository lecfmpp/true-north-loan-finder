
-- 1) Ensure clients table exists with all required columns
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  company_website TEXT,
  years_of_experience INTEGER,
  license_number TEXT,
  business_description TEXT,
  preferred_industries TEXT[],
  min_monthly_revenue TEXT,
  max_monthly_revenue TEXT,
  min_time_in_business TEXT,
  min_credit_score TEXT,
  min_loan_amount TEXT,
  max_loan_amount TEXT,
  geographic_areas TEXT[],
  additional_requirements TEXT,
  application_type TEXT DEFAULT 'client',
  tracking_id TEXT,
  utm_params JSONB DEFAULT '{}'::jsonb,
  lead_source TEXT DEFAULT 'lead_simulation',
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  payment_status TEXT DEFAULT 'waiting_payment',
  stripe_payment_link_id TEXT,
  stripe_session_id TEXT,
  payment_reminder_sent_at TIMESTAMPTZ,
  payment_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Add missing columns if this table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='company_website') THEN
    ALTER TABLE public.clients ADD COLUMN company_website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='years_of_experience') THEN
    ALTER TABLE public.clients ADD COLUMN years_of_experience INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='license_number') THEN
    ALTER TABLE public.clients ADD COLUMN license_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='business_description') THEN
    ALTER TABLE public.clients ADD COLUMN business_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='preferred_industries') THEN
    ALTER TABLE public.clients ADD COLUMN preferred_industries TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='min_monthly_revenue') THEN
    ALTER TABLE public.clients ADD COLUMN min_monthly_revenue TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='max_monthly_revenue') THEN
    ALTER TABLE public.clients ADD COLUMN max_monthly_revenue TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='min_time_in_business') THEN
    ALTER TABLE public.clients ADD COLUMN min_time_in_business TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='min_credit_score') THEN
    ALTER TABLE public.clients ADD COLUMN min_credit_score TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='min_loan_amount') THEN
    ALTER TABLE public.clients ADD COLUMN min_loan_amount TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='max_loan_amount') THEN
    ALTER TABLE public.clients ADD COLUMN max_loan_amount TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='geographic_areas') THEN
    ALTER TABLE public.clients ADD COLUMN geographic_areas TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='additional_requirements') THEN
    ALTER TABLE public.clients ADD COLUMN additional_requirements TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='application_type') THEN
    ALTER TABLE public.clients ADD COLUMN application_type TEXT DEFAULT 'client';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='tracking_id') THEN
    ALTER TABLE public.clients ADD COLUMN tracking_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='utm_params') THEN
    ALTER TABLE public.clients ADD COLUMN utm_params JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='payment_status') THEN
    ALTER TABLE public.clients ADD COLUMN payment_status TEXT DEFAULT 'waiting_payment';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='stripe_payment_link_id') THEN
    ALTER TABLE public.clients ADD COLUMN stripe_payment_link_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='stripe_session_id') THEN
    ALTER TABLE public.clients ADD COLUMN stripe_session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='payment_reminder_sent_at') THEN
    ALTER TABLE public.clients ADD COLUMN payment_reminder_sent_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='payment_completed_at') THEN
    ALTER TABLE public.clients ADD COLUMN payment_completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3) Indexes for speed and uniqueness where helpful
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_tracking_id ON public.clients (tracking_id);
-- Optionally, make tracking_id unique if you always generate one per submission:
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_tracking_id ON public.clients (tracking_id) WHERE tracking_id IS NOT NULL;

-- 4) Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 5) Replace RLS policies with a clean, safe set
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clients') THEN
    DROP POLICY IF EXISTS "Anyone can submit client contacts with validation" ON public.clients;
    DROP POLICY IF EXISTS "Public can insert broker client data" ON public.clients;
    DROP POLICY IF EXISTS "Management users can view all clients" ON public.clients;
    DROP POLICY IF EXISTS "Management users can update clients" ON public.clients;
    DROP POLICY IF EXISTS "Superadmin can delete clients" ON public.clients;
  END IF;
END $$;

-- Public can INSERT (no auth), with validation
CREATE POLICY "Public can insert client data"
ON public.clients
FOR INSERT
WITH CHECK (
  name IS NOT NULL
  AND email IS NOT NULL
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
  AND char_length(name) BETWEEN 2 AND 100
  AND (phone IS NULL OR char_length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10)
);

-- Management can SELECT and UPDATE
CREATE POLICY "Management can view all clients"
ON public.clients
FOR SELECT
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can update clients"
ON public.clients
FOR UPDATE
USING (has_management_access(auth.uid()));

-- Superadmin can DELETE
CREATE POLICY "Superadmin can delete clients"
ON public.clients
FOR DELETE
USING (is_superadmin(auth.uid()));

-- 6) Ensure updated_at trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_clients_updated_at'
  ) THEN
    CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
