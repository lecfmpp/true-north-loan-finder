-- Update blog posts with appropriate thumbnails using the correct slugs
UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'equipment-financing-guide-canadian-businesses';

UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'signs-business-ready-growth-financing';

UPDATE public.blog_posts 
SET featured_image_url = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
WHERE slug = 'credit-score-impact-business-loans';