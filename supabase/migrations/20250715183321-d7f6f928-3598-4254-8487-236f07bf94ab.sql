-- Create social proof notifications table
CREATE TABLE public.social_proof_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_company TEXT NOT NULL,
  amount_funded INTEGER NOT NULL,
  lender TEXT NOT NULL,
  background_color TEXT NOT NULL DEFAULT '#10B981',
  emoji TEXT NOT NULL DEFAULT '🎉',
  profile_picture_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_proof_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active social proof notifications" 
ON public.social_proof_notifications 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Superadmin can manage social proof notifications" 
ON public.social_proof_notifications 
FOR ALL 
USING (is_superadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_proof_notifications_updated_at
BEFORE UPDATE ON public.social_proof_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 10 mock social proof notifications using existing lenders
INSERT INTO public.social_proof_notifications (client_name, client_company, amount_funded, lender, background_color, emoji, profile_picture_url, display_order) VALUES
('Sarah Johnson', 'Maple Leaf Bakery', 129000, 'IOU Financial', '#10B981', '💰', 'https://images.unsplash.com/photo-1494790108755-2616b74bb651?w=150', 1),
('Mike Chen', 'Tech Solutions Pro', 85000, 'Driven', '#3B82F6', '🚀', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 2),
('Jessica Rodriguez', 'Coastal Restaurants', 245000, 'IOU Financial', '#8B5CF6', '🔥', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 3),
('David Thompson', 'Northern Construction', 340000, 'Northpoint Commercial Finance', '#EF4444', '🎯', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 4),
('Lisa Park', 'E-Shop Fashions', 67000, 'Merchant Growth', '#F59E0B', '✨', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150', 5),
('Robert Wilson', 'City Fitness Center', 95000, 'Greenbox Capital', '#06B6D4', '💪', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', 6),
('Amanda Foster', 'Sweet Treats Cafe', 45000, '2M7 Financial Solutions', '#EC4899', '🍰', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150', 7),
('Thomas Brown', 'Metro Auto Repair', 156000, 'IOU Financial', '#84CC16', '🔧', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 8),
('Rachel Green', 'Urban Wellness Spa', 78000, 'Driven', '#F97316', '🌿', 'https://images.unsplash.com/photo-1567532900872-f4e906cbf06a?w=150', 9),
('Kevin Martinez', 'Prime Logistics', 289000, 'Merchant Growth', '#6366F1', '📦', 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150', 10);