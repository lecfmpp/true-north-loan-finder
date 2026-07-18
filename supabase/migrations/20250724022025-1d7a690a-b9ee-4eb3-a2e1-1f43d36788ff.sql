-- Create admin notification settings table
CREATE TABLE public.admin_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_notification_email TEXT NOT NULL DEFAULT 'admin@company.com',
  application_notification_email TEXT NOT NULL DEFAULT 'admin@company.com',
  is_quiz_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  is_application_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Superadmin can manage notification settings" 
ON public.admin_notification_settings 
FOR ALL 
USING (is_superadmin(auth.uid()));

-- Insert default settings
INSERT INTO public.admin_notification_settings (quiz_notification_email, application_notification_email)
VALUES ('admin@company.com', 'admin@company.com');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_notification_settings_updated_at
BEFORE UPDATE ON public.admin_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();