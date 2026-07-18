-- Create chat widget configuration table
CREATE TABLE public.chat_widget_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  support_person_name TEXT NOT NULL DEFAULT 'Support Agent',
  support_person_avatar_url TEXT,
  ai_instructions TEXT NOT NULL DEFAULT 'You are a helpful customer support assistant. Be friendly, professional, and guide users to the right information.',
  widget_position TEXT NOT NULL DEFAULT 'bottom-right',
  primary_color TEXT NOT NULL DEFAULT '#0066cc',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat widget Q&A table
CREATE TABLE public.chat_widget_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  related_links JSONB DEFAULT '[]',
  fallback_action TEXT NOT NULL DEFAULT 'escalate',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_widget_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_widget_qa ENABLE ROW LEVEL SECURITY;

-- Create policies for chat widget config
CREATE POLICY "Admins can manage chat widget config" 
ON public.chat_widget_config 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Anyone can view enabled chat widget config" 
ON public.chat_widget_config 
FOR SELECT 
USING (is_enabled = true);

-- Create policies for chat widget Q&A
CREATE POLICY "Admins can manage chat widget Q&A" 
ON public.chat_widget_qa 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Anyone can view active chat widget Q&A" 
ON public.chat_widget_qa 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_chat_widget_config_updated_at
BEFORE UPDATE ON public.chat_widget_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_widget_qa_updated_at
BEFORE UPDATE ON public.chat_widget_qa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.chat_widget_config (
  is_enabled,
  support_person_name,
  ai_instructions,
  widget_position,
  primary_color
) VALUES (
  false,
  'Support Agent',
  'You are a helpful customer support assistant for a business financing company. Be friendly, professional, and guide users to the right information about loans, financing options, and our services.',
  'bottom-right',
  '#0066cc'
);