-- Update blog posts with appropriate thumbnails based on their topics
UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'small-business-loan-guide-canada' OR slug = 'equipment-financing-benefits';

UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'invoice-factoring-cash-flow';

UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'merchant-cash-advance-pros-cons';

UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'business-credit-score-tips';

UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'startup-funding-options-canada';

UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'seasonal-business-financing';