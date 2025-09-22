import { useEffect } from 'react';

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Google Search Console integration component
export const GoogleSearchConsole = () => {
  useEffect(() => {
    // Add Google Search Console verification meta tag dynamically if needed
    const existingMeta = document.querySelector('meta[name="google-site-verification"]');
    if (!existingMeta) {
      const meta = document.createElement('meta');
      meta.name = 'google-site-verification';
      meta.content = 'your-verification-code-here'; // Replace with actual verification code
      document.head.appendChild(meta);
    }

    // Add Google Analytics if not already present
    const existingGA = document.querySelector('script[src*="gtag"]');
    if (!existingGA && typeof window !== 'undefined') {
      // GA4 tracking code would go here if needed
      console.log('Google Analytics integration ready');
    }
  }, []);

  return null;
};

// SEO monitoring utilities
export const trackSEOEvents = {
  // Track when users view key pages
  pageView: (pageName: string, url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: url,
        content_group1: 'SEO Optimized Pages'
      });
    }
  },

  // Track CTA clicks for conversion optimization
  ctaClick: (ctaText: string, location: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cta_click', {
        event_category: 'Conversion',
        event_label: ctaText,
        custom_parameter_1: location
      });
    }
  },

  // Track loan application starts
  applicationStart: (loanType: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        event_category: 'Loan Application',
        event_label: loanType,
        value: 1
      });
    }
  },

  // Track search queries if internal search exists
  internalSearch: (searchTerm: string, resultsCount: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm,
        content_group2: 'Internal Search',
        custom_parameter_2: resultsCount
      });
    }
  }
};

// URL monitoring for canonical issues
export const canonicalChecker = () => {
  useEffect(() => {
    const currentURL = window.location.href;
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    
    // Check if canonical URL matches current URL structure
    if (canonical && !canonical.includes(window.location.pathname)) {
      console.warn('Canonical URL mismatch detected:', {
        current: currentURL,
        canonical: canonical
      });
    }
    
    // Check for trailing slash consistency
    const hasTrailingSlash = currentURL.endsWith('/');
    const canonicalHasTrailingSlash = canonical?.endsWith('/');
    
    if (hasTrailingSlash !== canonicalHasTrailingSlash) {
      console.warn('Trailing slash inconsistency between current URL and canonical');
    }
  }, []);
};

// Rich snippets validator
export const validateStructuredData = () => {
  useEffect(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach((script, index) => {
      try {
        const data = JSON.parse(script.textContent || '');
        console.log(`Structured data ${index + 1} is valid:`, data);
        
        // Basic validation checks
        if (!data['@context'] || !data['@type']) {
          console.warn(`Structured data ${index + 1} missing required @context or @type`);
        }
      } catch (error) {
        console.error(`Invalid JSON-LD in script ${index + 1}:`, error);
      }
    });
  }, []);
};

export default GoogleSearchConsole;