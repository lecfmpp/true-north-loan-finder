-- Add page identifier to video_settings table or create it if it doesn't exist
CREATE TABLE IF NOT EXISTS public.video_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_identifier TEXT NOT NULL DEFAULT 'default',
  video_url TEXT,
  embed_code TEXT,
  video_title TEXT DEFAULT 'Video',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add page_identifier column if table exists but column doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'video_settings' AND column_name = 'page_identifier') THEN
    ALTER TABLE public.video_settings ADD COLUMN page_identifier TEXT NOT NULL DEFAULT 'default';
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'video_settings' AND column_name = 'is_active') THEN
    ALTER TABLE public.video_settings ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.video_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Superadmin can manage video settings" ON public.video_settings;
DROP POLICY IF EXISTS "Anyone can view active video settings" ON public.video_settings;

-- Create policies for superadmin management
CREATE POLICY "Superadmin can manage video settings" 
ON public.video_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
);

-- Create policy for public viewing of active videos
CREATE POLICY "Anyone can view active video settings" 
ON public.video_settings FOR SELECT 
USING (is_active = true);

-- Create unique constraint for page_identifier to ensure one active video per page
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_settings_page_active 
ON public.video_settings (page_identifier) 
WHERE is_active = true;

-- Update existing records to have page identifiers
UPDATE public.video_settings 
SET page_identifier = 'broker-lp-video' 
WHERE page_identifier = 'default' OR page_identifier IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_video_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_video_settings_updated_at ON public.video_settings;
CREATE TRIGGER update_video_settings_updated_at
  BEFORE UPDATE ON public.video_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_video_settings_updated_at();