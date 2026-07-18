-- Remove Go High Level (GHL) integration tables and policies

-- Drop GHL-related tables
DROP TABLE IF EXISTS public.ghl_integration_logs CASCADE;
DROP TABLE IF EXISTS public.ghl_activity_logs CASCADE;
DROP TABLE IF EXISTS public.ghl_integrations CASCADE;

-- Remove any GHL-related columns from quiz_responses if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_responses' AND column_name = 'ghl_contact_id') THEN
        ALTER TABLE public.quiz_responses DROP COLUMN ghl_contact_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_responses' AND column_name = 'ghl_opportunity_id') THEN
        ALTER TABLE public.quiz_responses DROP COLUMN ghl_opportunity_id;
    END IF;
END $$;