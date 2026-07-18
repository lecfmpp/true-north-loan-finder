-- Rename business_applications table to usa_applications
ALTER TABLE public.business_applications RENAME TO usa_applications;

-- Create sequence for reference number generation
CREATE SEQUENCE IF NOT EXISTS public.application_reference_seq START 1;

-- Create function to generate reference numbers
CREATE OR REPLACE FUNCTION public.generate_application_reference(app_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_val bigint;
  year_part text;
  prefix text;
BEGIN
  SELECT nextval('public.application_reference_seq') INTO next_val;
  SELECT EXTRACT(YEAR FROM now())::text INTO year_part;
  
  CASE app_type
    WHEN 'usa' THEN prefix := 'USA';
    WHEN 'canadian' THEN prefix := 'CAN';
    ELSE prefix := 'APP';
  END CASE;
  
  RETURN prefix || '-' || year_part || '-' || LPAD(next_val::text, 6, '0');
END;
$$;

-- Add tracking fields to usa_applications
ALTER TABLE public.usa_applications 
ADD COLUMN quiz_response_id UUID,
ADD COLUMN application_reference_number TEXT UNIQUE DEFAULT generate_application_reference('usa'),
ADD COLUMN user_id UUID,
ADD COLUMN lead_source TEXT DEFAULT 'direct',
ADD COLUMN conversion_stage TEXT DEFAULT 'application' CHECK (conversion_stage IN ('lead', 'application', 'in_review', 'approved', 'rejected'));

-- Add tracking fields to canadian_applications  
ALTER TABLE public.canadian_applications
ADD COLUMN quiz_response_id UUID,
ADD COLUMN application_reference_number TEXT UNIQUE DEFAULT generate_application_reference('canadian'),
ADD COLUMN user_id UUID,
ADD COLUMN lead_source TEXT DEFAULT 'direct',
ADD COLUMN conversion_stage TEXT DEFAULT 'application' CHECK (conversion_stage IN ('lead', 'application', 'in_review', 'approved', 'rejected'));

-- Add foreign key constraints
ALTER TABLE public.usa_applications
ADD CONSTRAINT fk_usa_applications_quiz_response 
FOREIGN KEY (quiz_response_id) REFERENCES public.quiz_responses(id),
ADD CONSTRAINT fk_usa_applications_user 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.canadian_applications
ADD CONSTRAINT fk_canadian_applications_quiz_response 
FOREIGN KEY (quiz_response_id) REFERENCES public.quiz_responses(id),
ADD CONSTRAINT fk_canadian_applications_user 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Create indexes for performance
CREATE INDEX idx_usa_applications_quiz_response ON public.usa_applications(quiz_response_id);
CREATE INDEX idx_usa_applications_reference ON public.usa_applications(application_reference_number);
CREATE INDEX idx_usa_applications_user ON public.usa_applications(user_id);
CREATE INDEX idx_usa_applications_conversion_stage ON public.usa_applications(conversion_stage);

CREATE INDEX idx_canadian_applications_quiz_response ON public.canadian_applications(quiz_response_id);
CREATE INDEX idx_canadian_applications_reference ON public.canadian_applications(application_reference_number);
CREATE INDEX idx_canadian_applications_user ON public.canadian_applications(user_id);
CREATE INDEX idx_canadian_applications_conversion_stage ON public.canadian_applications(conversion_stage);

-- Update existing records with reference numbers (backfill)
UPDATE public.usa_applications 
SET application_reference_number = generate_application_reference('usa')
WHERE application_reference_number IS NULL;

UPDATE public.canadian_applications 
SET application_reference_number = generate_application_reference('canadian')
WHERE application_reference_number IS NULL;