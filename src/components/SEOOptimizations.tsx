import SEOHead from "@/components/SEOHead";
import { generateBusinessStructuredData, generateFAQStructuredData, generateBreadcrumbStructuredData } from "@/utils/seo-utils";

// SEO Title/Description Variations for A/B Testing
export const seoVariations = {
  homepage: [
    {
      title: "Get Business Loans in 24hrs | True North Business Loan",
      description: "Need fast business funding? Get $5K-$800K approved in 24 hours. Compare top Canadian lenders instantly. Start your application now!",
      keywords: ["fast business loans", "24 hour approval", "canadian business funding", "quick business loans", "business loan approval"]
    },
    {
      title: "Business Loans $5K-$800K | Same Day Approval Canada",
      description: "Skip the bank wait! Get business loans with same-day approval from $5K to $800K. Bad credit OK. Equipment, working capital & more.",
      keywords: ["same day business loans", "bad credit business loans", "fast funding canada", "business financing", "equipment loans"]
    },
    {
      title: "Fast Business Funding | Get Approved Today Canada",
      description: "Stop waiting for bank approvals! Get business funding in 24hrs. $5K-$800K available. Apply in 60 seconds. Get your quote now!",
      keywords: ["fast business funding", "quick approval business loans", "business loans canada", "instant funding", "small business loans"]
    },
    {
      title: "Business Loans Made Simple | True North Canada",
      description: "From application to funding in 24 hours. Get $5K-$800K for your business. No waiting, no hassle. See your options instantly!",
      keywords: ["simple business loans", "easy business funding", "no hassle loans", "canadian business loans", "fast business capital"]
    }
  ],
  
  smallBusinessLoans: [
    {
      title: "Small Business Loans $10K-$800K | Fast Approval CA",
      description: "Get small business loans up to $800K with fast approval. Flexible terms, competitive rates. Equipment, expansion, working capital.",
      keywords: ["small business loans canada", "business term loans", "equipment financing", "working capital loans", "business expansion loans"]
    },
    {
      title: "Canadian Small Business Loans | Prime + 2% Rates",
      description: "Small business loans from $10K-$800K at Prime + 2%. 24-48hr approval. Flexible use: growth, inventory, equipment. Apply today!",
      keywords: ["canadian small business loans", "prime rate business loans", "competitive business loans", "flexible business funding", "growth loans"]
    },
    {
      title: "Business Term Loans | $10K-$800K | 1-7 Years",
      description: "Fixed-term business loans with predictable payments. $10K-$800K available. Use for expansion, equipment, working capital. Get approved fast!",
      keywords: ["business term loans", "fixed payment loans", "predictable business loans", "expansion loans", "business growth funding"]
    }
  ],

  invoiceFactoring: [
    {
      title: "Invoice Factoring | Get 80-95% Cash in 24hrs Canada",
      description: "Convert invoices to cash in 24hrs! Get 80-95% of invoice value immediately. No debt, flexible funding grows with your business.",
      keywords: ["invoice factoring canada", "accounts receivable factoring", "cash flow solutions", "B2B financing", "invoice financing"]
    },
    {
      title: "Cash Flow Solutions | Invoice Factoring Canada",
      description: "Solve cash flow problems instantly! Factor your invoices for immediate cash. 80-95% advance, no debt on balance sheet.",
      keywords: ["cash flow solutions", "invoice factoring services", "working capital factoring", "B2B cash flow", "accounts receivable financing"]
    },
    {
      title: "Invoice Financing | 24hr Cash Advance | No Debt",
      description: "Get paid immediately on your invoices! 80-95% advance in 24hrs. Perfect for B2B businesses with 30-90 day payment terms.",
      keywords: ["invoice financing", "immediate cash flow", "B2B financing solutions", "invoice cash advance", "receivables financing"]
    }
  ],

  merchantCashAdvance: [
    {
      title: "Merchant Cash Advance | $5K-$500K | No Fixed Payments",
      description: "Need working capital fast? Get $5K-$500K based on credit card sales. Flexible daily repayments. 24-48hr approval for restaurants & retail.",
      keywords: ["merchant cash advance", "restaurant funding", "retail financing", "credit card sales funding", "flexible business funding"]
    },
    {
      title: "Fast Business Cash | No Fixed Payments | MCA Canada",
      description: "Get instant working capital with merchant cash advance. Repay from daily sales, not fixed payments. Perfect for seasonal businesses.",
      keywords: ["fast business cash", "merchant cash advance canada", "seasonal business funding", "daily payment funding", "restaurant cash advance"]
    },
    {
      title: "Restaurant & Retail Funding | Merchant Cash Advance",
      description: "Funding based on your credit card sales! $5K-$500K for restaurants, retail, services. No fixed payments, flexible repayment.",
      keywords: ["restaurant funding", "retail business loans", "service business funding", "credit card receivables", "merchant funding"]
    }
  ],

  compare: [
    {
      title: "Banks vs Alternative Lenders | Business Loan Comparison",
      description: "Compare business loan options: Banks vs Alternative Lenders. See approval times, rates, and requirements side-by-side. Choose better!",
      keywords: ["business loan comparison", "banks vs alternative lenders", "loan approval comparison", "business financing options", "loan requirements"]
    },
    {
      title: "Why Choose Alternative Lenders Over Banks?",
      description: "Banks taking too long? See why businesses choose alternative lenders: 24-48hr approval, lower credit requirements, flexible terms.",
      keywords: ["alternative business lenders", "fast business loan approval", "flexible loan requirements", "bank alternatives", "quick business funding"]
    },
    {
      title: "Business Loan Options: Traditional vs Alternative",
      description: "Traditional banks vs modern lending. Compare approval times, credit requirements, and flexibility. Find your perfect funding match!",
      keywords: ["traditional vs alternative lending", "business loan alternatives", "modern business funding", "lending comparison", "funding options"]
    }
  ]
};

