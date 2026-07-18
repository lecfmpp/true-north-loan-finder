-- Delete all recent blog posts created today
DELETE FROM public.blog_posts 
WHERE created_at >= CURRENT_DATE
AND title IN (
  'The Ultimate Guide to Small Business Loans in Canada: Everything You Need to Know',
  'Restaurant Merchant Cash Advance: Your Lifeline During Slow Seasons',
  'Secured vs Unsecured Business Loans: Which Path Should You Choose?',
  'Canadian Business Loan Comparison Guide: Finding Your Perfect Match',
  'Merchant Cash Advance Explained: Fast Funding for Growing Businesses',
  'Business Expansion Loan Signs: When Your Company Is Ready for Growth'
);