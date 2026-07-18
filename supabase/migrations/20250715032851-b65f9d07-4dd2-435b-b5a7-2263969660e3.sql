-- Remove embedded CTA buttons and blue buttons from existing blog post content
UPDATE blog_posts 
SET content = REGEXP_REPLACE(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          content, 
          '<div[^>]*class="[^"]*cta[^"]*"[^>]*>.*?</div>', 
          '', 
          'g'
        ),
        '<a[^>]*class="[^"]*btn[^"]*"[^>]*>.*?</a>', 
        '', 
        'g'
      ),
      '<button[^>]*>.*?</button>', 
      '', 
      'g'
    ),
    '<div[^>]*>\s*<h[2-6][^>]*>[^<]*(?:Ready|Get|Find)[^<]*(?:Started|Financing|Solution)[^<]*</h[2-6]>.*?</div>', 
    '', 
    'gi'
  ),
  '<div[^>]*(?:background[^>]*blue|bg-blue|bg-primary)[^>]*>.*?</div>', 
  '', 
  'gi'
),
updated_at = now()
WHERE status = 'published';