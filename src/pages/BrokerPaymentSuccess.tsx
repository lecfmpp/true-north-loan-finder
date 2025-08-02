import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BrokerPaymentSuccess = () => {
  useEffect(() => {
    // Track payment success event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: new URLSearchParams(window.location.search).get('session_id'),
        value: 500,
        currency: 'USD',
        items: [{
          item_id: 'broker_trial',
          item_name: 'Broker Trial Access',
          category: 'Partnership',
          price: 500,
          quantity: 1
        }]
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Payment Successful - Broker Partnership - True North Business Loan"
        description="Your payment has been processed successfully. Welcome to our exclusive broker partnership program."
        keywords={["payment success", "broker partnership", "trial access"]}
      />
      
      <Header />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Payment Successful!
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 font-serif">
              Welcome to our exclusive broker partnership program. Your trial access is now active.
            </p>

            <Card className="border-0 shadow-[var(--shadow-card)] mb-8">
              <CardHeader>
                <CardTitle className="text-left font-sans text-primary">What happens next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-medium text-secondary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Account Setup</h4>
                    <p className="text-muted-foreground text-sm">Our team will contact you within 24 hours to set up your broker dashboard and provide login credentials.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-medium text-secondary">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Territory Assignment</h4>
                    <p className="text-muted-foreground text-sm">We'll assign your exclusive territory and begin delivering qualified leads immediately.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-medium text-secondary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Lead Delivery Starts</h4>
                    <p className="text-muted-foreground text-sm">Your 7-day trial begins with unlimited access to qualified leads in your territory.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/auth">
                  Access Your Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Questions? Contact us at{" "}
                <a href="mailto:partnerships@truenorthbusinessloan.ca" className="text-secondary hover:underline">
                  partnerships@truenorthbusinessloan.ca
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrokerPaymentSuccess;