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
        title="Partner with True North - Buy Qualified Business Loan Leads"
        description="Join our broker network and access high-quality, pre-qualified business loan leads. Exclusive territory protection, real-time lead delivery, and proven ROI."
        keywords={["business loan leads", "broker partnership", "qualified leads", "lead generation", "business financing broker"]}
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary to-primary-dark text-white py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl font-bold mb-6 leading-tight">
                  Want More 
                  <span className="text-accent"> Qualified Customers?</span>
                </h1>
                <p className="text-xl mb-8 text-blue-100">
                  Join our exclusive broker network and receive hot, pre-qualified business loan leads delivered directly to your inbox. No more cold calling - just ready-to-close prospects.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button size="lg" className="bg-accent hover:bg-accent-dark text-primary font-semibold">
                    Start Getting Leads Today
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                    <Phone className="mr-2 h-5 w-5" />
                    Call (647) 749-7334
                  </Button>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">See Our Lead Management Dashboard</h3>
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <img 
                    src={adminDashboardPreview} 
                    alt="Admin Dashboard Preview" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-sm text-blue-100">Real-time tracking of all your leads with detailed analytics and conversion metrics</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">94.6%</div>
                <div className="text-gray-600">Lead Quality Score</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">15-20K</div>
                <div className="text-gray-600">Average Loan Size</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">85%</div>
                <div className="text-gray-600">Pre-Qualified Rate</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">24hr</div>
                <div className="text-gray-600">Lead Delivery Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="bg-destructive py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl font-bold mb-8">
                ARE YOUR BROKERS EXPERIENCING ONE OF THESE?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-white flex-shrink-0" />
                  <span>Spending too much time prospecting instead of closing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-white flex-shrink-0" />
                  <span>Difficulty finding qualified small business owners</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-white flex-shrink-0" />
                  <span>Inconsistent monthly revenue streams</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-white flex-shrink-0" />
                  <span>Competition stealing your potential clients</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-primary text-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">HOW DOES IT WORK?</h2>
            
            <div className="grid lg:grid-cols-4 gap-8">
              <Card className="bg-white text-primary">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Access High Quality Leads On-Demand</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Our advanced qualification system ensures every lead meets your specific criteria for loan amount, business revenue, and creditworthiness.</p>
                  <Button className="w-full mt-4 bg-accent hover:bg-accent-dark">
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white text-primary">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Digital Footprint For Your Agents And Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Track performance, monitor lead quality, and get detailed analytics on your team's conversion rates and revenue generation.</p>
                  <Button className="w-full mt-4 bg-accent hover:bg-accent-dark">
                    View Demo
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white text-primary">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Maximize Sales And Increase % Of Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Our satisfied clients become your best referral source, creating a compound growth effect for your business.</p>
                  <Button className="w-full mt-4 bg-accent hover:bg-accent-dark">
                    Learn More
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white text-primary">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>GENERATE POTENTIAL REVENUE 24/7 For Your Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Our system works around the clock to capture and qualify leads, ensuring you never miss a potential opportunity.</p>
                  <Button className="w-full mt-4 bg-accent hover:bg-accent-dark">
                    Start Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Options */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">WHAT ARE MY OPTIONS?</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">QUALIFIED LEADS</CardTitle>
                  <p className="text-center text-gray-600">Perfect for established brokers</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">$89</div>
                    <div className="text-gray-600">per qualified lead</div>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Pre-qualified prospects</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Verified contact information</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Loan amount confirmed</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />24-hour delivery guarantee</li>
                  </ul>
                  <Button className="w-full bg-primary hover:bg-primary-dark">
                    Choose This Plan
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-accent bg-accent/5">
                <CardHeader>
                  <Badge className="mx-auto mb-2 bg-accent">MOST POPULAR</Badge>
                  <CardTitle className="text-2xl text-center">TAKE IT IN-HOUSE</CardTitle>
                  <p className="text-center text-gray-600">Complete lead generation solution</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-accent">Custom</div>
                    <div className="text-gray-600">pricing available</div>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />White-label lead generation system</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Your brand, your leads</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Complete training & support</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Unlimited lead capacity</li>
                  </ul>
                  <Button className="w-full bg-accent hover:bg-accent-dark text-white">
                    Get Custom Quote
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">WILL THIS WORK FOR YOUR COMPANY?</h2>
            
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-3 gap-8 text-center mb-8">
                    <div>
                      <div className="text-3xl font-bold text-primary mb-2">250+</div>
                      <div className="text-gray-600">Active Broker Partners</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-accent mb-2">$50M+</div>
                      <div className="text-gray-600">Loans Funded Through Our Network</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary mb-2">4.8★</div>
                      <div className="text-gray-600">Average Partner Rating</div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">ROI Calculator</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>Average lead cost: $89</div>
                      <div>Average conversion rate: 15%</div>
                      <div>Average commission: $3,500</div>
                      <div className="font-bold text-accent">ROI: 489%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Unique Selling Points */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">WHAT MAKES US UNIQUE?</h2>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Exclusive Territory Protection</h3>
                      <p className="text-blue-100">We guarantee you won't compete with other brokers in your designated area.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Real-Time Lead Delivery</h3>
                      <p className="text-blue-100">Leads are delivered within 5 minutes of qualification, giving you first-mover advantage.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Advanced Qualification Process</h3>
                      <p className="text-blue-100">Multi-step verification ensures every lead meets your exact criteria before delivery.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Card className="bg-white text-primary">
                  <CardHeader>
                    <CardTitle>Start Your Partnership Application</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Your Name"
                          value={formData.applicant_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, applicant_name: e.target.value }))}
                          required
                        />
                        <Input
                          type="email"
                          placeholder="Email Address"
                          value={formData.applicant_email}
                          onChange={(e) => setFormData(prev => ({ ...prev, applicant_email: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          type="tel"
                          placeholder="Phone Number"
                          value={formData.applicant_phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, applicant_phone: e.target.value }))}
                        />
                        <Input
                          placeholder="Company Name"
                          value={formData.company_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <Input
                        placeholder="Company Website"
                        value={formData.company_website}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
                      />
                      
                      <Select value={formData.years_of_experience} onValueChange={(value) => setFormData(prev => ({ ...prev, years_of_experience: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Years of Experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1-2 years</SelectItem>
                          <SelectItem value="3">3-5 years</SelectItem>
                          <SelectItem value="6">6-10 years</SelectItem>
                          <SelectItem value="10">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Textarea
                        placeholder="Tell us about your business and what types of leads you're looking for..."
                        value={formData.business_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, business_description: e.target.value }))}
                        rows={3}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-accent hover:bg-accent-dark text-white" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Apply Now"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">FREQUENTLY ASKED QUESTIONS</h2>
            
            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How quickly will I start receiving leads?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Once approved, you'll start receiving leads within 24-48 hours. Our system operates 24/7 to capture and qualify prospects.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>What makes your leads different from other providers?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Our leads go through a comprehensive 7-step qualification process including credit verification, revenue confirmation, and intent validation. We only deliver leads that are ready to move forward.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Do you offer territory protection?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Yes, we provide exclusive territory protection for our premium partners. This ensures you won't compete with other brokers in your designated area.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>What's included in the white-label solution?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Our white-label solution includes the complete lead generation system, landing pages, qualification process, CRM integration, and ongoing support - all under your brand.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-accent text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
            <p className="text-xl mb-8 text-red-100">Join hundreds of successful brokers who are already growing their revenue with our qualified leads.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-accent hover:bg-gray-100">
                Apply for Partnership
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-accent">
                <Phone className="mr-2 h-5 w-5" />
                Call Now: (647) 749-7334
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BrokerSignup;