// Enhanced CTA Copy Variations
export const ctaVariations = {
  primary: [
    "Get Your Funding Quote Now",
    "Check My Loan Options Today", 
    "See My Approval Chances",
    "Start My Fast Application",
    "Get Approved in 24 Hours"
  ],
  secondary: [
    "Learn How It Works",
    "See Funding Options",
    "Compare Loan Types",
    "View Requirements",
    "Get Free Consultation"
  ],
  urgency: [
    "Apply Before Rates Increase",
    "Limited Time Offer - Apply Now",
    "Get Funded This Week",
    "Don't Wait - Apply Today",
    "Secure Your Rate Now"
  ]
};

// Enhanced Structured Data Generators
export const generateEnhancedStructuredData = {
  homepage: () => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://truenorthbusinessloan.ca/#organization",
        "name": "True North Business Loan",
        "url": "https://truenorthbusinessloan.ca",
        "logo": {
          "@type": "ImageObject",
          "url": "https://truenorthbusinessloan.ca/lovable-uploads/eae8a3b3-6d86-4fe4-9e17-17b808de0d2e.png",
          "width": 512,
          "height": 512
        },
        "description": "Canada's leading business loan marketplace connecting businesses with top lenders for fast, flexible financing from $5K to $800K.",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": ["CA", "US"]
        },
        "areaServed": ["Canada"],
        "serviceType": "Financial Services",
        "sameAs": []
      },
      {
        "@type": "WebSite",
        "@id": "https://truenorthbusinessloan.ca/#website",
        "url": "https://truenorthbusinessloan.ca",
        "name": "True North Business Loan",
        "description": "Fast business loans and financing solutions for Canadian businesses",
        "publisher": {
          "@id": "https://truenorthbusinessloan.ca/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://truenorthbusinessloan.ca/loan-estimator?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Service",
        "name": "Business Loan Marketplace",
        "provider": {
          "@id": "https://truenorthbusinessloan.ca/#organization"
        },
        "serviceType": "Business Financing",
        "description": "Connect with pre-screened lenders for business loans, equipment financing, working capital, and merchant cash advances.",
        "areaServed": ["Canada"],
        "offers": {
          "@type": "Offer",
          "description": "Business loans from $5,000 to $800,000",
          "priceRange": "$5,000 - $800,000",
          "availability": "InStock"
        }
      }
    ]
  }),

  loanProduct: (productType: string, amount: string, terms: string) => ({
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": `${productType} - True North Business Loan`,
    "description": `Get ${productType.toLowerCase()} from ${amount} with flexible terms up to ${terms}. Fast approval and competitive rates.`,
    "provider": {
      "@type": "Organization",
      "name": "True North Business Loan",
      "url": "https://truenorthbusinessloan.ca"
    },
    "offers": {
      "@type": "Offer",
      "priceRange": amount,
      "description": `${productType} with ${terms} repayment terms`
    },
    "feesAndCommissionsSpecification": {
      "@type": "RepaymentSpecification",
      "loanTerm": terms
    }
  })
};

// Value Proposition Enhancer
export const valuePropositions = {
  homepage: {
    headline: "Need business funding, like, yesterday?",
    subheadline: "Stop chasing paperwork and waiting weeks for an answer. Get the capital you need to cover payroll, buy inventory, or seize your next big opportunity. Apply in minutes, get a decision today.",
    benefits: [
      "24-48 hour approval decisions",
      "No collateral required for most loans", 
      "Bad credit options available",
      "Funds deposited same day"
    ]
  },
  
  smallBusinessLoans: {
    headline: "Fuel Your Business Growth with Flexible Financing",
    subheadline: "Get $10K to $800K for expansion, working capital, equipment, or any business need. Connect with Canada's top small business lenders with competitive rates starting at Prime + 2%.",
    benefits: [
      "Use funds for any business purpose",
      "Competitive rates from Prime + 2%",
      "Build business credit history",
      "Terms from 1-7 years available"
    ]
  }
};

export default SEOHead;