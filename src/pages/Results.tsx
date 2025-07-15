import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Get quiz data from URL params
  const loanAmount = parseInt(searchParams.get('amount') || '50000');
  const name = searchParams.get('name') || '';
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const score = parseInt(searchParams.get('score') || '75');
  const quizResponseId = searchParams.get('responseId') || '';

  // Redirect if missing essential data
  useEffect(() => {
    if (!name || !email || !score) {
      navigate('/loan-estimator');
    }
  }, [name, email, score, navigate]);

  const calculateLoanTerms = () => {
    let rate = 8.5;
    let speed = "3-5 business days";
    
    if (score >= 80) {
      rate = 6.5;
      speed = "24-48 hours";
    } else if (score >= 70) {
      rate = 7.5;
      speed = "2-3 business days";
    }

    const monthlyPayment = (loanAmount * (rate / 100 / 12)) / (1 - Math.pow(1 + (rate / 100 / 12), -36));

    return {
      estimatedFunding: loanAmount,
      fundingSpeed: speed,
      estimatedRate: `${rate}%`,
      estimatedPayment: `$${Math.round(monthlyPayment).toLocaleString()}/mo`
    };
  };

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
      logo: "/src/assets/merchant-growth-logo.png",
      matchRating: "4/5", 
      tagline: "Ideal for businesses with consistent monthly revenue streams."
    },
    {
      id: 3,
      name: "Greenbox Capital",
      logo: "/src/assets/greenbox-capital-logo.png",
      matchRating: "4/5",
      tagline: "Perfect for established businesses seeking flexible terms."
    }
  ];

  const handleBookCall = () => {
    setShowBooking(true);
  };

  const handleBookingConfirmed = (bookingData: any) => {
    setBookingDetails(bookingData);
    setBookingConfirmed(true);
    setShowBooking(false);
  };

  const handleChatWithUs = () => {
    // You can implement chat functionality here
    window.open('mailto:support@truenorthbusinessloan.com', '_blank');
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {!showBooking ? (
            <>
              {/* Hook Section */}
              <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-primary">
                  Excellent! Your profile is a strong match. Here's what you're pre-qualified for.
                </h1>
                
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    ${loanTerms.estimatedFunding.toLocaleString()}
                  </div>
                  <p className="text-xl text-muted-foreground">Estimated Eligible Funding</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="text-center space-y-2">
                    <Clock className="h-8 w-8 text-blue-500 mx-auto" />
                    <h3 className="font-semibold">Funding Speed</h3>
                    <p className="text-muted-foreground">{loanTerms.fundingSpeed}</p>
                  </div>
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-8 w-8 text-green-500 mx-auto" />
                    <h3 className="font-semibold">Est. Rate</h3>
                    <p className="text-muted-foreground">{loanTerms.estimatedRate}</p>
                  </div>
                  <div className="text-center space-y-2">
                    <DollarSign className="h-8 w-8 text-purple-500 mx-auto" />
                    <h3 className="font-semibold">Est. Payment</h3>
                    <p className="text-muted-foreground">{loanTerms.estimatedPayment}</p>
                  </div>
                </div>
              </div>

              {/* Curated Lender Matches */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center">
                  Based on your profile, here are your Top 3 matches from our network:
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topLenders.map((lender) => (
                    <Card key={lender.id} className="text-center">
                      <CardContent className="p-6 space-y-4">
                        <div className="h-16 flex items-center justify-center">
                          <img 
                            src={lender.logo} 
                            alt={`${lender.name} logo`}
                            className="max-h-12 max-w-full object-contain"
                          />
                        </div>
                        <h3 className="font-bold text-lg">{lender.name}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          Top Match ({lender.matchRating})
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {lender.tagline}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Call-to-Action Section */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-3xl text-center">
                    Unlock Your Official Offers in Under 48 Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Your application is ready. The final step is a quick 15-minute 'Pre-Offer Call' with a funding advisor. 
                    This call is required to get your official offers from the lenders above.
                  </p>

                  <div className="space-y-4 max-w-2xl mx-auto text-left">
                    <p className="font-medium">On this call, we will:</p>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Verify Your Details:</strong> A quick confirmation to ensure accuracy.</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Finalize Your Funding Needs:</strong> We'll confirm the numbers for your official offers.</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Outline Required Documents:</strong> We'll tell you exactly which simple documents to have ready (if any).</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      size="lg" 
                      onClick={handleBookCall}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white md:text-xl text-lg md:py-6 py-4 md:px-12 px-8 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Book My 15-Min Pre-Offer Call
                    </Button>
                    
                    <p className="text-sm text-muted-foreground">
                      Yes, this call is required to receive your official lender offers.
                    </p>
                    
                    <Button 
                      variant="link" 
                      onClick={handleChatWithUs}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Have a question before booking? Chat with us now.
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Booking Calendar Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBooking(false)}
                    className="mb-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Results
                  </Button>
                  <h1 className="text-3xl font-bold text-primary">
                    Schedule Your Pre-Offer Call
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Choose a convenient time for your 15-minute funding strategy call
                  </p>
                </div>

                <BookingCalendar 
                  onBookingConfirmed={handleBookingConfirmed}
                  userInfo={{
                    name,
                    email,
                    phone,
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