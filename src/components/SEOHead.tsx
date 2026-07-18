
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IS_SERVER, setSsrHead } from '@/lib/ssr-head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  article?: {
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
  structuredData?: any;
}

const SEOHead = ({
  title = "True North Business Loan - Find the Right Business Loan for Your Canadian Small Business",
  description = "Take our 60-second quiz to see your loan options from Canada's top lenders. Get $5K to $800K for your Canadian small business.",
  keywords = ["business loans canada", "small business financing", "equipment financing", "canadian business loans", "business loan calculator"],
  canonicalUrl,
  ogType = "website",
  ogImage = "https://truenorthbusinessloan.ca/lovable-uploads/e80bb666-2b36-4875-bd9f-78f3e944d749.png",
  article,
  structuredData
}: SEOHeadProps) => {
  
  // Router location works on both the client and the server; window does not.
  const { pathname } = useLocation();

  // Auto-generate canonical URL if not provided - more robust handling
  const getCanonicalUrl = () => {
    if (canonicalUrl) return canonicalUrl;

    const currentPath = pathname;
    // Remove trailing slash for consistency and handle edge cases
    const cleanPath = currentPath === '/' ? '/' : currentPath.replace(/\/+$/, '');
    
    // Ensure we're using the correct domain without www
    const baseUrl = 'https://truenorthbusinessloan.ca';
    return `${baseUrl}${cleanPath}`;
  };
  
  // Pre-rendering: effects never run, so hand the resolved metadata to the
  // prerender script instead of mutating a document that doesn't exist.
  if (IS_SERVER) {
    setSsrHead({
      title,
      description,
      keywords,
      canonicalUrl: getCanonicalUrl(),
      ogType,
      ogImage,
      article,
      structuredData,
    });
  }

  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Clear any existing duplicate meta tags to avoid conflicts
    const clearDuplicateTags = (selector: string) => {
      const existingTags = document.querySelectorAll(selector);
      existingTags.forEach(tag => tag.remove());
    };
    
    // Update meta tags with better conflict resolution
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('author', 'True North Business Loan');
    updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('googlebot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:site_name', 'True North Business Loan', true);
    updateMetaTag('og:locale', 'en_CA', true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    
    // Article specific tags
    if (article && ogType === 'article') {
      // Clear existing article tags first
      clearDuplicateTags('meta[property^="article:"]');
      
      if (article.author) updateMetaTag('article:author', article.author, true);
      if (article.publishedTime) updateMetaTag('article:published_time', article.publishedTime, true);
      if (article.modifiedTime) updateMetaTag('article:modified_time', article.modifiedTime, true);
      if (article.section) updateMetaTag('article:section', article.section, true);
      if (article.tags) {
        article.tags.forEach(tag => {
          const tagMeta = document.createElement('meta');
          tagMeta.setAttribute('property', 'article:tag');
          tagMeta.setAttribute('content', tag);
          document.head.appendChild(tagMeta);
        });
      }
    }
    
    // Canonical URL - always set one and ensure it's correct
    const finalCanonicalUrl = getCanonicalUrl();
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', finalCanonicalUrl);
    
    // Also update Open Graph URL to match canonical
    updateMetaTag('og:url', finalCanonicalUrl, true);
    
    // Structured Data - clear existing and add new
    const existingStructuredData = document.querySelectorAll('script[type="application/ld+json"]');
    existingStructuredData.forEach(script => {
      // Only remove if it's not the base organization schema
      if (!script.textContent?.includes('"@type": "Organization"')) {
        script.remove();
      }
    });
    
    if (structuredData) {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
    
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, article, structuredData]);

  return null;
};

export default SEOHead;
