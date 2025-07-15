-- Add widget configuration fields to social_proof_notifications table or create a separate config table
CREATE TABLE public.social_proof_widget_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interval_seconds INTEGER NOT NULL DEFAULT 8,
  max_notifications_per_session INTEGER NOT NULL DEFAULT 5,
  notification_duration_seconds INTEGER NOT NULL DEFAULT 8,
  initial_delay_seconds INTEGER NOT NULL DEFAULT 3,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_proof_widget_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view widget config" 
ON public.social_proof_widget_config 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmin can manage widget config" 
ON public.social_proof_widget_config 
FOR ALL 
USING (is_superadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_proof_widget_config_updated_at
BEFORE UPDATE ON public.social_proof_widget_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.social_proof_widget_config (interval_seconds, max_notifications_per_session, notification_duration_seconds, initial_delay_seconds, is_enabled) 
VALUES (8, 5, 8, 3, true);