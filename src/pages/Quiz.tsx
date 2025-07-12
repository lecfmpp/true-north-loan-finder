import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Users
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

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
    { id: "equipment", label: "Equipment & Machinery", icon: "🏗️" },
    { id: "inventory", label: "Inventory & Stock", icon: "📦" },
    { id: "expansion", label: "Business Expansion", icon: "📈" },
    { id: "working-capital", label: "Working Capital", icon: "💰" },
    { id: "real-estate", label: "Real Estate", icon: "🏢" },
    { id: "other", label: "Other", icon: "🎯" }
  ];

  const timeInBusinessOptions = [
    { id: "startup", label: "Startup (Less than 6 months)" },
    { id: "6-12", label: "6-12 months" },
    { id: "1-2", label: "1-2 years" },
    { id: "2-5", label: "2-5 years" },
    { id: "5+", label: "5+ years" }
  ];

  const creditScoreOptions = [
    { id: "excellent", label: "Excellent (750+)" },
    { id: "good", label: "Good (700-749)" },
    { id: "fair", label: "Fair (650-699)" },
    { id: "poor", label: "Poor (Below 650)" },
    { id: "unsure", label: "Not Sure" }
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

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      // Save quiz response to database
      try {
        const score = calculateScore();
        await supabase.from('quiz_responses').insert({
          loan_amount: quizData.loanAmount[0],
          use_of_funds: quizData.useOfFunds,
          time_in_business: quizData.timeInBusiness,
          monthly_revenue: quizData.monthlyRevenue[0],
          credit_score: quizData.creditScore,
          name: quizData.name,
          email: quizData.email,
          phone: quizData.phone,
          score: score
        });
      } catch (error) {
        console.error('Error saving quiz response:', error);
      }
      setShowResults(true);
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
                    <Card className="border-l-4 border-l-secondary bg-gradient-to-r from-secondary/5 to-transparent">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-primary text-lg">Driven Capital</h4>
                            <p className="text-secondary font-semibold">Best if you need funding in under 48 hours</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">Fast Track</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          Perfect for businesses operating 6+ months. Digital application, same-day decisions, funds in your account within 2 days.
                        </p>
                        <div className="flex items-center mt-3 text-sm">
                          <Star className="h-4 w-4 mr-1 text-accent fill-current" />
                          <span className="text-muted-foreground">4.8/5 rating • 2,400+ funded businesses</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-primary text-lg">Canadian Business Credit</h4>
                            <p className="text-secondary font-semibold">Best if you want the lowest possible rate</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">Low Rates</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          Established lender with 15+ years helping Canadian SMEs. Competitive rates, flexible terms, human underwriters.
                        </p>
                        <div className="flex items-center mt-3 text-sm">
                          <Shield className="h-4 w-4 mr-1 text-secondary" />
                          <span className="text-muted-foreground">A+ BBB Rating • Since 2008</span>
                        </div>
                      </CardContent>
                    </Card>

                    {score >= 70 && (
                      <Card className="border-l-4 border-l-accent bg-gradient-to-r from-accent/10 to-transparent">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-primary text-lg">Prime Business Funding</h4>
                              <p className="text-secondary font-semibold">Best if you qualify for premium terms</p>
                            </div>
                            <Badge className="shrink-0 bg-accent text-accent-foreground">Exclusive</Badge>
                          </div>
                          <p className="text-muted-foreground">
                            Only for businesses with strong profiles. Lowest rates, highest amounts, longest terms available.
                          </p>
                          <div className="flex items-center mt-3 text-sm">
                            <TrendingUp className="h-4 w-4 mr-1 text-accent" />
                            <span className="text-muted-foreground">Up to $800K • Premium partnership</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
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
      <div className="container mx-auto px-4 py-12">
        {/* Hero Headline */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-5xl font-bold font-sans text-primary mb-4 leading-tight">
            Find Out Exactly How Much You Can Borrow 
            <span className="text-secondary"> & Get It In Your Account Within 48 Hours</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto font-serif">
            No guesswork. No surprises. Just your personalized loan amount, rates, and exact timeline to funding—delivered in the next 60 seconds.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold font-sans text-primary">
                Loan Readiness Quiz
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
                <div className="space-y-6">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold font-sans text-primary mb-2">
                      How much funding are you looking for?
                    </h2>
                    <p className="text-muted-foreground font-serif">
                      Select the amount that best fits your business needs
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Slider
                      value={quizData.loanAmount}
                      onValueChange={(value) => setQuizData({...quizData, loanAmount: value})}
                      max={800000}
                      min={5000}
                      step={5000}
                      className="w-full"
                    />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        ${quizData.loanAmount[0].toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Range: $5,000 - $800,000
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Use of Funds */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Building className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold font-sans text-primary mb-2">
                      What's the primary purpose of the funds?
                    </h2>
                    <p className="text-muted-foreground font-serif">
                      This helps us match you with the right type of lenders
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {useOfFundsOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`cursor-pointer transition-all ${
                          quizData.useOfFunds === option.id
                            ? "border-secondary bg-secondary/10"
                            : "border-border hover:border-secondary/50"
                        }`}
                        onClick={() => setQuizData({...quizData, useOfFunds: option.id})}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-2">{option.icon}</div>
                          <div className="text-sm font-medium">{option.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Time in Business */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold font-sans text-primary mb-2">
                      How long has your business been operating?
                    </h2>
                    <p className="text-muted-foreground font-serif">
                      Time in business is a key factor for loan qualification
                    </p>
                  </div>
                  
                  <RadioGroup
                    value={quizData.timeInBusiness}
                    onValueChange={(value) => setQuizData({...quizData, timeInBusiness: value})}
                    className="space-y-3"
                  >
                    {timeInBusinessOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 4: Monthly Revenue */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold font-sans text-primary mb-2">
                      What is your average monthly revenue?
                    </h2>
                    <p className="text-muted-foreground font-serif">
                      This helps determine your loan capacity and terms
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Slider
                      value={quizData.monthlyRevenue}
                      onValueChange={(value) => setQuizData({...quizData, monthlyRevenue: value})}
                      max={200000}
                      min={1000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        ${quizData.monthlyRevenue[0].toLocaleString()}/month
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Range: $1,000 - $200,000+ per month
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Credit Score */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Star className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold font-sans text-primary mb-2">
                      What's your estimated personal credit score?
                    </h2>
                    <p className="text-muted-foreground font-serif">
                      Don't worry - we work with businesses across all credit ranges
                    </p>
                  </div>
                  
                  <RadioGroup
                    value={quizData.creditScore}
                    onValueChange={(value) => setQuizData({...quizData, creditScore: value})}
                    className="space-y-3"
                  >
                    {creditScoreOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 6: Contact Information */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold font-sans text-primary mb-2">
                      Your results are ready!
                    </h2>
                    <p className="text-muted-foreground font-serif">
                      Where should we send your Loan Readiness Score?
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={quizData.name}
                        onChange={(e) => setQuizData({...quizData, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={quizData.email}
                        onChange={(e) => setQuizData({...quizData, email: e.target.value})}
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={quizData.phone}
                        onChange={(e) => setQuizData({...quizData, phone: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
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
                  className="flex items-center"
                >
                  {currentStep === totalSteps ? "See My Results" : "Next"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Quiz;