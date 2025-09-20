-- Update blog posts to use proper HTML heading structure
UPDATE public.blog_posts 
SET content = REPLACE(content, '## ', '<h2>')
WHERE title IN (
  'How to Finance Heavy Equipment for Your Construction Business in Alberta',
  'How Invoice Factoring Can Solve Your Business''s Cash Flow Problems',
  'Yes, You Can Get a Business Loan with Bad Credit in Canada. Here''s How.',
  'What Lenders Look for in a Business Loan Application (And How to Prepare)',
  'Is Your Business a Good Candidate for Invoice Factoring?',
  'Cannabis Business Loans: How to Get Funding in a High-Risk Industry'
);

-- Replace ### with h3 tags
UPDATE public.blog_posts 
SET content = REPLACE(content, '### ', '<h3>')
WHERE title IN (
  'How to Finance Heavy Equipment for Your Construction Business in Alberta',
  'How Invoice Factoring Can Solve Your Business''s Cash Flow Problems',
  'Yes, You Can Get a Business Loan with Bad Credit in Canada. Here''s How.',
  'What Lenders Look for in a Business Loan Application (And How to Prepare)',
  'Is Your Business a Good Candidate for Invoice Factoring?',
  'Cannabis Business Loans: How to Get Funding in a High-Risk Industry'
);

-- Close the heading tags properly
UPDATE public.blog_posts 
SET content = REGEXP_REPLACE(
  content, 
  '<h2>([^<\n]+)', 
  '<h2>\1</h2>', 
  'g'
)
WHERE title IN (
  'How to Finance Heavy Equipment for Your Construction Business in Alberta',
  'How Invoice Factoring Can Solve Your Business''s Cash Flow Problems',
  'Yes, You Can Get a Business Loan with Bad Credit in Canada. Here''s How.',
  'What Lenders Look for in a Business Loan Application (And How to Prepare)',
  'Is Your Business a Good Candidate for Invoice Factoring?',
  'Cannabis Business Loans: How to Get Funding in a High-Risk Industry'
);

-- Close h3 tags properly
UPDATE public.blog_posts 
SET content = REGEXP_REPLACE(
  content, 
  '<h3>([^<\n]+)', 
  '<h3>\1</h3>', 
  'g'
)
WHERE title IN (
  'How to Finance Heavy Equipment for Your Construction Business in Alberta',
  'How Invoice Factoring Can Solve Your Business''s Cash Flow Problems',
  'Yes, You Can Get a Business Loan with Bad Credit in Canada. Here''s How.',
  'What Lenders Look for in a Business Loan Application (And How to Prepare)',
  'Is Your Business a Good Candidate for Invoice Factoring?',
  'Cannabis Business Loans: How to Get Funding in a High-Risk Industry'
);

-- Add proper h1 tag for main title (since it's not included in content, it comes from the title field)
-- This ensures the content follows proper heading hierarchy starting from h2

-- Fix any double line breaks that may cause spacing issues
UPDATE public.blog_posts 
SET content = REPLACE(content, E'\n\n', '</p><p>')
WHERE title IN (
  'How to Finance Heavy Equipment for Your Construction Business in Alberta',
  'How Invoice Factoring Can Solve Your Business''s Cash Flow Problems',
  'Yes, You Can Get a Business Loan with Bad Credit in Canada. Here''s How.',
  'What Lenders Look for in a Business Loan Application (And How to Prepare)',
  'Is Your Business a Good Candidate for Invoice Factoring?',
  'Cannabis Business Loans: How to Get Funding in a High-Risk Industry'
);

-- Wrap content in paragraph tags where needed
UPDATE public.blog_posts 
SET content = '<p>' || content || '</p>'
WHERE title IN (
  'How to Finance Heavy Equipment for Your Construction Business in Alberta',
  'How Invoice Factoring Can Solve Your Business''s Cash Flow Problems',
  'Yes, You Can Get a Business Loan with Bad Credit in Canada. Here''s How.',
  'What Lenders Look for in a Business Loan Application (And How to Prepare)',
  'Is Your Business a Good Candidate for Invoice Factoring?',
  'Cannabis Business Loans: How to Get Funding in a High-Risk Industry'
);