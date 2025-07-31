import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, Users, DollarSign, Clock, Phone, Mail, ArrowRight, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import adminDashboardPreview from "@/assets/admin-dashboard-preview.jpg";

const BrokerSignup = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicant_name: "",
    applicant_email: "",
    applicant_phone: "",
    company_name: "",
    company_website: "",
    years_of_experience: "",
    business_description: "",
    min_monthly_revenue: "",
    max_monthly_revenue: "",
    min_loan_amount: "",
    max_loan_amount: "",
    geographic_areas: [] as string[],
    additional_requirements: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('lender_broker_applications')
        .insert({
          ...formData,
          application_type: 'broker',
          years_of_experience: parseInt(formData.years_of_experience) || null
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll contact you within 24 hours to discuss your partnership.",
      });

      // Reset form
      setFormData({
        applicant_name: "",
        applicant_email: "",
        applicant_phone: "",
        company_name: "",
        company_website: "",
        years_of_experience: "",
        business_description: "",
        min_monthly_revenue: "",
        max_monthly_revenue: "",
        min_loan_amount: "",
        max_loan_amount: "",
        geographic_areas: [],
        additional_requirements: ""
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeographicAreaChange = (area: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      geographic_areas: checked 
        ? [...prev.geographic_areas, area]
        : prev.geographic_areas.filter(a => a !== area)
    }));
  };

  return (
    <>
      <SEOHead 
        title="Exclusive Broker Partnership Program - National Property Lenders"
        description="Join our exclusive broker network and receive pre-qualified business loan leads directly to your inbox. Quality leads that convert into funded deals."
        keywords={["broker partnership", "business loan leads", "qualified leads", "broker network", "funding leads"]}
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary to-primary-dark text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Exclusive Broker Partnership Program
              </h1>
              <h2 className="text-3xl font-semibold mb-8 text-accent">
                Access High-Quality Leads<br />
                Every Single Day
              </h2>
              <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
                Join our exclusive broker network and receive pre-qualified business loan leads directly to your inbox. We focus on quality over quantity - delivering genuine opportunities that convert into funded deals. Our platform builds long-term partnerships that create win-win relationships for all parties involved.
              </p>
              <Button size="lg" className="bg-accent hover:bg-accent-dark text-primary font-semibold">
                Start Receiving Leads Today
              </Button>
            </div>
          </div>
        </section>

        {/* Our Target Audience */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">Our Target Audience</h2>
            <h3 className="text-2xl font-semibold text-center text-primary mb-16">Business Owners Ready to Fund</h3>
            <p className="text-xl text-center text-gray-600 mb-16 max-w-4xl mx-auto">
              Every day, hundreds of qualified business owners visit our platform seeking funding solutions. They're pre-screened, motivated, and waiting for same-day proposals.
            </p>

            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Established Businesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Companies with 2+ years in operation, proven revenue streams, and immediate funding needs.</p>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Monthly revenue $50K+</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Credit scores 550+</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Active bank accounts</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">High-Intent Prospects</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Business owners who have completed our qualification process and are actively seeking funding.</p>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Completed loan application</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Provided financial documents</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Expect same-day response</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Diverse Funding Needs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Various loan amounts and purposes across multiple industries with urgent timing requirements.</p>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />$25K - $500K+ loans</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Working capital needs</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Equipment financing</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-4">Your Dashboard Preview</h2>
              <h3 className="text-2xl font-semibold text-center text-primary mb-8">See Exactly How You'll Receive Leads</h3>
              <p className="text-xl text-center text-gray-600 mb-12 max-w-4xl mx-auto">
                Our intuitive dashboard provides all the information you need to evaluate and contact leads immediately. The faster you respond, the higher your conversion rate.
              </p>

              <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
                <img 
                  src={adminDashboardPreview} 
                  alt="Broker Dashboard Preview showing lead management interface" 
                  className="w-full rounded-lg"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="mr-2 h-6 w-6 text-primary" />
                      Instant Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Every lead includes verified phone numbers and email addresses. Our "Call Lead" button connects you instantly.</p>
                    <div className="bg-primary/10 rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary">70%</div>
                      <div className="text-sm text-gray-600">higher conversion rates for brokers who contact leads within 5 minutes</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-6 w-6 text-accent" />
                      Real-Time Lead Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Leads are delivered to your dashboard and email immediately when they complete our qualification process.</p>
                    <div className="bg-accent/10 rounded-lg p-4">
                      <div className="text-2xl font-bold text-accent">Under 2 minutes</div>
                      <div className="text-sm text-gray-600">average lead age when delivered</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Partnership Benefits */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">Partnership Benefits</h2>
            <h3 className="text-2xl font-semibold text-center text-primary mb-16">Why Brokers Choose Our Platform</h3>

            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Pre-Qualified Leads Only</CardTitle>
                  <p className="text-gray-600">Every lead has been verified and pre-screened for funding eligibility</p>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">95%</div>
                  <div className="text-gray-600">qualification rate</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Exclusive Territory Rights</CardTitle>
                  <p className="text-gray-600">Leads in your assigned territory are delivered only to you</p>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-2">Zero</div>
                  <div className="text-gray-600">competition</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Complete Lead Information</CardTitle>
                  <p className="text-gray-600">Business details, financial info, and contact data in every lead</p>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">100%</div>
                  <div className="text-gray-600">complete profiles</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Same-Day Expectations</CardTitle>
                  <p className="text-gray-600">Prospects expect immediate response, increasing urgency and closing rates</p>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-2">24-hour</div>
                  <div className="text-gray-600">response window</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Multiple Lead Sources</CardTitle>
                  <p className="text-gray-600">Leads from our website, partner networks, and marketing campaigns</p>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">500+</div>
                  <div className="text-gray-600">leads monthly</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <p className="text-gray-600">Track your conversion rates, response times, and revenue generated</p>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-2">Real-time</div>
                  <div className="text-gray-600">reporting</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Transparent Pricing */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">Transparent Pricing</h2>
            <h3 className="text-2xl font-semibold text-center mb-8">Pay-Per-Lead Model</h3>
            <p className="text-xl text-center text-blue-100 mb-16 max-w-4xl mx-auto">
              We operate on a transparent pay-per-lead basis - no monthly fees, no commission splits, no hidden costs. You only pay for qualified leads that match your criteria.
            </p>

            <Card className="max-w-2xl mx-auto bg-white text-primary">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Lead Pricing</CardTitle>
                <div className="text-4xl font-bold text-accent">$80 - $150</div>
                <p className="text-gray-600">Per qualified lead, depending on loan amount, product type, and package selected.</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Complete borrower information</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Financial documentation provided</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Pre-screened for qualification</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Expecting immediate response</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quality Guarantee */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">Quality Guarantee</h2>
              <h3 className="text-2xl font-semibold text-primary mb-8">No Bad Leads Promise</h3>
              <p className="text-xl text-gray-600 mb-12">
                We don't sell poor-quality leads or spam. Every lead is manually verified and meets our strict qualification standards.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardContent className="p-6">
                    <ul className="space-y-3">
                      <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Manual verification process</li>
                      <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Credit and income pre-qualified</li>
                      <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Real contact information</li>
                      <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Replacement guarantee</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-primary text-white">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4">Long-Term Partnership Approach</h4>
                    <p className="text-blue-100">
                      We're not interested in quick transactions. Our goal is to build lasting partnerships where brokers consistently receive high-quality leads that convert into funded deals. Your success is our success, and we work together to optimize lead quality and conversion rates over time.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">95%+</div>
                  <div className="text-gray-600">Lead Quality Score</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-accent mb-2">24hr</div>
                  <div className="text-gray-600">Response Window</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">3+ yrs</div>
                  <div className="text-gray-600">Average Partnership</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Apply Now</h2>
                <h3 className="text-2xl font-semibold text-primary mb-8">Become an Approved Partner Today</h3>
                <p className="text-xl text-gray-600">
                  Submit your application below. Our team will review and approve qualified brokers within 24 hours. Once approved, you'll receive onboarding materials and start receiving leads immediately.
                </p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                      <Input
                        placeholder="Your full name"
                        value={formData.applicant_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, applicant_name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.applicant_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, applicant_email: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.applicant_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, applicant_phone: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                      <Input
                        placeholder="Your brokerage name"
                        value={formData.company_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <Input
                        placeholder="www.yourcompany.com"
                        value={formData.company_website}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years in Business</label>
                      <Select value={formData.years_of_experience} onValueChange={(value) => setFormData(prev => ({ ...prev, years_of_experience: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Number of years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 year</SelectItem>
                          <SelectItem value="2">2 years</SelectItem>
                          <SelectItem value="3">3-5 years</SelectItem>
                          <SelectItem value="6">6-10 years</SelectItem>
                          <SelectItem value="10">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary-dark text-white" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Partner Application"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* What Happens Next */}
              <div className="mt-16 text-center">
                <h3 className="text-2xl font-semibold mb-8">What Happens Next?</h3>
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                    <p className="text-gray-600">Our team reviews your application within 24 hours</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                    <p className="text-gray-600">Approved brokers receive welcome packet and agreement</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                    <p className="text-gray-600">Dashboard access and training materials provided</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                    <p className="text-gray-600">Start receiving high-quality leads immediately</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-accent text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">Ready to Scale Your Brokerage?</h2>
            <p className="text-xl mb-8 text-red-100 max-w-3xl mx-auto">
              Join successful brokers who are already receiving high-quality leads daily and increasing their funding volume by 300% or more.
            </p>
            <Button size="lg" className="bg-white text-accent hover:bg-gray-100">
              Get Started Today
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default BrokerSignup;