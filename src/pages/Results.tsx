import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  Shield,
  Building,
  DollarSign,
  Clock,
  Star,
  ArrowLeft,
  Calendar,
  MessageCircle
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingCalendar from "@/components/BookingCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Results = () => {
  const [searchParams] = useSearchParams();
  const { responseId } = useParams();
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Get quiz data from URL params or fetch from database
  const loanAmount = parseInt(searchParams.get('amount') || '50000');
  const name = searchParams.get('name') || '';
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const score = parseInt(searchParams.get('score') || '75');
  const quizResponseId = responseId || searchParams.get('responseId') || '';

  // Fetch quiz data if we have responseId but missing other data
  useEffect(() => {
    const fetchQuizData = async () => {
      if (quizResponseId && (!name || !email)) {
        try {
          const { data, error } = await supabase
            .from('quiz_responses')
            .select('*')
            .eq('id', quizResponseId)
            .single();

          if (error) throw error;
          
          if (data) {
            setQuizData(data);
          }
        } catch (error) {
          console.error('Error fetching quiz data:', error);
          navigate('/loan-estimator');
        }
      }
      setLoading(false);
    };

    fetchQuizData();
  }, [quizResponseId, name, email, navigate]);

  // Redirect if missing essential data and can't fetch it
  useEffect(() => {
    if (!loading && !quizResponseId) {
      navigate('/loan-estimator');
    }
  }, [loading, quizResponseId, navigate]);

  // Auto-enroll in follow-up email sequence when quiz is completed
  useEffect(() => {
    const enrollInEmailSequence = async () => {
      if (quizResponseId && (quizData || name)) {
        const userData = {
          name: quizData?.name || name,
          email: quizData?.email || email,
          phone: quizData?.phone || phone,
          score: quizData?.score || score,
          loan_amount: quizData?.loan_amount || loanAmount,
          monthly_revenue: quizData?.monthly_revenue || 0,
          credit_score: quizData?.credit_score || '',
          time_in_business: quizData?.time_in_business || '',
          use_of_funds: quizData?.use_of_funds || ''
        };

        try {
          await supabase.functions.invoke('auto-enroll-lead', {
            body: {
              email: userData.email,
              name: userData.name,
              sequenceType: 'follow_up',
              userData
            }
          });
          console.log('Successfully enrolled in follow-up email sequence');
        } catch (error) {
          console.error('Error enrolling in email sequence:', error);
        }
      }
    };

    // Only enroll if we have the necessary data and haven't enrolled yet
    if (!loading && (quizData || (name && email))) {
      enrollInEmailSequence();
      
      // Fire Google Ads conversion tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'ads_conversion_SUBMIT_LEAD_FORM_1', {});
      }
    }
  }, [loading, quizData, quizResponseId, name, email, phone, score, loanAmount]);

  const calculateLoanTerms = () => {
    const workingScore = quizData?.score || score;
    const workingAmount = quizData?.loan_amount || loanAmount;
    
    // Set rate ranges
    const minRate = 4.5;
    const maxRate = 11.0;
    let speed = "3-5 business days";
    
    if (workingScore >= 80) {
      speed = "24-48 hours";
    } else if (workingScore >= 70) {
      speed = "2-3 business days";
    }

    // Calculate payment range using the min and max rates
    const minMonthlyPayment = (workingAmount * (minRate / 100 / 12)) / (1 - Math.pow(1 + (minRate / 100 / 12), -36));
    const maxMonthlyPayment = (workingAmount * (maxRate / 100 / 12)) / (1 - Math.pow(1 + (maxRate / 100 / 12), -36));

    return {
      estimatedFunding: workingAmount,
      fundingSpeed: speed,
      estimatedRate: `${minRate}% - ${maxRate}%`,
      estimatedPayment: `$${Math.round(minMonthlyPayment).toLocaleString()} - $${Math.round(maxMonthlyPayment).toLocaleString()}/mo`
    };
  };

  // Use quiz data from database if available, otherwise use URL params
  const finalName = quizData?.name || name;
  const finalEmail = quizData?.email || email;
  const finalPhone = quizData?.phone || phone;
  const finalScore = quizData?.score || score;
  const finalLoanAmount = quizData?.loan_amount || loanAmount;

  const loanTerms = calculateLoanTerms();

  const topLenders = [
    {
      id: 1,
      name: "Driven Capital",
      logo: "/lovable-uploads/c648a402-4252-4e8a-8ec1-ec98595a2b96.png",
      matchRating: "5/5",
      tagline: "Best for fast, digital applications for businesses over 6 months old."
    },
    {
      id: 2,
      name: "Merchant Growth",
      logo: "/lovable-uploads/77b173e0-4da2-4b65-a106-fddb77e38ed9.png",
      matchRating: "4/5", 
      tagline: "Ideal for businesses with consistent monthly revenue streams."
    },
    {
      id: 3,
      name: "Greenbox Capital",
      logo: "/lovable-uploads/591559e5-847d-436d-8c1c-3046d5bece44.png",
      matchRating: "4/5",
      tagline: "Perfect for established businesses seeking flexible terms."
    }
  ];

  const handleStartApplication = () => {
    console.log('=== START APPLICATION BUTTON CLICKED ===');
    console.log('Navigating to application with data:', {
      finalName,
      finalEmail,
      finalPhone,
      quizResponseId,
      country: quizData?.country
    });
    
    try {
      if (!finalName || !finalEmail) {
        console.log('Missing data - showing toast and redirecting');
        toast({
          title: "Missing Information",
          description: "Please complete the loan estimator first to start your application.",
          variant: "destructive",
        });
        navigate('/loan-estimator');
        return;
      }
      
      // Create URL params to pre-fill the application form
      const applicationParams = new URLSearchParams({
        name: finalName,
        email: finalEmail,
        phone: finalPhone || '',
        quizResponseId: quizResponseId || '',
        loanAmount: finalLoanAmount.toString(),
        monthlyRevenue: (quizData?.monthly_revenue || 0).toString(),
        creditScore: quizData?.credit_score || '',
        timeInBusiness: quizData?.time_in_business || '',
        useOfFunds: quizData?.use_of_funds || ''
      });
      
      // Route based on country selection
      const country = quizData?.country;
      console.log('Country from quizData:', country);
      
      // Route to Canadian application for CA, US application for US or undefined
      const applicationRoute = country === 'CA' ? '/canadian-application' : '/application-usa';
      
      console.log(`Navigating to ${applicationRoute} with params:`, applicationParams.toString());
      navigate(`${applicationRoute}?${applicationParams.toString()}`);
      
    } catch (error) {
      console.error('Error in handleStartApplication:', error);
    }
  };

  const handleBookingConfirmed = (bookingData: any) => {
    setBookingDetails(bookingData);
    setBookingConfirmed(true);
    setShowBooking(false);
  };

  const handleChatWithUs = () => {
    // You can implement chat functionality here
    window.open('mailto:support@email.truenorthbusinessloan.ca', '_blank');
  };

  if (bookingConfirmed && bookingDetails) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />
        <div className="container mx-auto px-4 py-12 max-w-full overflow-x-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-8 overflow-x-hidden">
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-4xl font-bold text-primary">
                Booking Confirmed!
              </h1>
              <p className="text-xl text-muted-foreground">
                Your Pre-Offer Call is scheduled and confirmed.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="font-medium">Date:</p>
                    <p className="text-muted-foreground">{bookingDetails.appointmentDate}</p>
                  </div>
                  <div>
                    <p className="font-medium">Time:</p>
                    <p className="text-muted-foreground">{bookingDetails.appointmentTime}</p>
                  </div>
                  <div>
                    <p className="font-medium">Duration:</p>
                    <p className="text-muted-foreground">15 minutes</p>
                  </div>
                  <div>
                    <p className="font-medium">Type:</p>
                    <p className="text-muted-foreground">Pre-Offer Call</p>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm">
                    <strong>Next Steps:</strong> You'll receive a confirmation email with your meeting link and preparation details within the next few minutes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button onClick={() => navigate('/')} size="lg" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Homepage
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <div className="container mx-auto px-4 py-6 md:py-12 max-w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 overflow-x-hidden">
          
          {!showBooking ? (
            <>
              {/* Hook Section */}
              <div className="text-center space-y-4 md:space-y-6 overflow-x-hidden">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary px-2 break-words">
                  Excellent! Your profile is a strong match. Here's what you're pre-qualified for.
                </h1>
                
                {/* Optimized compact layout */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 md:p-6 border border-green-200">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-center">
                    {/* Main funding amount */}
                    <div className="lg:col-span-1 text-center">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-1">
                        ${loanTerms.estimatedFunding.toLocaleString()}
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground">Estimated Eligible Funding</p>
                    </div>
                    
                    {/* Funding details in a row */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="text-center space-y-1 p-2 md:p-3">
                          <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto" />
                          <h3 className="text-xs md:text-sm font-semibold">Funding Speed</h3>
                          <p className="text-sm md:text-base font-bold text-foreground">{loanTerms.fundingSpeed}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="text-center space-y-1 p-2 md:p-3">
                          <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto" />
                          <h3 className="text-xs md:text-sm font-semibold">Est. Rate</h3>
                          <p className="text-sm md:text-base font-bold text-foreground">{loanTerms.estimatedRate}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="text-center space-y-1 p-2 md:p-3">
                          <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto" />
                          <h3 className="text-xs md:text-sm font-semibold">Est. Payment</h3>
                          <p className="text-sm md:text-base font-bold text-foreground">{loanTerms.estimatedPayment}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call-to-Action Section */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="text-center pb-3 md:pb-6">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl px-2">
                    Unlock Your Official Offers in Under 48 Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 text-center">
                  <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto px-2">
                    <Button 
                      size="lg" 
                      onClick={(e) => {
                        console.log('Button click event triggered:', e);
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartApplication();
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base md:text-xl py-4 md:py-6 px-4 md:px-12 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all w-full min-h-[56px] md:min-h-[72px] flex items-center justify-center cursor-pointer"
                      type="button"
                    >
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                      <span className="text-center leading-tight">
                        Complete Your Application<br className="sm:hidden" /> & Get Response Today
                      </span>
                    </Button>
                    
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Fast track your funding - complete your application now to get offers today.
                    </p>
                  </div>

                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
                    Based on your profile, you're pre-qualified for funding. Complete your detailed application now to receive official offers from our lender network today.
                  </p>

                  <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto text-left">
                    <p className="font-medium text-sm md:text-base px-2">Your application will include:</p>
                    <div className="grid grid-cols-1 gap-2 md:gap-3 px-2">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs md:text-sm"><strong>Pre-filled Information:</strong> Your quiz answers will auto-complete most fields.</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs md:text-sm"><strong>Business Details:</strong> Additional information to finalize your funding profile.</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs md:text-sm"><strong>Fast Response:</strong> Get official offers from multiple lenders within 24-48 hours.</span>
                      </div>
                    </div>
                  </div>
                    
                  <Button 
                    variant="link" 
                    onClick={handleChatWithUs}
                    className="text-blue-600 hover:text-blue-800 text-center leading-relaxed px-2 text-xs md:text-sm"
                  >
                    <MessageCircle className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                    <span className="break-words">
                      Have a question before applying? Chat with us now.
                    </span>
                  </Button>
                </CardContent>
              </Card>

            </>
          ) : (
            <>
              {/* Booking Calendar Section */}
              <div className="space-y-4 md:space-y-6">
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBooking(false)}
                    className="mb-3 md:mb-4 text-xs md:text-sm"
                  >
                    <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    Back to Results
                  </Button>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary px-2">
                    Schedule Your Pre-Offer Call
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2">
                    Choose a convenient time for your 15-minute funding strategy call
                  </p>
                </div>

                <BookingCalendar 
                  onBookingConfirmed={handleBookingConfirmed}
                  userInfo={{
                    name: finalName,
                    email: finalEmail,
                    phone: finalPhone,
                    quizResponseId
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Results;