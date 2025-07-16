import React, { useState, useEffect } from 'react';
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
    }
  }, [loading, quizData, quizResponseId, name, email, phone, score, loanAmount]);

  const calculateLoanTerms = () => {
    const workingScore = quizData?.score || score;
    const workingAmount = quizData?.loan_amount || loanAmount;
    
    let rate = 8.5;
    let speed = "3-5 business days";
    
    if (workingScore >= 80) {
      rate = 6.5;
      speed = "24-48 hours";
    } else if (workingScore >= 70) {
      rate = 7.5;
      speed = "2-3 business days";
    }

    const monthlyPayment = (workingAmount * (rate / 100 / 12)) / (1 - Math.pow(1 + (rate / 100 / 12), -36));

    return {
      estimatedFunding: workingAmount,
      fundingSpeed: speed,
      estimatedRate: `${rate}%`,
      estimatedPayment: `$${Math.round(monthlyPayment).toLocaleString()}/mo`
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

  const handleBookCall = () => {
    console.log('Book call clicked with data:', {
      finalName,
      finalEmail,
      finalPhone,
      quizResponseId
    });
    
    try {
      if (!finalName || !finalEmail) {
        console.log('Missing data - showing toast and redirecting');
        toast({
          title: "Missing Information",
          description: "Please complete the loan estimator first to book a call.",
          variant: "destructive",
        });
        navigate('/loan-estimator');
        return;
      }
      
      console.log('Setting showBooking to true');
      setShowBooking(true);
      
      // Scroll to top when showing booking calendar
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      console.log('Booking state should now be:', true);
    } catch (error) {
      console.error('Error in handleBookCall:', error);
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-8">
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          
          {!showBooking ? (
            <>
              {/* Hook Section */}
              <div className="text-center space-y-4 md:space-y-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary px-2">
                  Excellent! Your profile is a strong match. Here's what you're pre-qualified for.
                </h1>
                
                <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 md:p-6 border border-green-200">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-1 md:mb-2">
                    ${loanTerms.estimatedFunding.toLocaleString()}
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground">Estimated Eligible Funding</p>
                </div>

                <div className="space-y-3 md:space-y-4 max-w-3xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="text-center space-y-2 p-3 md:p-4">
                        <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mx-auto" />
                        <h3 className="text-sm md:text-base font-semibold">Funding Speed</h3>
                        <p className="text-base md:text-lg font-bold text-foreground">{loanTerms.fundingSpeed}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="text-center space-y-2 p-3 md:p-4">
                        <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto" />
                        <h3 className="text-sm md:text-base font-semibold">Est. Rate</h3>
                        <p className="text-base md:text-lg font-bold text-foreground">{loanTerms.estimatedRate}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid grid-cols-1 max-w-md mx-auto">
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="text-center space-y-2 p-3 md:p-4">
                        <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-500 mx-auto" />
                        <h3 className="text-sm md:text-base font-semibold">Est. Payment</h3>
                        <p className="text-base md:text-lg font-bold text-foreground">{loanTerms.estimatedPayment}</p>
                      </CardContent>
                    </Card>
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
                      onClick={handleBookCall}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm sm:text-base md:text-xl py-4 md:py-6 px-4 md:px-12 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all w-full min-h-[56px] md:min-h-[72px] flex items-center justify-center"
                    >
                      <Calendar className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                      <span className="text-center leading-tight">
                        Book My 15-Min<br className="sm:hidden" /> Pre-Offer Call
                      </span>
                    </Button>
                    
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Yes, this call is required to receive your official lender offers.
                    </p>
                  </div>

                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
                    Your application is ready. The final step is a quick 15-minute 'Pre-Offer Call' with a funding advisor. 
                    This call is required to get your official offers from the lenders above.
                  </p>

                  <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto text-left">
                    <p className="font-medium text-sm md:text-base px-2">On this call, we will:</p>
                    <div className="grid grid-cols-1 gap-2 md:gap-3 px-2">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs md:text-sm"><strong>Verify Your Details:</strong> A quick confirmation to ensure accuracy.</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs md:text-sm"><strong>Finalize Your Funding Needs:</strong> We'll confirm the numbers for your official offers.</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs md:text-sm"><strong>Outline Required Documents:</strong> We'll tell you exactly which simple documents to have ready (if any).</span>
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
                      Have a question before booking? Chat with us now.
                    </span>
                  </Button>
                </CardContent>
              </Card>

              {/* Curated Lender Matches */}
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-xl sm:text-2xl md:text-2xl font-bold text-center px-2">
                  Based on your profile, here are your Top 3 matches from our network:
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {topLenders.map((lender) => (
                    <Card key={lender.id} className="text-center bg-slate-800 border-slate-700 text-white animate-fade-in h-full">
                      <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4 h-full flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg md:text-2xl text-white">{lender.name}</h3>
                          <Badge className="bg-green-100 text-green-800 mt-2">
                            Top Match ({lender.matchRating})
                          </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-gray-300 flex-grow">
                          {lender.tagline}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
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