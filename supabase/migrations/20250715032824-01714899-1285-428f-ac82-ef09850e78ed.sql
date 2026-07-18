-- Remove embedded CTA buttons from existing blog post content
UPDATE blog_posts 
SET content = REGEXP_REPLACE(
  content, 
  '<div[^>]*class="[^"]*cta[^"]*"[^>]*>.*?</div>', 
  '', 
  'g'
),
content = REGEXP_REPLACE(
  content, 
  '<a[^>]*class="[^"]*btn[^"]*"[^>]*>.*?</a>', 
  '', 
  'g'
),
content = REGEXP_REPLACE(
  content, 
  '<button[^>]*>.*?</button>', 
  '', 
  'g'
),
-- Remove any standalone CTA sections that might be embedded in content
content = REGEXP_REPLACE(
  content, 
  '<div[^>]*>\s*<h[2-6][^>]*>[^<]*(?:Ready|Get|Find)[^<]*(?:Started|Financing|Solution)[^<]*</h[2-6]>.*?</div>', 
  '', 
  'gi'
),
-- Remove any blue button divs or spans
content = REGEXP_REPLACE(
  content, 
  '<div[^>]*(?:background[^>]*blue|bg-blue|bg-primary)[^>]*>.*?</div>', 
  '', 
  'gi'
),
updated_at = now()
WHERE status = 'published';