import { useEffect } from 'react';

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
  
  // Auto-generate canonical URL if not provided
  const getCanonicalUrl = () => {
    if (canonicalUrl) return canonicalUrl;
    
    const currentPath = window.location.pathname;
    // Remove trailing slash for consistency
    const cleanPath = currentPath === '/' ? '/' : currentPath.replace(/\/$/, '');
    return `https://truenorthbusinessloan.ca${cleanPath}`;
  };
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta tags
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
    
    // Canonical URL - always set one
    const finalCanonicalUrl = getCanonicalUrl();
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', finalCanonicalUrl);
    
    // Also update Open Graph URL
    updateMetaTag('og:url', finalCanonicalUrl, true);
    
    // Structured Data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
    
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, article, structuredData]);

  return null;
};

export default SEOHead;