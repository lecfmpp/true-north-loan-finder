import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, TrendingUp, Users, DollarSign, Clock, Phone, MapPin, Building2 } from "lucide-react";
import { LeadsSimulation } from "@/components/LeadsSimulation";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import adminDashboardPreview from "@/assets/admin-dashboard-preview.jpg";
import { toast } from "sonner";

const BrokerSignup = () => {
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_responses')
          .select('id, name, company_name, email, loan_amount, monthly_revenue, country, city_province, created_at, score')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setRecentLeads(data || []);
      } catch (error) {
        console.error('Error fetching recent leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentLeads();
  }, []);

  const groupedLeads = recentLeads.reduce((acc, lead) => {
    const country = lead.country || 'Unknown';
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(lead);
    return acc;
  }, {} as Record<string, any[]>);

  // Get last 3 leads for each country
  const getTopLeadsPerCountry = () => {
    return Object.entries(groupedLeads).map(([country, leads]) => ({
      country,
      leads: (leads as any[]).slice(0, 3)
    }));
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handlePayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-broker-payment');
      
      if (error) throw error;
      
      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast.error('Failed to create payment session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Exclusive Broker Partnership Program - True North Business Loan"
        description="Join our exclusive broker network and receive pre-qualified business loan leads directly to your inbox. Quality leads that convert into funded deals."
        keywords={["broker partnership", "business loan leads", "qualified leads", "broker network", "funding leads"]}
      />
      
      <Header />

      {/* Hero Section */}
      <section className="relative py-6 md:py-12 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 md:mb-6 px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium bg-yellow-400 text-black">
              Exclusive Broker Partnership Program
            </Badge>
            
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold font-sans text-primary mb-3 md:mb-6 leading-tight">
              Access <span className="text-accent">High-Quality Leads</span> Every Single Day
            </h1>
            
            <p className="text-base md:text-xl lg:text-2xl text-muted-foreground mb-6 md:mb-8 font-serif max-w-3xl mx-auto">
              Join our exclusive broker network and receive pre-qualified business loan leads directly to your inbox. We focus on quality over quantity - delivering genuine opportunities that convert into funded deals.
            </p>
            
            <div className="mt-4 md:mt-8">
              <LeadsSimulation />
            </div>
          </div>
        </div>
      </section>

      {/* Our Target Audience */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Our Target Audience
            </h2>
            <h3 className="text-2xl font-semibold text-secondary mb-8">Business Owners Ready to Fund</h3>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto font-serif">
              Every day, hundreds of qualified business owners visit our platform seeking funding solutions. They're pre-screened, motivated, and waiting for same-day proposals.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-xl font-sans text-primary">Established Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 font-serif">Companies with 2+ years in operation, proven revenue streams, and immediate funding needs.</p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />Monthly revenue $50K+</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />Credit scores 550+</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />Active bank accounts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-xl font-sans text-primary">High-Intent Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 font-serif">Business owners who have completed our qualification process and are actively seeking funding.</p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />Completed loan application</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />Provided financial documents</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />Expect same-day response</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-xl font-sans text-primary">Diverse Funding Needs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 font-serif">Various loan amounts and purposes across multiple industries with urgent timing requirements.</p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />$25K - $500K+ loans</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />Working capital needs</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-2" />Equipment financing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Your Dashboard Preview
            </h2>
            <h3 className="text-2xl font-semibold text-secondary mb-8">See Exactly How You'll Receive Leads</h3>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto font-serif">
              Our intuitive dashboard provides all the information you need to evaluate and contact leads immediately. The faster you respond, the higher your conversion rate.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <Card className="border-0 shadow-[var(--shadow-card)] mb-12">
              <CardContent className="p-6">
                <img 
                  src={adminDashboardPreview} 
                  alt="Broker Dashboard Preview showing lead management interface" 
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center font-sans text-primary">
                    <Phone className="mr-2 h-6 w-6 text-secondary" />
                    Instant Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 font-serif">Every lead includes verified phone numbers and email addresses. Our "Call Lead" button connects you instantly.</p>
                  <Card className="bg-secondary/10 border-0">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-secondary">70%</div>
                      <div className="text-sm text-muted-foreground">higher conversion rates for brokers who contact leads within 5 minutes</div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center font-sans text-primary">
                    <Clock className="mr-2 h-6 w-6 text-secondary" />
                    Real-Time Lead Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 font-serif">Leads are delivered to your dashboard and email immediately when they complete our qualification process.</p>
                  <Card className="bg-secondary/10 border-0">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-secondary">Under 2 minutes</div>
                      <div className="text-sm text-muted-foreground">average lead age when delivered</div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Partnership Benefits
            </h2>
            <h3 className="text-2xl font-semibold text-secondary mb-8">Why Brokers Choose Our Platform</h3>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="font-sans text-primary">Pre-Qualified Leads Only</CardTitle>
                <p className="text-muted-foreground font-serif">Every lead has been verified and pre-screened for funding eligibility</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">95%</div>
                <div className="text-muted-foreground">qualification rate</div>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="font-sans text-primary">Exclusive Territory Rights</CardTitle>
                <p className="text-muted-foreground font-serif">Leads in your assigned territory are delivered only to you</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">Zero</div>
                <div className="text-muted-foreground">competition</div>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="font-sans text-primary">Complete Lead Information</CardTitle>
                <p className="text-muted-foreground font-serif">Business details, financial info, and contact data in every lead</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">100%</div>
                <div className="text-muted-foreground">complete profiles</div>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="font-sans text-primary">Same-Day Expectations</CardTitle>
                <p className="text-muted-foreground font-serif">Prospects expect immediate response, increasing urgency and closing rates</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">24-hour</div>
                <div className="text-muted-foreground">response window</div>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="font-sans text-primary">Multiple Lead Sources</CardTitle>
                <p className="text-muted-foreground font-serif">Leads from our website, partner networks, and marketing campaigns</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">500+</div>
                <div className="text-muted-foreground">leads monthly</div>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="font-sans text-primary">Performance Analytics</CardTitle>
                <p className="text-muted-foreground font-serif">Track your conversion rates, response times, and revenue generated</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">Real-time</div>
                <div className="text-muted-foreground">reporting</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Transparent Pricing */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-4">
              Transparent Pricing
            </h2>
            <h3 className="text-2xl font-semibold mb-8 opacity-90">Pay-Per-Lead Model</h3>
            <p className="text-xl opacity-90 mb-16 max-w-4xl mx-auto font-serif">
              We operate on a transparent pay-per-lead basis - no monthly fees, no commission splits, no hidden costs. You only pay for qualified leads that match your criteria.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto bg-background text-primary border-0 shadow-[var(--shadow-card)]">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-sans">Lead Pricing</CardTitle>
              <div className="text-4xl font-bold text-secondary">$80 - $150</div>
              <p className="text-muted-foreground font-serif">Per qualified lead, depending on loan amount, product type, and package selected.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-3" />Complete borrower information</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-3" />Financial documentation provided</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-3" />Pre-screened for qualification</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-3" />Expecting immediate response</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quality Guarantee */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Quality Guarantee
              </h2>
              <h3 className="text-2xl font-semibold text-secondary mb-8">No Bad Leads Promise</h3>
              <p className="text-xl text-muted-foreground mb-12 font-serif">
                We don't sell poor-quality leads or spam. Every lead is manually verified and meets our strict qualification standards.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-3" />Manual verification process</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-3" />Credit and income pre-qualified</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-3" />Real contact information</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-secondary mr-3" />Replacement guarantee</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-0 shadow-[var(--shadow-card)]">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4 font-sans text-primary">Long-Term Partnership Approach</h4>
                  <p className="text-muted-foreground font-serif">
                    We're not interested in quick transactions. Our goal is to build lasting partnerships where brokers consistently receive high-quality leads that convert into funded deals. Your success is our success.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary mb-2">95%+</div>
                <div className="text-muted-foreground">Lead Quality Score</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary mb-2">24hr</div>
                <div className="text-muted-foreground">Response Window</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary mb-2">3+ yrs</div>
                <div className="text-muted-foreground">Average Partnership</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Recent Qualified Leads */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Recent Qualified Leads
            </h2>
            <h3 className="text-2xl font-semibold text-secondary mb-8">See What You're Missing</h3>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto font-serif">
              These are real, qualified leads from the past week. Each one represents a potential deal that could be yours as a partner.
            </p>
          </div>

          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading recent leads...</p>
            </div>
          ) : (
            <div className="space-y-8 max-w-6xl mx-auto">
              {getTopLeadsPerCountry().map(({ country, leads }) => (
                <div key={country} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-secondary" />
                    <h4 className="text-xl font-semibold text-primary">{country} - Last 3 Leads</h4>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {leads.map((lead, index) => (
                      <Card key={lead.id} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {getTimeAgo(lead.created_at)}
                              </Badge>
                              <Badge variant={lead.score >= 85 ? "default" : lead.score >= 70 ? "secondary" : "outline"} className="text-xs">
                                {lead.score}/100
                              </Badge>
                            </div>
                            
                            <div>
                              <h5 className="font-semibold text-primary">{lead.name}</h5>
                              {lead.company_name && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  {lead.company_name}
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {lead.city_province}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Loan Amount:</span>
                                <span className="font-semibold text-primary">{formatAmount(lead.loan_amount)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Monthly Revenue:</span>
                                <span className="font-semibold text-secondary">{formatAmount(lead.monthly_revenue)}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                ✓ Pre-qualified & verified
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="text-sm">
                          Show me more qualified leads from {country}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Exclusive Trial Access - $500</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-muted-foreground">
                            Get exclusive access to all qualified leads from {country} with our trial partnership program.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-secondary" />
                              <span className="text-sm">7-day trial period</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-secondary" />
                              <span className="text-sm">Unlimited leads in your territory</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-secondary" />
                              <span className="text-sm">Complete lead profiles & documents</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-secondary" />
                              <span className="text-sm">Instant email & dashboard access</span>
                            </div>
                          </div>
                          <Button size="lg" className="w-full" onClick={handlePayment}>
                            Start Trial for $500
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            Pay-per-lead pricing starts after trial period
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-6">
            Ready to Scale Your Brokerage?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto font-serif">
            Join successful brokers who are already receiving high-quality leads daily and increasing their funding volume by 300% or more.
          </p>
          <Button size="xl" variant="secondary" className="text-lg px-8" onClick={handlePayment}>
            Get Started Today
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrokerSignup;