import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  CreditCard
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuizData {
  loanAmount: number[];
  useOfFunds: string;
  timeInBusiness: string;
  monthlyRevenue: number[];
  creditScore: string;
  name: string;
  email: string;
  phone: string;
  website: string;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({
    loanAmount: [50000],
    useOfFunds: "",
    timeInBusiness: "",
    monthlyRevenue: [25000],
    creditScore: "",
    name: "",
    email: "",
    phone: "",
    website: ""
  });
  const [showResults, setShowResults] = useState(false);

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

    async submitLead(formData: QuizData) {
      const sessionId = localStorage.getItem('visitor_session_id');
      
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
              quiz_score: calculateScore(),
              source: 'business_loan_quiz',
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

  // Track visitor when component mounts
  useEffect(() => {
    EXTERNAL_TRACKER.trackVisitor();
  }, []);

  const totalSteps = 6;
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

  const calculateScore = () => {
    let score = 60; // Base score
    
    // Time in business scoring
    if (quizData.timeInBusiness === "5+") score += 25;
    else if (quizData.timeInBusiness === "2-5") score += 20;
    else if (quizData.timeInBusiness === "1-2") score += 10;
    else if (quizData.timeInBusiness === "6-12") score += 5;
    
    // Revenue scoring
    if (quizData.monthlyRevenue[0] >= 50000) score += 15;
    else if (quizData.monthlyRevenue[0] >= 25000) score += 10;
    else if (quizData.monthlyRevenue[0] >= 10000) score += 5;
    
    // Credit score scoring
    if (quizData.creditScore === "excellent") score += 10;
    else if (quizData.creditScore === "good") score += 5;
    
    return Math.min(score, 100);
  };

  const getScoreMessage = (score: number) => {
    if (score >= 85) return {
      title: "Excellent Match!",
      message: "Your profile is outstanding! You're a prime candidate for multiple financing options with competitive rates.",
      color: "text-secondary"
    };
    if (score >= 70) return {
      title: "Strong Match!",
      message: "Your consistent revenue and business history make you an attractive candidate for our top lending partners.",
      color: "text-secondary"
    };
    if (score >= 55) return {
      title: "Good Match!",
      message: "You have solid qualifications. Several of our lenders specialize in businesses like yours.",
      color: "text-accent"
    };
    return {
      title: "Potential Match",
      message: "While you may face some challenges, we have specialized lenders who work with businesses in your situation.",
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

  const saveQuizResponse = async (data: QuizData) => {
    try {
      const score = calculateScore();
      
      // Clear any existing session temporarily for anonymous submission
      const currentSession = await supabase.auth.getSession();
      if (currentSession.data.session) {
        console.log('Clearing session for anonymous quiz submission');
        await supabase.auth.signOut();
      }
      
      // Save to local Supabase database
      const { data: savedResponse, error } = await supabase.from('quiz_responses').insert({
        loan_amount: data.loanAmount[0],
        use_of_funds: data.useOfFunds,
        time_in_business: data.timeInBusiness,
        monthly_revenue: data.monthlyRevenue[0],
        credit_score: data.creditScore,
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website,
        score: score
      }).select().single();

      if (error) throw error;

      // Submit to external tracking system
      await EXTERNAL_TRACKER.submitLead(data);

      // Start follow-up email sequence (15-minute delay)
      setTimeout(async () => {
        try {
          const response = await supabase.functions.invoke('send-email-sequence', {
            body: {
              type: 'follow_up',
              userEmail: data.email,
              userName: data.name.split(' ')[0] // Use first name
            }
          });
          
          if (response.error) {
            console.error('Error starting email sequence:', response.error);
          } else {
            console.log('Follow-up email sequence started successfully');
          }
        } catch (error) {
          console.error('Error starting email sequence:', error);
        }
      }, 15 * 60 * 1000); // 15 minutes delay

      // Redirect to results page with data
      const resultsUrl = new URLSearchParams({
        amount: data.loanAmount[0].toString(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        score: score.toString(),
        responseId: savedResponse.id
      });
      
      window.location.href = `/results/${savedResponse.id}?${resultsUrl.toString()}`;
      
    } catch (error) {
      console.error('Error saving quiz response:', error);
      setShowResults(true); // Fallback to showing results inline if redirect fails
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
      case 3: return quizData.timeInBusiness !== "";
      case 4: return quizData.monthlyRevenue[0] > 0;
      case 5: return quizData.creditScore !== "";
      case 6: return quizData.name && quizData.email && quizData.phone;
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

              {/* Step 3: Time in Business */}
              {currentStep === 3 && (
                <div className="space-y-5 md:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Clock className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-primary leading-tight">
                        How long has your business been operating?
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-serif">
                      Time in business is a key factor for loan qualification
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {timeInBusinessOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = quizData.timeInBusiness === option.id;
                      
                      return (
                        <Card
                          key={option.id}
                          className={cn(
                            "cursor-pointer transition-all duration-300 group hover:shadow-lg border-2",
                            isSelected 
                              ? "border-secondary bg-secondary/10 shadow-md" 
                              : "border-border hover:border-secondary/50 hover:bg-secondary/5"
                          )}
                          onClick={() => handleOptionSelect('timeInBusiness', option.id)}
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

              {/* Step 6: Contact Information */}
              {currentStep === 6 && (
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

              {/* Navigation - Show Next button only for steps 1, 4, and 6 */}
              {(currentStep === 1 || currentStep === 4 || currentStep === 6) && (
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
                    variant={currentStep === totalSteps ? "cta" : "default"}
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex items-center text-sm md:text-lg px-6 md:px-8 py-2 md:py-3"
                  >
                    {currentStep === totalSteps ? "See My Results" : "Next"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Back button only for auto-advancing steps */}
              {(currentStep === 2 || currentStep === 3 || currentStep === 5) && (
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