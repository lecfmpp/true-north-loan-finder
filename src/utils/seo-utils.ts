// SEO and structured data utilities

export interface BusinessSchema {
  name: string;
  industry: string;
  description: string;
  services: string[];
  location: string;
  benefits: string[];
}

export const generateBusinessStructuredData = (business: BusinessSchema, pageUrl: string) => {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Business Loans for ${business.name}`,
    "description": business.description,
    "provider": {
      "@type": "FinancialService",
      "name": "True North Business Loan",
      "url": "https://truenorthbusinessloan.ca",
      "logo": "https://truenorthbusinessloan.ca/lovable-uploads/e80bb666-2b36-4875-bd9f-78f3e944d749.png",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "CA"
      }
    },
    "serviceType": "Business Financing",
    "areaServed": {
      "@type": "Country",
      "name": "Canada"
    },
    "offers": {
      "@type": "Offer",
      "description": `Specialized business loans for ${business.name.toLowerCase()}`,
      "category": "Business Loan"
    },
    "url": `https://truenorthbusinessloan.ca${pageUrl}`,
    "mainEntityOfPage": `https://truenorthbusinessloan.ca${pageUrl}`
  };
};

export const generateFAQStructuredData = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{ name: string; url: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": breadcrumb.url
    }))
  };
};

export const generateIndustryKeywords = (industry: string): string[] => {
  const baseKeywords = ["business loans canada", "small business financing", "canadian business loans"];
  const industrySpecific = [
    `${industry.toLowerCase()} business loans`,
    `${industry.toLowerCase()} financing canada`,
    `${industry.toLowerCase()} equipment financing`,
    `${industry.toLowerCase()} working capital`,
    `canadian ${industry.toLowerCase()} loans`
  ];
  return [...baseKeywords, ...industrySpecific];
};