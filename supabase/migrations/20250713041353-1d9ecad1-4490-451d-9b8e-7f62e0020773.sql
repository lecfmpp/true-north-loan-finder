-- Create table for storing content briefs
CREATE TABLE public.content_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  user_intent TEXT NOT NULL,
  suggested_h1 TEXT NOT NULL,
  h2_headings TEXT[] NOT NULL,
  key_angles TEXT[] NOT NULL,
  content_gaps TEXT[] NOT NULL,
  word_count INTEGER NOT NULL,
  competitors JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;

-- Create policies for content briefs
CREATE POLICY "Admins can view all content briefs" 
ON public.content_briefs 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));

CREATE POLICY "Admins can create content briefs" 
ON public.content_briefs 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));

CREATE POLICY "Admins can update content briefs" 
ON public.content_briefs 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));

CREATE POLICY "Admins can delete content briefs" 
ON public.content_briefs 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_content_briefs_updated_at
BEFORE UPDATE ON public.content_briefs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();