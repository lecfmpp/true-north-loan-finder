import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MerchantGrowthRedirect = () => {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  
  const name = searchParams.get('name') || '';
  const loanAmount = searchParams.get('amount') || '';
  
  const merchantGrowthUrl = "https://new.merchantgrowth.com/welcome?userId=005JR00000AAmFJYA1";

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect to Merchant Growth
          window.location.href = merchantGrowthUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          
          {/* Success Icon */}
          <div className="space-y-4">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            <h1 className="text-4xl font-bold text-primary">
              Great News, {name}!
            </h1>
          </div>

          {/* Main Message Card */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-foreground">
                You're Being Connected to Our Partner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center space-x-4 p-6 bg-white rounded-lg border">
                <img 
                  src="/lovable-uploads/77b173e0-4da2-4b65-a106-fddb77e38ed9.png" 
                  alt="Merchant Growth Logo" 
                  className="h-12 w-auto"
                />
                <ArrowRight className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <h3 className="font-bold text-lg">Merchant Growth</h3>
                  <p className="text-sm text-muted-foreground">Premium Funding Partner</p>
                </div>
              </div>
              
              <div className="space-y-4 text-left max-w-2xl mx-auto">
                <p className="text-lg text-muted-foreground">
                  Based on your business profile and funding needs of <strong>${parseInt(loanAmount).toLocaleString()}</strong>, 
                  you're an excellent match for <strong>Merchant Growth</strong> - one of our premium lending partners.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Why Merchant Growth is perfect for you:</h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Specialized in fast funding for Canadian businesses</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Higher approval rates for your business profile</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>More competitive rates and flexible terms</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Faster processing and decision times</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Countdown */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3">
                <Clock className="h-6 w-6 animate-spin" />
                <span className="text-lg">
                  Redirecting you to Merchant Growth in <strong>{countdown}</strong> seconds...
                </span>
              </div>
              <p className="text-sm mt-2 opacity-90">
                You'll be taken to their secure application portal
              </p>
            </CardContent>
          </Card>

          {/* Manual redirect option */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Not redirecting automatically?
            </p>
            <a 
              href={merchantGrowthUrl}
              className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <span>Continue to Merchant Growth</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default MerchantGrowthRedirect;