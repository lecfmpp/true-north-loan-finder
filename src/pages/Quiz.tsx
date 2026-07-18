import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  TrendingUp, 
  Shield,
  Building,
  DollarSign,
  Clock,
  Star,
  Users,
  Check,
  Truck,
  Package,
  Factory,
  ShoppingCart,
  Home,
  Target,
  Calendar,
  CreditCard,
  Loader2,
  ChevronDown,
  Key
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface QuizData {
  loanAmount: number[];
  useOfFunds: string;
  timeInBusiness: string;
  foundingMonth: string;
  foundingYear: string;
  monthlyRevenue: number[];
  creditScore: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  bankAccountType: string;
  homeownerStatus: string;
  website: string;
  country: string;
  stateProvince: string;
  leadSource: string;
}

// Phone number formatting function
const formatPhoneNumber = (value: string) => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Only allow 10 digits (US/Canada format)
  if (cleaned.length > 10) {
    return cleaned.slice(0, 10);
  }
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length >= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length >= 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }
  
  return cleaned;
};

// Website URL formatting function
const formatWebsiteUrl = (value: string) => {
  if (!value.trim()) return '';
  
  // Remove spaces and convert to lowercase
  let url = value.trim().toLowerCase();
  
  // If it doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove any trailing slashes
  url = url.replace(/\/+$/, '');
  
  return url;
};

// Website URL validation function
const isValidWebsiteUrl = (url: string) => {
  if (!url.trim()) return true; // Optional field
  
  try {
    // Use the formatted URL for validation
    const formattedUrl = url.startsWith('http') ? url : formatWebsiteUrl(url);
    const validUrl = new URL(formattedUrl);
    
    // Check if it has a valid domain structure
    return validUrl.hostname.includes('.') && validUrl.hostname.length > 3;
  } catch {
    return false;
  }
};

const Quiz = () => {
  const { toast } = useToast();
  
  // US States list for autocomplete
  const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
    "Wisconsin", "Wyoming"
  ];
  
  // Canadian Provinces list for autocomplete
  const canadianProvinces = [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
    "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
    "Quebec", "Saskatchewan", "Yukon"
  ];
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({
    loanAmount: [50000],
    useOfFunds: "",
    timeInBusiness: "",
    foundingMonth: "",
    foundingYear: "",
    monthlyRevenue: [25000],
    creditScore: "",
    name: "",
    email: "",
    phone: "",
    companyName: "",
    bankAccountType: "",
    homeownerStatus: "",
    website: "",
    country: "",
    stateProvince: "",
    leadSource: ""
  });
  const [stateOpen, setStateOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // External tracking system integration
  const EXTERNAL_TRACKER = {
    wizardId: 'e3f3c9bd-38c2-488c-9c3c-4740420f140d',
    apiBase: 'https://yzasxwyibutfqdweaxxo.supabase.co',
    
    async trackVisitor() {
      let sessionId = localStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = 'vs_' + Math.random().toString(36).substr(2, 9) + Date.now();
        localStorage.setItem('visitor_session_id', sessionId);
      }

      try {
        await fetch(`${this.apiBase}/functions/v1/track-visitor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wizard_id: this.wizardId,
            visitor_session_id: sessionId,
            source_url: window.location.href,
            user_agent: navigator.userAgent
          })
        });
        console.log('Visitor tracked successfully');
      } catch (error) {
        console.error('Failed to track visitor:', error);
      }
    },

    async submitLead(formData: QuizData, quizScore: number) {
      const sessionId = localStorage.getItem('visitor_session_id');
      const leadSource = localStorage.getItem('lead_attribution') || 'direct';
      
      try {
        const response = await fetch(`${this.apiBase}/functions/v1/submit-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wizard_id: this.wizardId,
            email: formData.email,
            visitor_session_id: sessionId,
            lead_data: {
              name: formData.name,
              phone: formData.phone,
              loan_amount: formData.loanAmount[0],
              use_of_funds: formData.useOfFunds,
              time_in_business: formData.timeInBusiness,
              monthly_revenue: formData.monthlyRevenue[0],
              credit_score: formData.creditScore,
              quiz_score: quizScore,
              source: 'business_loan_quiz',
              lead_source: leadSource,
              submitted_at: new Date().toISOString()
            }
          })
        });

        const result = await response.json();
        console.log('Lead submitted to external tracker:', result);
        return result;
      } catch (error) {
        console.error('Failed to submit lead to external tracker:', error);
        return { success: false, error: 'Network error' };
      }
    }
  };

  // Enhanced attribution tracking function with better Google Ads detection
  const getAttributionSource = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    
    // Priority order for attribution
    
    // 1. Google Ads (highest priority) - Multiple ways to detect
    if (urlParams.get('gclid') || urlParams.get('gbraid') || urlParams.get('wbraid')) {
      return 'google_ads';
    }
    
    // 2. Facebook/Meta Ads
    if (urlParams.get('fbclid')) {
      return 'facebook_ads';
    }
    
    // 3. Microsoft Ads
    if (urlParams.get('msclkid')) {
      return 'microsoft_ads';
    }
    
    // 4. LinkedIn Ads
    if (urlParams.get('li_fat_id')) {
      return 'linkedin_ads';
    }
    
    // 5. Twitter Ads
    if (urlParams.get('twclid')) {
      return 'twitter_ads';
    }
    
    // 6. UTM Source (with enhanced logic)
    if (urlParams.get('utm_source')) {
      const source = urlParams.get('utm_source')?.toLowerCase();
      const medium = urlParams.get('utm_medium')?.toLowerCase();
      const campaign = urlParams.get('utm_campaign')?.toLowerCase();
      
      // Detect paid vs organic based on medium
      if (medium) {
        const paidMediums = ['cpc', 'ppc', 'paid', 'adwords', 'ads', 'sem', 'paid_search', 'paidsearch'];
        if (paidMediums.includes(medium)) {
          if (source?.includes('google')) return 'google_ads';
          if (source?.includes('facebook') || source?.includes('fb') || source?.includes('meta')) return 'facebook_ads';
          if (source?.includes('linkedin')) return 'linkedin_ads';
          if (source?.includes('microsoft') || source?.includes('bing')) return 'microsoft_ads';
          if (source?.includes('twitter') || source?.includes('x')) return 'twitter_ads';
          return `${source}_ads`;
        }
        
        if (['email', 'newsletter'].includes(medium)) {
          return 'email_campaign';
        }
        
        if (['referral', 'affiliate'].includes(medium)) {
          return 'partner_referral';
        }
        
        if (['social'].includes(medium)) {
          if (source?.includes('facebook') || source?.includes('fb')) return 'facebook_organic';
          if (source?.includes('linkedin')) return 'linkedin_organic';
          if (source?.includes('twitter') || source?.includes('x')) return 'twitter_organic';
          if (source?.includes('youtube')) return 'youtube_organic';
          return `${source}_organic`;
        }
        
        // Create descriptive attribution with medium
        return `${source}_${medium}`;
      }
      
      // No medium provided: avoid ambiguous "google"
      if (source?.includes('google')) return 'google_organic';
      
      // Fallback to just source
      return source || 'unknown_utm';
    }
    
    // 7. Direct source parameter
    if (urlParams.get('source')) {
      return urlParams.get('source') || 'unknown_source';
    }
    
    // 8. Referrer parameter
    if (urlParams.get('ref') || urlParams.get('referrer')) {
      return urlParams.get('ref') || urlParams.get('referrer') || 'unknown_ref';
    }
    
    // 9. Document referrer analysis
    if (referrer) {
      try {
        const referrerDomain = new URL(referrer).hostname.toLowerCase();
        if (referrerDomain !== window.location.hostname) {
          // Enhanced referrer detection
          if (referrerDomain.includes('google.')) {
            // Check if it's likely from Google Ads vs organic
            const referrerUrl = new URL(referrer);
            if (referrerUrl.pathname.includes('/aclk') || referrerUrl.search.includes('gclid')) {
              return 'google_ads';
            }
            return 'google_organic';
          }
          
          if (referrerDomain.includes('facebook.') || referrerDomain.includes('fb.')) {
            return referrerDomain.includes('m.facebook') ? 'facebook_organic' : 'facebook_organic';
          }
          
          if (referrerDomain.includes('linkedin.')) return 'linkedin_organic';
          if (referrerDomain.includes('twitter.') || referrerDomain.includes('t.co')) return 'twitter_organic';
          if (referrerDomain.includes('youtube.')) return 'youtube_organic';
          if (referrerDomain.includes('bing.')) return 'bing_organic';
          if (referrerDomain.includes('yahoo.')) return 'yahoo_organic';
          if (referrerDomain.includes('duckduckgo.')) return 'duckduckgo_organic';
          
          // Return clean domain name for other referrers
          return referrerDomain.replace('www.', '').replace(/\./g, '_');
        }
      } catch (e) {
        console.warn('Could not parse referrer URL:', referrer);
      }
    }
    
    // 10. Check for internal navigation attribution stored in localStorage
    const storedAttribution = localStorage.getItem('lead_attribution');
    if (storedAttribution && storedAttribution !== 'direct') {
      return storedAttribution;
    }
    
    // 11. Default fallback
    return 'direct';
  };

  // Track visitor when component mounts and extract lead source from URL
  useEffect(() => {
    EXTERNAL_TRACKER.trackVisitor();
    
    // Get attribution source with enhanced tracking
    const attributionSource = getAttributionSource();
    
    // Store attribution in localStorage for persistence across pages
    localStorage.setItem('lead_attribution', attributionSource);
    
    setQuizData(prevData => ({
      ...prevData,
      leadSource: attributionSource
    }));
  }, []);

  const totalSteps = 8;
  const progress = (currentStep / totalSteps) * 100;

  const useOfFundsOptions = [
    { id: "equipment", label: "Equipment & Machinery", icon: Truck },
    { id: "inventory", label: "Inventory & Stock", icon: Package },
    { id: "expansion", label: "Business Expansion", icon: TrendingUp },
    { id: "working-capital", label: "Working Capital", icon: DollarSign },
    { id: "real-estate", label: "Real Estate", icon: Home },
    { id: "other", label: "Other", icon: Target }
  ];

  const timeInBusinessOptions = [
    { id: "startup", label: "Startup", description: "Less than 6 months", icon: Building },
    { id: "6-12", label: "6-12 months", description: "New business", icon: Calendar },
    { id: "1-2", label: "1-2 years", description: "Growing business", icon: TrendingUp },
    { id: "2-5", label: "2-5 years", description: "Established business", icon: Building },
    { id: "5+", label: "5+ years", description: "Mature business", icon: Shield }
  ];

  const creditScoreOptions = [
    { id: "excellent", label: "Excellent", description: "750+", icon: Star },
    { id: "good", label: "Good", description: "700-749", icon: CheckCircle },
    { id: "fair", label: "Fair", description: "650-699", icon: Clock },
    { id: "poor", label: "Poor", description: "Below 650", icon: CreditCard },
    { id: "unsure", label: "Not Sure", description: "I'll check later", icon: Target }
  ];

  // Helper function to convert credit score text to number
  const getCreditScoreValue = (creditScore: string) => {
    switch (creditScore) {
      case "excellent": return 775; // Average of 750+
      case "good": return 725; // Average of 700-749
      case "fair": return 675; // Average of 650-699
      case "poor": return 625; // Average of below 650
      case "unsure": return 650; // Conservative estimate
      default: return 650;
    }
  };

  const calculateScore = () => {
    let score = 0; // Start from 0 for cleaner calculation
    
    // 1. REVENUE ABOVE 10K/MONTH (40 points max - most important)
    const monthlyRevenue = quizData.monthlyRevenue[0];
    if (monthlyRevenue >= 100000) {
      score += 40; // $100k+ = excellent
    } else if (monthlyRevenue >= 50000) {
      score += 35; // $50k-99k = very good
    } else if (monthlyRevenue >= 25000) {
      score += 30; // $25k-49k = good
    } else if (monthlyRevenue >= 10000) {
      score += 25; // $10k-24k = minimum threshold met
    } else {
      score += 0; // Below $10k = no points
    }
    
    // 2. BUSINESS AGE ABOVE 6 MONTHS (35 points max - second most important)
    if (quizData.foundingMonth && quizData.foundingYear) {
      const currentDate = new Date();
      const foundingDate = new Date(parseInt(quizData.foundingYear), parseInt(quizData.foundingMonth) - 1);
      const ageInMonths = (currentDate.getFullYear() - foundingDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - foundingDate.getMonth());
      
      if (ageInMonths >= 60) {
        score += 35; // 5+ years = excellent stability
      } else if (ageInMonths >= 36) {
        score += 30; // 3-5 years = very stable
      } else if (ageInMonths >= 24) {
        score += 25; // 2-3 years = stable
      } else if (ageInMonths >= 12) {
        score += 20; // 1-2 years = established
      } else if (ageInMonths >= 6) {
        score += 15; // 6-12 months = minimum threshold met
      } else {
        score += 0; // Under 6 months = no points
      }
    }
    
    // 3. CREDIT SCORE ABOVE 600 (25 points max - third most important)
    const creditScoreValue = getCreditScoreValue(quizData.creditScore);
    if (creditScoreValue >= 750) {
      score += 25; // Excellent credit
    } else if (creditScoreValue >= 700) {
      score += 20; // Good credit
    } else if (creditScoreValue >= 650) {
      score += 15; // Fair credit
    } else if (creditScoreValue >= 600) {
      score += 10; // Minimum threshold met
    } else {
      score += 0; // Below 600 = no points
    }
    
    return Math.min(score, 100);
  };

  const getScoreMessage = (score: number) => {
    if (score >= 85) return {
      title: "Exceptional Candidate!",
      message: "Your business profile exceeds all key criteria. You qualify for the best rates and highest approval odds with premium lenders.",
      color: "text-secondary"
    };
    if (score >= 65) return {
      title: "Strong Candidate!",
      message: "Your business meets most key qualification criteria. You have excellent chances with our top-tier lending partners.",
      color: "text-secondary"
    };
    if (score >= 45) return {
      title: "Good Candidate!",
      message: "Your business meets some important criteria. Several of our specialized lenders can work with your profile.",
      color: "text-accent"
    };
    return {
      title: "Potential Candidate",
      message: "While your business may not meet all standard criteria, we have alternative lenders who specialize in unique situations.",
      color: "text-primary"
    };
  };

  const calculateLenderMatch = (lender: any) => {
    const loanAmount = quizData.loanAmount[0];
    const monthlyRevenue = quizData.monthlyRevenue[0];
    const timeInBusiness = quizData.timeInBusiness;
    const creditScore = quizData.creditScore;

    // Base compatibility score out of 10
    let matchScore = 0;

    switch (lender.name) {
      case "IOU Financial":
        // Prefers established businesses, larger amounts
        if (timeInBusiness === "5+" || timeInBusiness === "2-5") matchScore += 3;
        if (loanAmount >= 50000) matchScore += 3;
        if (monthlyRevenue >= 25000) matchScore += 2;
        if (creditScore === "excellent" || creditScore === "good") matchScore += 2;
        break;
      
      case "Driven (formerly Thinking Capital)":
        // Good for quick digital applications, moderate amounts
        if (creditScore === "excellent" || creditScore === "good") matchScore += 4;
        if (loanAmount <= 300000) matchScore += 2;
        if (timeInBusiness !== "0-6") matchScore += 3;
        if (monthlyRevenue >= 15000) matchScore += 1;
        break;
      
      case "Greenbox Capital":
        // Flexible with credit, focuses on revenue
        if (monthlyRevenue >= 10000) matchScore += 4;
        if (creditScore === "fair" || creditScore === "poor") matchScore += 2;
        if (loanAmount <= 500000) matchScore += 2;
        if (timeInBusiness !== "0-6") matchScore += 2;
        break;
      
      case "Merchant Growth":
        // Good all-around option
        matchScore += 2; // Base score for being versatile
        if (monthlyRevenue >= 15000) matchScore += 3;
        if (creditScore === "excellent" || creditScore === "good") matchScore += 2;
        if (loanAmount <= 2000000) matchScore += 2;
        if (timeInBusiness !== "0-6") matchScore += 1;
        break;
      
      case "2M7":
        // Alternative option for declined businesses
        if (creditScore === "fair" || creditScore === "poor") matchScore += 3;
        if (loanAmount <= 250000) matchScore += 3;
        if (monthlyRevenue >= 5000) matchScore += 2;
        if (timeInBusiness !== "0-6") matchScore += 2;
        break;
      
      case "NorthPoint Funding":
        // MCA specialist
        if (monthlyRevenue >= 20000) matchScore += 4;
        if (loanAmount <= 100000) matchScore += 3;
        if (creditScore === "fair" || creditScore === "good") matchScore += 2;
        if (timeInBusiness !== "0-6") matchScore += 1;
        break;
    }

    // Convert to percentage (max 10 points = 100%)
    const percentage = Math.min(Math.max((matchScore / 10) * 100, 15), 98); // Min 15%, Max 98%
    
    return Math.round(percentage);
  };

  const renderMatchScore = (percentage: number, lenderName: string) => {
    const getMatchLevel = (score: number) => {
      if (score >= 85) return { label: "Excellent Match", color: "text-green-600", bgColor: "bg-green-100" };
      if (score >= 70) return { label: "Great Match", color: "text-blue-600", bgColor: "bg-blue-100" };
      if (score >= 55) return { label: "Good Match", color: "text-yellow-600", bgColor: "bg-yellow-100" };
      return { label: "Fair Match", color: "text-gray-600", bgColor: "bg-gray-100" };
    };

    const matchLevel = getMatchLevel(percentage);

    return (
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${matchLevel.bgColor} ${matchLevel.color}`}>
          {percentage}% Match
        </div>
        <span className="text-xs text-muted-foreground">
          {matchLevel.label}
        </span>
      </div>
    );
  };

  const getLenderData = () => {
    const lenders = [
      {
        name: "IOU Financial",
        description: "Best for established businesses seeking significant term loans up to $1.5M",
        details: "Specializes in straightforward term loans for established businesses. Partner-driven model with funding often within 24 hours.",
        badge: "Large Amounts",
        badgeVariant: "secondary" as const,
        borderColor: "border-l-secondary",
        bgGradient: "from-secondary/5 to-transparent",
        stats: [
          { label: "Funding Range", value: "$15K - $1.5M" },
          { label: "Terms", value: "6-36 months" },
          { label: "Funding Speed", value: "24 hours" },
          { label: "Min. Time", value: "1+ years" }
        ]
      },
      {
        name: "Driven (formerly Thinking Capital)",
        description: "Perfect for fast, digital applications and businesses operating for at least 6 months",
        details: "Major Canadian FinTech with entirely digital application process and flexible repayment terms. Quick decisions for qualifying businesses.",
        badge: "Fast Digital",
        badgeVariant: "outline" as const,
        borderColor: "border-l-primary",
        bgGradient: "from-primary/5 to-transparent",
        stats: [
          { label: "Funding Range", value: "Up to $300K" },
          { label: "Terms", value: "3-24 months" },
          { label: "Min. Credit", value: "600+ FICO" },
          { label: "Min. Time", value: "6+ months" }
        ]
      },
      {
        name: "Greenbox Capital",
        description: "Excellent option for businesses with lower credit scores but strong monthly sales",
        details: "Focuses on business potential over credit scores. Funds high-risk industries within one business day.",
        badge: "Flexible",
        badgeVariant: "default" as const,
        borderColor: "border-l-accent",
        bgGradient: "from-accent/10 to-transparent",
        stats: [
          { label: "Funding Range", value: "$3K - $500K" },
          { label: "Funding Speed", value: "1 day" },
          { label: "Min. Time", value: "5+ months" },
          { label: "Min. Revenue", value: "$10K/mo" }
        ]
      },
      {
        name: "Merchant Growth",
        description: "A great all-around option with specialized financing for E-commerce businesses",
        details: "Provides flexible working capital solutions with transparent pricing and dedicated account management.",
        badge: "E-commerce",
        badgeVariant: "secondary" as const,
        borderColor: "border-l-secondary",
        bgGradient: "from-secondary/5 to-transparent",
        stats: [
          { label: "Funding Range", value: "$10K - $2M" },
          { label: "Approval Rate", value: "High" },
          { label: "Min. Time", value: "3+ months" },
          { label: "Min. Revenue", value: "$15K/mo" }
        ]
      },
      {
        name: "2M7",
        description: "Alternative financing partner that considers businesses banks often decline",
        details: "Focused on revenue-based qualification rather than traditional credit metrics.",
        badge: "Alternative",
        badgeVariant: "outline" as const,
        borderColor: "border-l-primary",
        bgGradient: "from-primary/5 to-transparent",
        stats: [
          { label: "Funding Range", value: "$5K - $250K" },
          { label: "Approval", value: "Revenue-Based" },
          { label: "Min. Time", value: "3+ months" },
          { label: "Processing", value: "Fast" }
        ]
      },
      {
        name: "NorthPoint Funding",
        description: "Merchant Cash Advance specialist for businesses with consistent credit card sales",
        details: "Specializes in merchant cash advances for businesses with strong daily credit card transactions.",
        badge: "MCA Specialist",
        badgeVariant: "default" as const,
        borderColor: "border-l-accent",
        bgGradient: "from-accent/10 to-transparent",
        stats: [
          { label: "Advance Range", value: "$2.5K - $100K" },
          { label: "Factor Rate", value: "1.1 - 1.5x" },
          { label: "Min. Sales", value: "$20K/mo" },
          { label: "Funding Speed", value: "1-2 days" }
        ]
      }
    ];

    // Calculate match percentages and sort by match score
    const lendersWithMatches = lenders.map(lender => ({
      ...lender,
      matchPercentage: calculateLenderMatch(lender)
    })).sort((a, b) => b.matchPercentage - a.matchPercentage);

    return lendersWithMatches;
  };

  const handleOptionSelect = async (field: string, value: string) => {
    const newQuizData = { ...quizData, [field]: value };
    setQuizData(newQuizData);
    
    // Auto-advance to next step with a slight delay for visual feedback
    setTimeout(() => {
      if (currentStep === totalSteps) {
        // Save quiz response to database
        saveQuizResponse(newQuizData);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }, 600);
  };

  // Email utilities
  const sanitizeEmail = (value?: string) => (value || '').trim().replace(/[\s,;]+$/, '').toLowerCase();
  const isValidEmail = (email: string) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);

  const saveQuizResponse = async (data: QuizData) => {
    setIsSubmitting(true);
    
    // Show toast immediately when submission starts
    toast({
      title: "Sending your information...",
      description: "We're sending your details to our specialists to get you the best offers possible!",
      duration: 4000,
    });

    try {
      const score = calculateScore();
      
      
      // Convert founding date to time in business format
      let timeInBusiness = '';
      if (data.foundingMonth && data.foundingYear) {
        const currentDate = new Date();
        const foundingDate = new Date(parseInt(data.foundingYear), parseInt(data.foundingMonth) - 1);
        const ageInMonths = (currentDate.getFullYear() - foundingDate.getFullYear()) * 12 + 
                           (currentDate.getMonth() - foundingDate.getMonth());
        
        if (ageInMonths >= 60) timeInBusiness = '5+';
        else if (ageInMonths >= 24) timeInBusiness = '2-5';
        else if (ageInMonths >= 12) timeInBusiness = '1-2';
        else if (ageInMonths >= 6) timeInBusiness = '6-12';
        else timeInBusiness = 'startup';
      }

      // Get the most recent attribution source (could have changed during session)
      const finalAttribution = localStorage.getItem('lead_attribution') || data.leadSource || 'direct';

      // Compute a full source URL for auditing
      const urlParams = new URLSearchParams(window.location.search);
      const referrerFull = document.referrer || '';
      let sourceUrl: string | null = null;
      try {
        sourceUrl = referrerFull ? new URL(referrerFull).toString() : null;
      } catch (e) {
        sourceUrl = referrerFull || null;
      }
      if (!sourceUrl) {
        const hasSourceParams = ['utm_source','gclid','gbraid','wbraid','fbclid','msclkid','li_fat_id','twclid','ref','referrer','source']
          .some((p) => urlParams.get(p));
        if (hasSourceParams) sourceUrl = window.location.href;
      }
      
      // Validate and sanitize phone before submission
      const sanitizedPhone = (data.phone || '').replace(/[^\d]/g, '');
      if (sanitizedPhone.length < 10 || sanitizedPhone.length > 15) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid phone (10-15 digits).",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      // Validate and sanitize email before submission
      const sanitizedEmail = sanitizeEmail(data.email || '');
      if (!isValidEmail(sanitizedEmail)) {
        toast({
          title: "Invalid email address",
          description: "Please enter a valid email (e.g., name@domain.com).",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Save to local Supabase database
      const payload = {
        loan_amount: data.loanAmount[0],
        use_of_funds: data.useOfFunds,
        time_in_business: timeInBusiness,
        monthly_revenue: data.monthlyRevenue[0],
        credit_score: data.creditScore,
        name: data.name,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        company_name: data.companyName,
        website: data.website,
        country: data.country,
        city_province: data.stateProvince,
        score: score,
        status: 'New',
        attribution_channel: finalAttribution,
        attribution_url: sourceUrl,
        bank_account_type: data.bankAccountType,
        homeowner_status: data.homeownerStatus
      };

      const { data: savedResponseId, error } = await (supabase as any).rpc('submit_quiz_response', { p: payload });

      if (error) throw error;

      // Send email verification
      try {
        await supabase.functions.invoke('send-email-verification', {
          body: {
            leadId: savedResponseId,
            email: data.email,
            name: data.name
          }
        });
        console.log('Email verification sent successfully');
      } catch (verificationError) {
        console.error('Failed to send email verification:', verificationError);
        // Don't throw error - continue with flow even if email fails
      }

      // Submit to external tracking system
      await EXTERNAL_TRACKER.submitLead(data, score);

      // Send admin notification
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'quiz',
            data: {
              name: data.name,
              email: sanitizedEmail,
              phone: sanitizedPhone,
              loan_amount: data.loanAmount[0],
              monthly_revenue: data.monthlyRevenue[0],
              credit_score: data.creditScore,
              use_of_funds: data.useOfFunds,
              time_in_business: timeInBusiness,
              score: score
            },
            submissionId: savedResponseId
          }
        });
      } catch (adminNotificationError) {
        console.error('Failed to send admin notification:', adminNotificationError);
        // Don't fail the whole submission if admin notification fails
      }

      // Email sequence is disabled by default for all quiz submissions
      // This can be enabled later manually by admins if needed
      console.log('Email sequence disabled by default for quiz submissions');

      // Check if this is a Canadian lead with monthly revenue $10k-$19,999 and minimum 6 months in business
      const isCanadian = data.country === 'CA';
      const monthlyRevenue = data.monthlyRevenue[0];
      const hasMinimumBusinessAge = timeInBusiness !== 'startup'; // Exclude businesses under 6 months
      const shouldRedirectToMerchantGrowth = isCanadian && 
        monthlyRevenue >= 10000 && 
        monthlyRevenue <= 19999 && 
        hasMinimumBusinessAge;

      if (shouldRedirectToMerchantGrowth) {
        console.log('Redirecting Canadian lead with $10k-$19,999 monthly revenue and 6+ months in business to Merchant Growth');
        
        // Redirect to Merchant Growth redirect page with necessary parameters
        const merchantGrowthParams = new URLSearchParams({
          amount: data.loanAmount[0].toString(),
          name: data.name,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          score: score.toString(),
          responseId: String(savedResponseId),
          revenue: data.monthlyRevenue[0].toString(),
          company: data.companyName || '',
          country: data.country || '',
          submitted: 'true'
        });

        // Persist response id for tracking
        try { localStorage.setItem('quiz_response_id', String(savedResponseId)); } catch {}

        const merchantGrowthUrl = `/merchant-growth-redirect?${merchantGrowthParams.toString()}`;
        window.location.href = merchantGrowthUrl;
        return;
      }

      // Default flow: Redirect to Results page for non-qualifying leads
      const queryParams = new URLSearchParams({
        amount: data.loanAmount[0].toString(),
        name: data.name,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        score: score.toString(),
        responseId: String(savedResponseId),
        revenue: data.monthlyRevenue[0].toString(),
        company: data.companyName || '',
        country: data.country || '',
        submitted: 'true'
      });

      // Persist response id for downstream prefill if needed
      try { localStorage.setItem('quiz_response_id', String(savedResponseId)); } catch {}

      const resultsUrl = `/results/${savedResponseId}?${queryParams.toString()}`;
      window.location.href = resultsUrl;

    } catch (error) {
      console.error('Error saving quiz response:', error);
      const errMsg = (error as any)?.message?.toString()?.toLowerCase() || '';
      if (errMsg.includes('invalid phone')) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid phone (10-15 digits).",
          variant: "destructive",
        });
      } else if (errMsg.includes('invalid email')) {
        toast({
          title: "Invalid email address",
          description: "Please enter a valid email (e.g., name@domain.com).",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission Error",
          description: "There was an issue submitting your information. Please try again.",
          variant: "destructive",
        });
      }
      setShowResults(true); // Fallback to showing results inline if redirect fails
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      await saveQuizResponse(quizData);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return quizData.loanAmount[0] > 0;
      case 2: return quizData.useOfFunds !== "";
      case 3: return quizData.foundingMonth !== "" && quizData.foundingYear !== "";
      case 4: return quizData.monthlyRevenue[0] > 0;
      case 5: return quizData.creditScore !== "";
      case 6: return quizData.bankAccountType !== "";
      case 7: return quizData.homeownerStatus !== "";
      case 8: {
        const emailOk = isValidEmail(sanitizeEmail(quizData.email || ""));
        const phoneDigits = (quizData.phone || "").replace(/[^\d]/g, "");
        return Boolean(
          quizData.name &&
          emailOk &&
          phoneDigits.length >= 10 &&
          quizData.companyName &&
          quizData.country &&
          quizData.stateProvince
        );
      }
      default: return true;
    }
  };

  if (showResults) {
    const score = calculateScore();
    const scoreInfo = getScoreMessage(score);
    
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-[var(--shadow-card)]">
              {/* The "Hook" Section */}
              <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg">
                <CardTitle className="text-3xl font-bold font-sans text-primary mb-2">
                  Excellent! Your profile is a strong match. Here's what you're pre-qualified for.
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-8 space-y-10">
                {/* Main Results Dashboard */}
                <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl p-8 border border-secondary/20">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* The Big Number */}
                    <div className="text-center md:text-left">
                      <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                        ${quizData.loanAmount[0].toLocaleString()}
                      </div>
                      <p className="text-lg text-muted-foreground font-medium">
                        Estimated Eligible Funding
                      </p>
                    </div>

                    {/* The Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/60 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">24-48h</div>
                        <div className="text-sm text-muted-foreground">Funding Speed</div>
                      </div>
                      <div className="bg-background/60 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {quizData.creditScore === "excellent" ? "8-12%" :
                           quizData.creditScore === "good" ? "12-18%" :
                           quizData.creditScore === "fair" ? "18-25%" : "25-35%"}
                        </div>
                        <div className="text-sm text-muted-foreground">Est. Rate</div>
                      </div>
                      <div className="bg-background/60 rounded-lg p-4 text-center col-span-2">
                        <div className="text-2xl font-bold text-primary">
                          ${Math.round((quizData.loanAmount[0] * 0.15) / 12).toLocaleString()}/mo
                        </div>
                        <div className="text-sm text-muted-foreground">Est. Payment</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* The "Curated Lender Matches" Section */}
                <div>
                  <h3 className="text-2xl font-bold font-sans text-primary mb-6 text-center">
                    Based on your profile, here are your Top 3 matches from our network:
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {getLenderData().slice(0, 3).map((lender, index) => (
                      <Card 
                        key={lender.name}
                        className="border-2 border-primary/20 hover:border-primary/40 transition-colors bg-gradient-to-br from-background to-primary/5"
                      >
                        <CardContent className="p-6 text-center">
                          {/* Lender Logo placeholder */}
                          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-primary font-bold text-lg">
                              {lender.name.substring(0, 2)}
                            </span>
                          </div>
                          
                          {/* Lender Name */}
                          <h4 className="font-bold text-primary text-xl mb-2">{lender.name}</h4>
                          
                          {/* Match Rating */}
                          <div className="mb-3">
                            {index === 0 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-sm">
                                Top Match (5/5)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm">
                                Great Match ({5 - index}/5)
                              </span>
                            )}
                          </div>
                          
                          {/* "Best for..." tagline */}
                          <p className="text-muted-foreground text-sm font-medium">
                            {index === 0 ? "Best for fast, digital applications for businesses over 6 months old." :
                             index === 1 ? "Best for alternative financing when banks say no." :
                             "Best for businesses with strong daily credit card sales."}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* The "Call-to-Action" Section */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 text-center border-2 border-yellow-200 shadow-lg">
                  <h3 className="text-3xl font-bold text-primary mb-4">
                    Unlock Your Official Offers in Under 48 Hours
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-3xl mx-auto text-lg leading-relaxed">
                    Your application is ready. The final step is a quick 15-minute 'Pre-Offer Call' with a funding advisor. 
                    This call is required to get your official offers from the lenders above.
                  </p>
                  
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-primary mb-4">On this call, we will:</h4>
                    <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                      <div className="flex items-start gap-3 text-left">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-primary">Verify Your Details</p>
                          <p className="text-sm text-muted-foreground">A quick confirmation to ensure accuracy.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-left">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-primary">Finalize Your Funding Needs</p>
                          <p className="text-sm text-muted-foreground">We'll confirm the numbers for your official offers.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-left">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-primary">Outline Required Documents</p>
                          <p className="text-sm text-muted-foreground">We'll tell you exactly which simple documents to have ready (if any).</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Primary CTA Button */}
                  <div className="mb-4">
                    <Button 
                      size="lg" 
                      className="bg-yellow-500 hover:bg-yellow-600 text-white md:text-xl text-lg md:py-6 py-4 md:px-12 px-8 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                    >
                      Book My 15-Min Pre-Offer Call
                    </Button>
                  </div>
                  
                  {/* Reassuring Sub-text */}
                  <p className="text-sm text-muted-foreground mb-4">
                    Yes, this call is required to receive your official lender offers.
                  </p>
                  
                  {/* Secondary CTA Link */}
                  <button className="text-primary hover:text-primary/80 underline text-sm font-medium">
                    Have a question before booking? Chat with us now.
                  </button>
                </div>

                <div className="text-center text-sm text-muted-foreground border-t pt-6">
                  <p>
                    By clicking "Send my details", you're asking us to share your information with the lenders above.
                    <br />
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> | 
                    <Link to="/terms" className="text-primary hover:underline ml-1">Terms of Service</Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Condensed for desktop */}
      <section className="py-4 md:py-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-sans text-primary leading-tight mb-2 md:mb-3">
              Find Out Exactly How Much You Can Borrow 
              <span className="text-secondary"> & Get It In Your Account Within 48 Hours</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-3 md:mb-4 max-w-2xl mx-auto font-serif">
              No guesswork. No surprises. Just the best options.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-2 md:py-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header - Condensed layout */}
          <div className="mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h1 className="text-xl md:text-2xl font-bold font-sans text-primary">
                Business Loan Estimator
              </h1>
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <Progress value={progress} className="mb-1" />
            <p className="text-xs md:text-sm text-muted-foreground text-center">
              Takes about 60 seconds to complete
            </p>
          </div>

          <Card className="border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-4 sm:p-6 md:p-8">
              {/* Step 1: Loan Amount */}
              {currentStep === 1 && (
                <div className="space-y-6 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        How much funding are you looking for?
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      Select the amount that best fits your business needs
                    </p>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    <Slider
                      value={quizData.loanAmount}
                      onValueChange={(value) => setQuizData({...quizData, loanAmount: value})}
                      max={800000}
                      min={5000}
                      step={5000}
                      className="w-full"
                    />
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">
                        ${quizData.loanAmount[0].toLocaleString()}
                      </div>
                      <div className="text-sm sm:text-base md:text-lg text-muted-foreground">
                        Range: $5,000 - $800,000
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Use of Funds */}
              {currentStep === 2 && (
                <div className="space-y-5 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Building className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        What's the primary purpose of the funds?
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      This helps us match you with the right type of lenders
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {useOfFundsOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = quizData.useOfFunds === option.id;
                      
                      return (
                        <Card
                          key={option.id}
                          className={cn(
                            "cursor-pointer transition-all duration-300 group hover:shadow-lg border-2",
                            isSelected 
                              ? "border-secondary bg-secondary/10 shadow-md" 
                              : "border-border hover:border-secondary/50 hover:bg-secondary/5"
                          )}
                          onClick={() => handleOptionSelect('useOfFunds', option.id)}
                        >
                          <CardContent className="p-4 sm:p-5 md:p-6 text-center relative min-h-[48px] flex items-center justify-center">
                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <Check className="h-5 w-5 md:h-6 md:w-6 text-secondary animate-scale-in" />
                              </div>
                            )}
                            <div className="flex items-center gap-3 w-full">
                              <IconComponent className="h-8 w-8 md:h-10 md:w-10 text-secondary group-hover:scale-110 transition-transform flex-shrink-0" />
                              <h3 className="text-base md:text-lg font-semibold text-primary text-left">{option.label}</h3>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Company Founding Date */}
              {currentStep === 3 && (
                <div className="space-y-5 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        When was your company founded?
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      Help us understand your business maturity (month and year is sufficient)
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="founding-month" className="text-sm font-medium text-primary">
                        Founding Month
                      </Label>
                      <Select 
                        value={quizData.foundingMonth} 
                        onValueChange={(value) => setQuizData({...quizData, foundingMonth: value})}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">January</SelectItem>
                          <SelectItem value="2">February</SelectItem>
                          <SelectItem value="3">March</SelectItem>
                          <SelectItem value="4">April</SelectItem>
                          <SelectItem value="5">May</SelectItem>
                          <SelectItem value="6">June</SelectItem>
                          <SelectItem value="7">July</SelectItem>
                          <SelectItem value="8">August</SelectItem>
                          <SelectItem value="9">September</SelectItem>
                          <SelectItem value="10">October</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="founding-year" className="text-sm font-medium text-primary">
                        Founding Year
                      </Label>
                      <Select 
                        value={quizData.foundingYear} 
                        onValueChange={(value) => setQuizData({...quizData, foundingYear: value})}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 30 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {quizData.foundingMonth && quizData.foundingYear && (
                    <div className="bg-secondary/10 rounded-lg p-4 text-center">
                      <div className="text-lg font-semibold text-primary">
                        Company Age: {(() => {
                          const currentDate = new Date();
                          const foundingDate = new Date(parseInt(quizData.foundingYear), parseInt(quizData.foundingMonth) - 1);
                          const ageInMonths = (currentDate.getFullYear() - foundingDate.getFullYear()) * 12 + 
                                           (currentDate.getMonth() - foundingDate.getMonth());
                          const years = Math.floor(ageInMonths / 12);
                          const months = ageInMonths % 12;
                          
                          if (years > 0) {
                            return months > 0 ? `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}` : `${years} year${years > 1 ? 's' : ''}`;
                          } else {
                            return `${months} month${months > 1 ? 's' : ''}`;
                          }
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {(() => {
                          const currentDate = new Date();
                          const foundingDate = new Date(parseInt(quizData.foundingYear), parseInt(quizData.foundingMonth) - 1);
                          const ageInMonths = (currentDate.getFullYear() - foundingDate.getFullYear()) * 12 + 
                                           (currentDate.getMonth() - foundingDate.getMonth());
                          
                          if (ageInMonths >= 60) return "Mature business - excellent qualification";
                          else if (ageInMonths >= 24) return "Established business - strong qualification";
                          else if (ageInMonths >= 12) return "Growing business - good qualification";
                          else if (ageInMonths >= 6) return "New business - moderate qualification";
                          else return "Startup business - alternative financing options";
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Monthly Revenue */}
              {currentStep === 4 && (
                <div className="space-y-6 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        What is your average monthly revenue?
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      This helps determine your loan capacity and terms
                    </p>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    <Slider
                      value={quizData.monthlyRevenue}
                      onValueChange={(value) => setQuizData({...quizData, monthlyRevenue: value})}
                      max={200000}
                      min={1000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">
                        ${quizData.monthlyRevenue[0].toLocaleString()}/month
                      </div>
                      <div className="text-sm sm:text-base md:text-lg text-muted-foreground">
                        Range: $1,000 - $200,000+ per month
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Credit Score */}
              {currentStep === 5 && (
                <div className="space-y-5 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Star className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        What's your estimated personal credit score?
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      Don't worry - we work with businesses across all credit ranges
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {creditScoreOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = quizData.creditScore === option.id;
                      
                      return (
                        <Card
                          key={option.id}
                          className={cn(
                            "cursor-pointer transition-all duration-300 group hover:shadow-lg border-2",
                            isSelected 
                              ? "border-secondary bg-secondary/10 shadow-md" 
                              : "border-border hover:border-secondary/50 hover:bg-secondary/5"
                          )}
                          onClick={() => handleOptionSelect('creditScore', option.id)}
                        >
                          <CardContent className="p-3 sm:p-4 md:p-6 flex items-center gap-3 md:gap-4 relative min-h-[48px]">
                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <Check className="h-5 w-5 md:h-6 md:w-6 text-secondary animate-scale-in" />
                              </div>
                            )}
                            <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-secondary group-hover:scale-110 transition-transform flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="text-base md:text-lg font-semibold text-primary">{option.label}</h3>
                              <p className="text-xs md:text-sm text-muted-foreground">{option.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 6: Bank Account Type */}
              {currentStep === 6 && (
                <div className="space-y-5 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Building className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        What type of bank account do you use for your business?
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      This helps us understand your banking setup for funding options
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 md:gap-3 max-w-lg mx-auto">
                    <Card
                      className={cn(
                        "cursor-pointer transition-all duration-300 group hover:shadow-lg border-2",
                        quizData.bankAccountType === "business"
                          ? "border-secondary bg-secondary/10 shadow-md" 
                          : "border-border hover:border-secondary/50 hover:bg-secondary/5"
                      )}
                      onClick={() => handleOptionSelect('bankAccountType', 'business')}
                    >
                      <CardContent className="p-3 sm:p-4 md:p-6 flex items-center gap-3 md:gap-4 relative min-h-[48px]">
                        {quizData.bankAccountType === "business" && (
                          <div className="absolute top-3 right-3">
                            <Check className="h-5 w-5 md:h-6 md:w-6 text-secondary animate-scale-in" />
                          </div>
                        )}
                        <Building className="h-6 w-6 md:h-8 md:w-8 text-secondary group-hover:scale-110 transition-transform flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-base md:text-lg font-semibold text-primary">Business Bank Account</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">Separate account for business transactions</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        "cursor-pointer transition-all duration-300 group hover:shadow-lg border-2",
                        quizData.bankAccountType === "personal"
                          ? "border-secondary bg-secondary/10 shadow-md" 
                          : "border-border hover:border-secondary/50 hover:bg-secondary/5"
                      )}
                      onClick={() => handleOptionSelect('bankAccountType', 'personal')}
                    >
                      <CardContent className="p-3 sm:p-4 md:p-6 flex items-center gap-3 md:gap-4 relative min-h-[48px]">
                        {quizData.bankAccountType === "personal" && (
                          <div className="absolute top-3 right-3">
                            <Check className="h-5 w-5 md:h-6 md:w-6 text-secondary animate-scale-in" />
                          </div>
                        )}
                        <Users className="h-6 w-6 md:h-8 md:w-8 text-secondary group-hover:scale-110 transition-transform flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-base md:text-lg font-semibold text-primary">Personal Bank Account</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">Using personal account for business needs</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 7: Homeowner Status */}
              {currentStep === 7 && (
                <div className="space-y-5 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Home className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        Do you own your home or rent?
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      This helps us understand your financial stability for better loan options
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 md:gap-3 max-w-lg mx-auto">
                    <Card
                      className={cn(
                        "cursor-pointer transition-all duration-300 group hover:shadow-lg border-2",
                        quizData.homeownerStatus === "homeowner"
                          ? "border-secondary bg-secondary/10 shadow-md" 
                          : "border-border hover:border-secondary/50 hover:bg-secondary/5"
                      )}
                      onClick={() => handleOptionSelect('homeownerStatus', 'homeowner')}
                    >
                      <CardContent className="p-3 sm:p-4 md:p-6 flex items-center gap-3 md:gap-4 relative min-h-[48px]">
                        {quizData.homeownerStatus === "homeowner" && (
                          <div className="absolute top-3 right-3">
                            <Check className="h-5 w-5 md:h-6 md:w-6 text-secondary animate-scale-in" />
                          </div>
                        )}
                        <Home className="h-6 w-6 md:h-8 md:w-8 text-secondary group-hover:scale-110 transition-transform flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-base md:text-lg font-semibold text-primary">I own my home</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">You have property ownership</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        "cursor-pointer transition-all duration-300 group hover:shadow-lg border-2",
                        quizData.homeownerStatus === "renter"
                          ? "border-secondary bg-secondary/10 shadow-md" 
                          : "border-border hover:border-secondary/50 hover:bg-secondary/5"
                      )}
                      onClick={() => handleOptionSelect('homeownerStatus', 'renter')}
                    >
                      <CardContent className="p-3 sm:p-4 md:p-6 flex items-center gap-3 md:gap-4 relative min-h-[48px]">
                        {quizData.homeownerStatus === "renter" && (
                          <div className="absolute top-3 right-3">
                            <Check className="h-5 w-5 md:h-6 md:w-6 text-secondary animate-scale-in" />
                          </div>
                        )}
                        <Key className="h-6 w-6 md:h-8 md:w-8 text-secondary group-hover:scale-110 transition-transform flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-base md:text-lg font-semibold text-primary">I rent my home</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">You currently rent your residence</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 8: Contact Information */}
              {currentStep === 8 && (
                <div className="space-y-5 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        Your results are ready!
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      Where should we send your Business Loan Estimate?
                    </p>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-base md:text-lg font-medium">Full Name</Label>
                      <Input
                        id="name"
                        value={quizData.name}
                        onChange={(e) => setQuizData({...quizData, name: e.target.value})}
                        placeholder="Enter your full name"
                        className="mt-1 md:mt-2 text-base md:text-lg py-2 md:py-3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-base md:text-lg font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={quizData.email}
                        onChange={(e) => setQuizData({...quizData, email: e.target.value})}
                        placeholder="Enter your email address"
                        className="mt-1 md:mt-2 text-base md:text-lg py-2 md:py-3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country" className="text-base md:text-lg font-medium">Country</Label>
                         <select
                          id="country"
                          value={quizData.country}
                          onChange={(e) => setQuizData({...quizData, country: e.target.value, stateProvince: ""})}
                          className="mt-1 md:mt-2 text-base md:text-lg py-2 md:py-3 w-full rounded-md border border-input bg-background px-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select Country</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="stateProvince" className="text-base md:text-lg font-medium">
                          {quizData.country === "CA" ? "Province" : quizData.country === "US" ? "State" : "State/Province"}
                        </Label>
                        <Popover open={stateOpen} onOpenChange={setStateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={stateOpen}
                              className="mt-1 md:mt-2 text-base md:text-lg py-2 md:py-3 w-full justify-between font-normal"
                              disabled={!quizData.country}
                            >
                              {quizData.stateProvince || (quizData.country === "CA" ? "Select Province" : quizData.country === "US" ? "Select State" : "Select Country First")}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 z-50" align="start">
                            <Command>
                              <CommandInput 
                                placeholder={`Search ${quizData.country === "CA" ? "provinces" : quizData.country === "US" ? "states" : "locations"}...`} 
                                className="h-9" 
                              />
                              <CommandList>
                                <CommandEmpty>
                                  No {quizData.country === "CA" ? "province" : quizData.country === "US" ? "state" : "location"} found.
                                </CommandEmpty>
                                <CommandGroup>
                                  {quizData.country === "CA" && canadianProvinces.map((province) => (
                                    <CommandItem
                                      key={province}
                                      value={province}
                                      onSelect={(currentValue) => {
                                        setQuizData({...quizData, stateProvince: currentValue === quizData.stateProvince ? "" : province});
                                        setStateOpen(false);
                                      }}
                                    >
                                      {province}
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          quizData.stateProvince === province ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                  {quizData.country === "US" && usStates.map((state) => (
                                    <CommandItem
                                      key={state}
                                      value={state}
                                      onSelect={(currentValue) => {
                                        setQuizData({...quizData, stateProvince: currentValue === quizData.stateProvince ? "" : state});
                                        setStateOpen(false);
                                      }}
                                    >
                                      {state}
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          quizData.stateProvince === state ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-base md:text-lg font-medium">Phone Number (US/Canada)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={quizData.phone}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setQuizData({...quizData, phone: formatted});
                        }}
                        placeholder="(555) 123-4567"
                        className="mt-1 md:mt-2 text-base md:text-lg py-2 md:py-3"
                        maxLength={14}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyName" className="text-base md:text-lg font-medium">Company Name *</Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={quizData.companyName}
                        onChange={(e) => setQuizData({...quizData, companyName: e.target.value})}
                        placeholder="Your Company Name"
                        className="mt-1 md:mt-2 text-base md:text-lg py-2 md:py-3"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="website" className="text-base md:text-lg font-medium">Website (Optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        value={quizData.website}
                        onChange={(e) => {
                          const value = e.target.value;
                          setQuizData({...quizData, website: value});
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (value) {
                            const formattedUrl = formatWebsiteUrl(value);
                            setQuizData({...quizData, website: formattedUrl});
                          }
                        }}
                        placeholder="yourbusiness.com"
                        className={`mt-1 md:mt-2 text-base md:text-lg py-2 md:py-3 ${
                          quizData.website && !isValidWebsiteUrl(quizData.website) 
                            ? 'border-red-500 focus:border-red-500' 
                            : ''
                        }`}
                      />
                      {quizData.website && !isValidWebsiteUrl(quizData.website) && (
                        <p className="text-xs md:text-sm text-red-600 mt-1">
                          Please enter a valid website URL (e.g., yoursite.com)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation - Show Next button only for steps 1, 3, 4, and 8 */}
              {(currentStep === 1 || currentStep === 3 || currentStep === 4 || currentStep === 8) && (
                <div className="flex justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="flex items-center text-sm md:text-base py-2 md:py-3"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    variant={currentStep === totalSteps ? "cta-simple" : "default"}
                    onClick={handleNext}
                    disabled={!isStepValid() || isSubmitting}
                    className="flex items-center text-sm md:text-lg px-6 md:px-8 py-2 md:py-3"
                  >
                    {currentStep === totalSteps && isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending your info...
                      </>
                    ) : (
                      <>
                        {currentStep === totalSteps ? "See My Results" : "Next"}
                        {!isSubmitting && <ArrowRight className="h-4 w-4 ml-2" />}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Back button only for auto-advancing steps */}
              {(currentStep === 2 || currentStep === 5 || currentStep === 6 || currentStep === 7) && (
                <div className="flex justify-start mt-6 md:mt-8 pt-4 md:pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex items-center text-sm md:text-base py-2 md:py-3"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Quiz;