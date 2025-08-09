import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { CheckCircle, TrendingUp, Users, DollarSign, Clock, Phone, MapPin, Building2, Info } from "lucide-react";
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
  
  // ROI Calculator state
  const [avgCommission, setAvgCommission] = useState<number | ''>('');
  const [costPerLead, setCostPerLead] = useState<number | ''>('');
  const [conversionRate, setConversionRate] = useState<number | ''>('');
  const [selectedPackage, setSelectedPackage] = useState(100); // Default to 100 leads
  
  // Package options with pricing (15% discount progression)
  const packages = [
    { leads: 50, name: "Starter", description: "Perfect for testing", costPerLead: 70 },
    { leads: 100, name: "Professional", description: "Most popular choice", costPerLead: 60 }, // 15% discount
    { leads: 200, name: "Enterprise", description: "Maximum volume", costPerLead: 51 } // 15% discount from previous
  ];
  
  // Calculate ROI values - convert empty strings to 0 for calculations
  const avgCommNum = typeof avgCommission === 'number' ? avgCommission : 0;
  const costPerLeadNum = typeof costPerLead === 'number' ? costPerLead : 0;
  const conversionRateNum = typeof conversionRate === 'number' ? conversionRate : 0;
  
  const totalMonthlySpend = selectedPackage * costPerLeadNum;
  const totalMonthlyDeals = selectedPackage * (conversionRateNum / 100);
  const totalMonthlyCommission = totalMonthlyDeals * avgCommNum;
  const monthlyProfit = totalMonthlyCommission - totalMonthlySpend;
  const calculatedROI = totalMonthlySpend > 0 ? Math.round((monthlyProfit / totalMonthlySpend) * 100) : 0;

  // Auto-fill cost per lead when package is selected
  useEffect(() => {
    const selectedPkg = packages.find(pkg => pkg.leads === selectedPackage);
    if (selectedPkg) {
      setCostPerLead(selectedPkg.costPerLead);
    }
  }, [selectedPackage]);

  useEffect(() => {
    const fetchRecentLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_responses')
          .select('id, name, company_name, email, loan_amount, monthly_revenue, country, city_province, created_at, score')
          .order('created_at', { ascending: false })
          .limit(10); // Get more leads to show variety

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

  const formatCurrency = (value: number | string) => {
    if (value === '' || value === 0) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US').format(num);
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/,/g, '')) || 0;
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

  // Form state for broker application
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    companyName: '',
    companyWebsite: '',
    yearsOfExperience: '',
    licenseNumber: '',
    businessDescription: '',
    preferredIndustries: [] as string[],
    minMonthlyRevenue: '',
    maxMonthlyRevenue: '',
    minTimeInBusiness: '',
    minCreditScore: '',
    minLoanAmount: '',
    maxLoanAmount: '',
    geographicAreas: [] as string[],
    additionalRequirements: ''
  });
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get URL parameters for tracking
      const urlParams = new URLSearchParams(window.location.search);
      const trackingData = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_term: urlParams.get('utm_term'),
        utm_content: urlParams.get('utm_content'),
        ref: urlParams.get('ref'),
        gclid: urlParams.get('gclid'),
        fbclid: urlParams.get('fbclid')
      };

      // Generate unique tracking ID
      const trackingId = `broker_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Track form completion event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'broker_form_completed', {
          event_category: 'broker_signup',
          tracking_id: trackingId,
          utm_source: trackingData.utm_source,
          utm_medium: trackingData.utm_medium,
          utm_campaign: trackingData.utm_campaign
        });
      }

      // Create client application - all submissions are added regardless of payment status
      const { data: applicationData, error: applicationError } = await supabase
        .from('lender_broker_applications')
        .insert({
          applicant_name: formData.applicantName,
          applicant_email: formData.applicantEmail,
          applicant_phone: formData.applicantPhone,
          company_name: formData.companyName,
          company_website: formData.companyWebsite,
          application_type: 'client', // All broker signup users are clients
          years_of_experience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
          license_number: formData.licenseNumber,
          business_description: formData.businessDescription,
          preferred_industries: formData.preferredIndustries,
          min_monthly_revenue: formData.minMonthlyRevenue,
          max_monthly_revenue: formData.maxMonthlyRevenue,
          min_time_in_business: formData.minTimeInBusiness,
          min_credit_score: formData.minCreditScore,
          min_loan_amount: formData.minLoanAmount,
          max_loan_amount: formData.maxLoanAmount,
          geographic_areas: formData.geographicAreas,
          additional_requirements: formData.additionalRequirements,
          status: 'pending_payment', // Default status for new submissions
          payment_status: 'pending',
          admin_notes: `Tracking ID: ${trackingId}, UTM: ${JSON.stringify(trackingData)}`
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      // Track payment initiation event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'begin_checkout', {
          event_category: 'broker_signup',
          tracking_id: trackingId,
          value: 500,
          currency: 'USD'
        });
      }

      // Call edge function to create Stripe session
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-broker-payment', {
        body: { 
          applicationId: applicationData.id,
          trackingId: trackingId,
          utmParams: trackingData
        }
      });

      if (paymentError) throw paymentError;

      // Open Stripe checkout in new tab
      window.open(paymentData.url, '_blank');

      toast.success('Redirecting to payment...');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = () => {
    setShowForm(true);
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
              
              {/* Broker Application Form Modal */}
              {showForm && (
                <Dialog open={showForm} onOpenChange={setShowForm}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Complete Your Broker Application</DialogTitle>
                      <p className="text-muted-foreground">Fill out the form below to proceed to payment and start receiving leads.</p>
                    </DialogHeader>
                    
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="applicantName">Full Name *</Label>
                          <input
                            id="applicantName"
                            name="applicantName"
                            value={formData.applicantName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="applicantEmail">Email Address *</Label>
                          <input
                            id="applicantEmail"
                            name="applicantEmail"
                            type="email"
                            value={formData.applicantEmail}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="applicantPhone">Phone Number *</Label>
                          <input
                            id="applicantPhone"
                            name="applicantPhone"
                            type="tel"
                            value={formData.applicantPhone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="companyName">Company Name *</Label>
                          <input
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Your company name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="companyWebsite">Company Website</Label>
                          <input
                            id="companyWebsite"
                            name="companyWebsite"
                            type="url"
                            value={formData.companyWebsite}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="https://yourcompany.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                          <input
                            id="yearsOfExperience"
                            name="yearsOfExperience"
                            type="number"
                            value={formData.yearsOfExperience}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="5"
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Business Description */}
                      <div>
                        <Label htmlFor="businessDescription">Business Description</Label>
                        <textarea
                          id="businessDescription"
                          name="businessDescription"
                          value={formData.businessDescription}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="Describe your business and experience in commercial lending..."
                        />
                      </div>

                      {/* Lead Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minLoanAmount">Minimum Loan Amount</Label>
                          <input
                            id="minLoanAmount"
                            name="minLoanAmount"
                            value={formData.minLoanAmount}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="$50,000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxLoanAmount">Maximum Loan Amount</Label>
                          <input
                            id="maxLoanAmount"
                            name="maxLoanAmount"
                            value={formData.maxLoanAmount}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="$500,000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="minMonthlyRevenue">Minimum Monthly Revenue</Label>
                          <input
                            id="minMonthlyRevenue"
                            name="minMonthlyRevenue"
                            value={formData.minMonthlyRevenue}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="$50,000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="minCreditScore">Minimum Credit Score</Label>
                          <input
                            id="minCreditScore"
                            name="minCreditScore"
                            value={formData.minCreditScore}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="600"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          {isSubmitting ? 'Processing...' : 'Proceed to Payment ($500)'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
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
              <CardTitle className="text-2xl font-sans">ROI Calculator for Brokers</CardTitle>
              <p className="text-muted-foreground font-serif">Calculate your potential monthly return on investment</p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Step 1: Package Selection */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-primary text-center">Step 1: Choose Your Lead Package</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <Card 
                      key={pkg.leads}
                      className={`cursor-pointer border-2 transition-all duration-300 hover:shadow-lg ${
                        selectedPackage === pkg.leads 
                          ? 'border-secondary bg-secondary/10' 
                          : 'border-border hover:border-secondary/50'
                      }`}
                      onClick={() => setSelectedPackage(pkg.leads)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-secondary mb-1">{pkg.leads} leads</div>
                        <div className="text-sm font-medium text-primary mb-1">{pkg.name}</div>
                        <div className="text-lg font-bold text-green-600 mb-1">${pkg.costPerLead}/lead</div>
                        <div className="text-xs text-muted-foreground mb-2">{pkg.description}</div>
                        {pkg.leads === 100 && (
                          <Badge variant="secondary" className="mt-1 text-xs">Most Popular</Badge>
                        )}
                        {pkg.leads === 200 && (
                          <Badge variant="outline" className="mt-1 text-xs text-green-600 border-green-600">Best Value</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Step 2: Financial Inputs */}
              <TooltipProvider>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-primary text-center">Step 2: Enter Your Financial Details</h4>
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-primary">
                        Average Commission Per Deal ($)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The average amount you earn in commission when you successfully close a business loan deal</p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-border rounded-md bg-background"
                        placeholder="5,000"
                        value={formatCurrency(avgCommission)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          setAvgCommission(value === '' ? '' : parseCurrency(e.target.value));
                        }}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-primary">
                        Cost Per Lead ($)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">How much you pay for each qualified lead. This is automatically filled based on your selected package</p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-border rounded-md bg-background"
                        placeholder="70"
                        value={formatCurrency(costPerLead)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          setCostPerLead(value === '' ? '' : parseCurrency(e.target.value));
                        }}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-primary">
                        Sales Conversion Rate (%)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">What percentage of leads you typically convert into funded deals. Industry average is 10-20%</p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-border rounded-md bg-background"
                        placeholder="15"
                        value={conversionRate === '' ? '' : conversionRate.toString()}
                        onChange={(e) => {
                          const value = e.target.value;
                          setConversionRate(value === '' ? '' : Number(value) || 0);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TooltipProvider>
              
              {/* Step 3: Results */}
              {(avgCommNum > 0 && costPerLeadNum > 0 && conversionRateNum > 0) && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-primary text-center">Step 3: Your Monthly Profit Projection</h4>
                  <div className="mt-8 p-4 sm:p-6 bg-gradient-to-br from-secondary/10 via-background to-secondary/20 rounded-xl border-2 border-secondary/30">
                    <div className="text-center space-y-4">
                      <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Monthly Profit Calculation</div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                        <div className="text-center">
                          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Monthly Lead Cost</div>
                          <div className="text-xl sm:text-2xl font-bold text-red-600">-${totalMonthlySpend.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{selectedPackage} leads × ${costPerLeadNum}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Monthly Commission</div>
                          <div className="text-xl sm:text-2xl font-bold text-green-600">+${totalMonthlyCommission.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{totalMonthlyDeals.toFixed(1)} deals × ${avgCommNum.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="text-base sm:text-lg text-muted-foreground mb-2">Your Monthly Extra Income</div>
                        <div className="text-4xl sm:text-5xl lg:text-7xl font-black text-secondary mb-2">
                          ${monthlyProfit.toLocaleString()}
                        </div>
                        <div className="text-base sm:text-lg text-muted-foreground">
                          ROI: <span className="font-bold text-secondary">{calculatedROI}%</span>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-2">
                          Based on {selectedPackage} leads per month with {conversionRateNum}% conversion rate
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
                  src="/lovable-uploads/3cb03474-8c87-4346-bad5-554145f76c1b.png" 
                  alt="Broker Dashboard Preview showing lead management interface" 
                  className="w-full rounded-lg border-2 border-green-500 shadow-lg"
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

            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
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




      <Footer />
    </div>
  );
};

export default BrokerSignup;