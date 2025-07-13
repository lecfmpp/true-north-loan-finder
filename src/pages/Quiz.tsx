import { useState } from "react";
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
}

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
    phone: ""
  });
  const [showResults, setShowResults] = useState(false);

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

  const calculateLenderRating = (lender: any) => {
    let rating = 0;
    const loanAmount = quizData.loanAmount[0];
    const monthlyRevenue = quizData.monthlyRevenue[0];
    const timeInBusiness = quizData.timeInBusiness;
    const creditScore = quizData.creditScore;

    // Base compatibility score
    let compatibility = 0;

    switch (lender.name) {
      case "IOU Financial":
        // Prefers established businesses, larger amounts
        if (timeInBusiness === "5+" || timeInBusiness === "2-5") compatibility += 2;
        if (loanAmount >= 50000) compatibility += 2;
        if (monthlyRevenue >= 25000) compatibility += 1;
        break;
      
      case "Driven (formerly Thinking Capital)":
        // Good for quick digital applications, moderate amounts
        if (creditScore === "excellent" || creditScore === "good") compatibility += 2;
        if (loanAmount <= 300000) compatibility += 1;
        if (timeInBusiness !== "0-6") compatibility += 2;
        break;
      
      case "Greenbox Capital":
        // Flexible with credit, focuses on revenue
        if (monthlyRevenue >= 10000) compatibility += 2;
        if (creditScore === "fair" || creditScore === "poor") compatibility += 1;
        if (loanAmount <= 500000) compatibility += 1;
        if (timeInBusiness !== "0-6") compatibility += 1;
        break;
      
      case "Merchant Growth":
        // Good all-around option
        compatibility += 1;
        if (monthlyRevenue >= 15000) compatibility += 1;
        if (creditScore === "excellent" || creditScore === "good") compatibility += 1;
        break;
      
      case "2M7":
        // Alternative option
        if (creditScore === "fair" || creditScore === "poor") compatibility += 1;
        if (loanAmount <= 250000) compatibility += 1;
        break;
      
      case "NorthPoint Funding":
        // MCA specialist
        if (monthlyRevenue >= 20000) compatibility += 2;
        if (loanAmount <= 100000) compatibility += 1;
        break;
    }

    // Convert compatibility to 1-5 star rating
    rating = Math.min(Math.max(Math.ceil((compatibility / 5) * 5), 1), 5);
    
    return rating;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground/30"
        }`}
      />
    ));
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

    // Calculate ratings and sort by rating
    const lendersWithRatings = lenders.map(lender => ({
      ...lender,
      rating: calculateLenderRating(lender)
    })).sort((a, b) => b.rating - a.rating);

    return lendersWithRatings;
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
      await supabase.from('quiz_responses').insert({
        loan_amount: data.loanAmount[0],
        use_of_funds: data.useOfFunds,
        time_in_business: data.timeInBusiness,
        monthly_revenue: data.monthlyRevenue[0],
        credit_score: data.creditScore,
        name: data.name,
        email: data.email,
        phone: data.phone,
        score: score
      });
    } catch (error) {
      console.error('Error saving quiz response:', error);
    }
    setShowResults(true);
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
              <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg">
                <CardTitle className="text-3xl font-bold font-sans text-primary mb-2">
                  Okay, good news. Your business profile is exactly what our lending partners look for.
                </CardTitle>
                <p className="text-lg text-muted-foreground font-serif max-w-2xl mx-auto">
                  Stop guessing. Here's a clear look at the loan you'll likely qualify for, based on the numbers you just gave us.
                </p>
              </CardHeader>
              
              <CardContent className="p-8 space-y-8">
                {/* Main Results Dashboard */}
                <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl p-8 border border-secondary/20">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Hero Number */}
                    <div className="text-center md:text-left">
                      <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                        ${quizData.loanAmount[0].toLocaleString()}
                      </div>
                      <p className="text-lg text-muted-foreground font-medium">
                        Total eligible funding
                      </p>
                      <div className="mt-4">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 ${scoreInfo.color}`}>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="font-semibold">{scoreInfo.title}</span>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/60 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">24-48h</div>
                        <div className="text-sm text-muted-foreground">Time until it's funded</div>
                      </div>
                      <div className="bg-background/60 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {quizData.creditScore === "excellent" ? "8-12%" :
                           quizData.creditScore === "good" ? "12-18%" :
                           quizData.creditScore === "fair" ? "18-25%" : "25-35%"}
                        </div>
                        <div className="text-sm text-muted-foreground">What you'll pay (est. rate)</div>
                      </div>
                      <div className="bg-background/60 rounded-lg p-4 text-center col-span-2">
                        <div className="text-2xl font-bold text-primary">
                          ${Math.round((quizData.loanAmount[0] * 0.15) / 12).toLocaleString()}/mo
                        </div>
                        <div className="text-sm text-muted-foreground">Your estimated monthly payment</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lender Introductions */}
                <div>
                  <h3 className="text-2xl font-bold font-sans text-primary mb-2 flex items-center">
                    <Users className="h-6 w-6 mr-3 text-secondary" />
                    We'll introduce you to these lenders right now.
                  </h3>
                  <p className="text-muted-foreground mb-6 font-serif">
                    Each one has already said yes to businesses like yours. Here's who's waiting to hear from you:
                  </p>
                  
                  <div className="space-y-4">
                    {getLenderData().map((lender, index) => (
                      <Card 
                        key={lender.name}
                        className={`border-l-4 ${lender.borderColor} bg-gradient-to-r ${lender.bgGradient} ${
                          index === 0 ? 'ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-400/20' : ''
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-primary text-lg">{lender.name}</h4>
                                <div className="flex items-center gap-1">
                                  {renderStars(lender.rating)}
                                  <span className="text-sm text-muted-foreground ml-1">
                                    ({lender.rating}/5)
                                  </span>
                                </div>
                                {index === 0 && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    Top Match
                                  </Badge>
                                )}
                              </div>
                              <p className="text-secondary font-semibold">{lender.description}</p>
                            </div>
                            <Badge variant={lender.badgeVariant} className="shrink-0">
                              {lender.badge}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {lender.details}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs">
                            {lender.stats.map((stat, statIndex) => (
                              <div key={statIndex} className="bg-background/60 rounded p-2">
                                <div className="font-semibold text-primary">{stat.value}</div>
                                <div className="text-muted-foreground">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                     ))}
                   </div>
                 </div>

                {/* Clear Action Section */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8 text-center border border-primary/20">
                  <h3 className="text-2xl font-bold text-primary mb-4">
                    Ready to move forward?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    These lenders are expecting to hear from you. One click sends your details to all of them at once.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                    <Button size="lg" className="flex-1 bg-secondary hover:bg-secondary/90 text-lg py-6">
                      Okay, send my details to these lenders
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <button className="text-primary hover:text-primary/80 underline text-sm font-medium">
                      Have a question before you move forward? Chat with us.
                    </button>
                  </div>
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
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold font-sans text-primary mb-6">
              Find Out Exactly How Much You Can Borrow 
              <span className="text-secondary"> & Get It In Your Account Within 48 Hours</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              No guesswork. No surprises. Just your personalized loan amount, rates, and exact timeline to funding—delivered in the next 60 seconds.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold font-sans text-primary">
                Business Loan Estimator
              </h1>
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Takes about 60 seconds to complete
            </p>
          </div>

          <Card className="border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-8">
              {/* Step 1: Loan Amount */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-3xl font-bold font-sans text-primary mb-3">
                      How much funding are you looking for?
                    </h2>
                    <p className="text-lg text-muted-foreground font-serif">
                      Select the amount that best fits your business needs
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <Slider
                      value={quizData.loanAmount}
                      onValueChange={(value) => setQuizData({...quizData, loanAmount: value})}
                      max={800000}
                      min={5000}
                      step={5000}
                      className="w-full"
                    />
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        ${quizData.loanAmount[0].toLocaleString()}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        Range: $5,000 - $800,000
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Use of Funds */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <Building className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-3xl font-bold font-sans text-primary mb-3">
                      What's the primary purpose of the funds?
                    </h2>
                    <p className="text-lg text-muted-foreground font-serif">
                      This helps us match you with the right type of lenders
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <CardContent className="p-6 text-center relative">
                            {isSelected && (
                              <div className="absolute top-4 right-4">
                                <Check className="h-6 w-6 text-secondary animate-scale-in" />
                              </div>
                            )}
                            <IconComponent className="h-12 w-12 text-secondary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-lg font-semibold text-primary mb-1">{option.label}</h3>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Time in Business */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-3xl font-bold font-sans text-primary mb-3">
                      How long has your business been operating?
                    </h2>
                    <p className="text-lg text-muted-foreground font-serif">
                      Time in business is a key factor for loan qualification
                    </p>
                  </div>
                  
                  <div className="space-y-3">
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
                          <CardContent className="p-6 flex items-center gap-4 relative">
                            {isSelected && (
                              <div className="absolute top-4 right-4">
                                <Check className="h-6 w-6 text-secondary animate-scale-in" />
                              </div>
                            )}
                            <IconComponent className="h-8 w-8 text-secondary group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-primary">{option.label}</h3>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
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
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-3xl font-bold font-sans text-primary mb-3">
                      What is your average monthly revenue?
                    </h2>
                    <p className="text-lg text-muted-foreground font-serif">
                      This helps determine your loan capacity and terms
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <Slider
                      value={quizData.monthlyRevenue}
                      onValueChange={(value) => setQuizData({...quizData, monthlyRevenue: value})}
                      max={200000}
                      min={1000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        ${quizData.monthlyRevenue[0].toLocaleString()}/month
                      </div>
                      <div className="text-lg text-muted-foreground">
                        Range: $1,000 - $200,000+ per month
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Credit Score */}
              {currentStep === 5 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <Star className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-3xl font-bold font-sans text-primary mb-3">
                      What's your estimated personal credit score?
                    </h2>
                    <p className="text-lg text-muted-foreground font-serif">
                      Don't worry - we work with businesses across all credit ranges
                    </p>
                  </div>
                  
                  <div className="space-y-3">
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
                          <CardContent className="p-6 flex items-center gap-4 relative">
                            {isSelected && (
                              <div className="absolute top-4 right-4">
                                <Check className="h-6 w-6 text-secondary animate-scale-in" />
                              </div>
                            )}
                            <IconComponent className="h-8 w-8 text-secondary group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-primary">{option.label}</h3>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
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
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-3xl font-bold font-sans text-primary mb-3">
                      Your results are ready!
                    </h2>
                    <p className="text-lg text-muted-foreground font-serif">
                      Where should we send your Business Loan Estimate?
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-lg font-medium">Full Name</Label>
                      <Input
                        id="name"
                        value={quizData.name}
                        onChange={(e) => setQuizData({...quizData, name: e.target.value})}
                        placeholder="Enter your full name"
                        className="mt-2 text-lg py-3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-lg font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={quizData.email}
                        onChange={(e) => setQuizData({...quizData, email: e.target.value})}
                        placeholder="Enter your email address"
                        className="mt-2 text-lg py-3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-lg font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={quizData.phone}
                        onChange={(e) => setQuizData({...quizData, phone: e.target.value})}
                        placeholder="Enter your phone number"
                        className="mt-2 text-lg py-3"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation - Show Next button only for steps 1, 4, and 6 */}
              {(currentStep === 1 || currentStep === 4 || currentStep === 6) && (
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    variant={currentStep === totalSteps ? "cta" : "default"}
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex items-center text-lg px-8 py-3"
                  >
                    {currentStep === totalSteps ? "See My Results" : "Next"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Back button only for auto-advancing steps */}
              {(currentStep === 2 || currentStep === 3 || currentStep === 5) && (
                <div className="flex justify-start mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex items-center"
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