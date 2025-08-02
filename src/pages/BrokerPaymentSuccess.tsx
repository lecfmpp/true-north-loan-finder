import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BrokerPaymentSuccess = () => {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    phone: ''
  });
  const navigate = useNavigate();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsCreatingAccount(true);

    try {
      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            phone: formData.phone
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create broker application record
        const { error: applicationError } = await supabase
          .from('lender_broker_applications')
          .insert({
            user_id: data.user.id,
            applicant_name: formData.fullName,
            applicant_email: formData.email,
            applicant_phone: formData.phone,
            company_name: formData.companyName,
            application_type: 'broker',
            status: 'approved', // Auto-approve since they paid
            payment_status: 'completed',
            payment_amount: 50000 // $500 in cents
          });

        if (applicationError) {
          console.error('Error creating application:', applicationError);
          // Don't throw error, account creation was successful
        }

        setAccountCreated(true);
        toast.success("Account created successfully! Please check your email to verify your account.");
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      if (error.message.includes('already registered')) {
        toast.error("An account with this email already exists. Please use the login option instead.");
      } else {
        toast.error("Failed to create account. Please try again or contact support.");
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

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

            {!accountCreated ? (
              <Card className="border-0 shadow-[var(--shadow-card)] mb-8 text-left">
                <CardHeader>
                  <CardTitle className="text-center font-sans text-primary">Create Your Broker Account</CardTitle>
                  <p className="text-center text-muted-foreground">Complete your account setup to access your dashboard</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          required
                          placeholder="Your company name"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          placeholder="Minimum 6 characters"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isCreatingAccount}
                    >
                      {isCreatingAccount ? "Creating Account..." : "Create Account & Access Dashboard"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
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
                      <h4 className="font-semibold text-primary">Email Verification</h4>
                      <p className="text-muted-foreground text-sm">Check your email and click the verification link to activate your account.</p>
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
            )}

            <div className="space-y-4">
              {accountCreated && (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/auth">
                    Login to Your Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              
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