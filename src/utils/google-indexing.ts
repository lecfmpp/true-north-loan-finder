// Google Indexing API utilities and helpers

export interface IndexingRequest {
  url: string;
  type: 'URL_UPDATED' | 'URL_DELETED';
}

// URLs that were updated and need reindexing
export const updatedURLs = [
  'https://truenorthbusinessloan.ca/',
  'https://truenorthbusinessloan.ca/small-business-loans',
  'https://truenorthbusinessloan.ca/invoice-factoring', 
  'https://truenorthbusinessloan.ca/merchant-cash-advance',
  'https://truenorthbusinessloan.ca/compare',
  'https://truenorthbusinessloan.ca/blog'
];

// Generate indexing requests for updated pages
export const generateIndexingRequests = (): IndexingRequest[] => {
  return updatedURLs.map(url => ({
    url,
    type: 'URL_UPDATED'
  }));
};

// Create manual sitemap submission data
export const sitemapSubmissionData = {
  sitemap_url: 'https://truenorthbusinessloan.ca/sitemap.xml',
  updated_date: '2024-09-22',
  pages_count: 32,
  priority_pages: [
    'https://truenorthbusinessloan.ca/',
    'https://truenorthbusinessloan.ca/loan-estimator',
    'https://truenorthbusinessloan.ca/small-business-loans',
    'https://truenorthbusinessloan.ca/invoice-factoring',
    'https://truenorthbusinessloan.ca/merchant-cash-advance'
  ]
};

// Google Search Console performance tracking
export const searchConsoleMetrics = {
  target_keywords: [
    'business loans canada',
    'fast business funding',
    'small business loans',
    'invoice factoring',
    'merchant cash advance',
    'equipment financing',
    'business loan approval',
    'canadian business financing'
  ],
  expected_improvements: {
    ctr_increase: '15-25%',
    impression_increase: '20-30%',
    ranking_improvement: '5-10 positions',
    conversion_increase: '20-35%'
  }
};

// SEO monitoring checklist
export const seoChecklist = {
  technical: [
    '✅ Updated sitemap.xml with current dates',
    '✅ Optimized title tags (all under 60 chars)',
    '✅ Enhanced meta descriptions (all under 160 chars)', 
    '✅ Added structured data (Organization, FinancialProduct, FAQ)',
    '✅ Improved canonical URLs',
    '✅ Enhanced robots.txt',
    '✅ Added manifest.json for PWA',
    '✅ Created browserconfig.xml for Windows tiles'
  ],
  content: [
    '✅ Enhanced value propositions with urgency',
    '✅ Improved CTA copy and placement',
    '✅ Added trust signals and social proof',
    '✅ Optimized keywords for target search terms',
    '✅ Enhanced benefits and features descriptions'
  ],
  performance: [
    '✅ Optimized images with proper alt tags',
    '✅ Implemented lazy loading',
    '✅ Added preconnect links for performance',
    '✅ DNS prefetch for external resources'
  ]
};

// Manual submission instructions for Google Search Console
export const manualSubmissionInstructions = `
GOOGLE SEARCH CONSOLE SUBMISSION CHECKLIST:

1. SITEMAP SUBMISSION:
   - Go to Google Search Console
   - Navigate to Sitemaps section
   - Submit: https://truenorthbusinessloan.ca/sitemap.xml
   - Date updated: 2024-09-22

2. URL INSPECTION REQUESTS:
   Submit these priority URLs for immediate crawling:
   - https://truenorthbusinessloan.ca/
   - https://truenorthbusinessloan.ca/small-business-loans
   - https://truenorthbusinessloan.ca/invoice-factoring
   - https://truenorthbusinessloan.ca/merchant-cash-advance
   - https://truenorthbusinessloan.ca/compare

3. PERFORMANCE MONITORING:
   Track these metrics over next 4-6 weeks:
   - CTR for target keywords
   - Average position improvements
   - Impression increases
   - Core Web Vitals scores

4. STRUCTURED DATA TESTING:
   - Use Google's Rich Results Test tool
   - Validate JSON-LD on all optimized pages
   - Check for any markup errors

5. MOBILE USABILITY:
   - Verify mobile-friendly test passes
   - Check Core Web Vitals on mobile
   - Ensure responsive design works correctly
`;

export default {
  generateIndexingRequests,
  sitemapSubmissionData,
  searchConsoleMetrics,
  seoChecklist,
  manualSubmissionInstructions
};