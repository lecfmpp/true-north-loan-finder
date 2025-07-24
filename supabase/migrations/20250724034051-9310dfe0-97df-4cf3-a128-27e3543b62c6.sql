-- Create table for draft applications to save partial progress
CREATE TABLE public.usa_application_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  current_step INTEGER NOT NULL DEFAULT 1,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quiz_response_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.usa_application_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only access their own drafts
CREATE POLICY "Users can view their own drafts"
ON public.usa_application_drafts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
ON public.usa_application_drafts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
ON public.usa_application_drafts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
ON public.usa_application_drafts
FOR DELETE
USING (auth.uid() = user_id);

-- Management users can view all drafts for support purposes
CREATE POLICY "Management users can view all drafts"
ON public.usa_application_drafts
FOR SELECT
USING (public.has_management_access(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_usa_application_drafts_updated_at
BEFORE UPDATE ON public.usa_application_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_usa_application_drafts_user_id ON public.usa_application_drafts(user_id);
CREATE INDEX idx_usa_application_drafts_updated_at ON public.usa_application_drafts(last_updated DESC);