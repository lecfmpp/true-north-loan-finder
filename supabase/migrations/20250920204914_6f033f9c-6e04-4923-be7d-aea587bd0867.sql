-- Remove the remaining duplicate blog post (keeping the newer one)
DELETE FROM public.blog_posts 
WHERE id = '40cdecac-a1a8-4030-bd13-aaea8b2f9ab8';