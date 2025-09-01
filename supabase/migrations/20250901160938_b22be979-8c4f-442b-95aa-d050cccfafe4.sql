-- Create video_settings table to store video configuration
CREATE TABLE public.video_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url TEXT,
  embed_code TEXT,
  video_title TEXT DEFAULT 'Partnership Video',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin can view video settings" 
ON public.video_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can create video settings" 
ON public.video_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can update video settings" 
ON public.video_settings 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_settings_updated_at
BEFORE UPDATE ON public.video_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default empty record
INSERT INTO public.video_settings (video_title) VALUES ('Partnership Overview Video');