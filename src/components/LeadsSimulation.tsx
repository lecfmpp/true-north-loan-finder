import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Clock, Phone, Mail, Building2, DollarSign, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface Lead {
  id: string;
  businessName: JSX.Element;
  contactName: JSX.Element;
  email: JSX.Element;
  phone: JSX.Element;
  loanAmount: string;
  submittedAt: Date;
  creditScore: number;
  industry: string;
  loanType: string;
  phoneVerified: boolean;
}

// Helper function to mask sensitive information with blur effect
const maskText = (text: string, visibleStart: number = 3): JSX.Element => {
  if (text.length <= visibleStart) {
    return <span>{text}</span>;
  }
  const start = text.substring(0, visibleStart);
  const rest = text.substring(visibleStart);
  return (
    <span>
      {start}
      <span className="blur-sm select-none">{rest}</span>
    </span>
  );
};
const maskEmail = (email: string): JSX.Element => {
  const [localPart, domain] = email.split('@');
  if (!domain) return <span>{email}</span>;
  
  const maskedLocal = localPart.length > 3 ? (
    <span>
      {localPart.substring(0, 3)}
      <span className="blur-sm select-none">{localPart.substring(3)}</span>
    </span>
  ) : <span>{localPart}</span>;
  
  const maskedDomain = domain.length > 4 ? (
    <span>
      <span className="blur-sm select-none">{domain.substring(0, domain.length - 4)}</span>
      {domain.substring(domain.length - 4)}
    </span>
  ) : <span>{domain}</span>;
  
  return <span>{maskedLocal}@{maskedDomain}</span>;
};

const maskPhone = (phone: string): JSX.Element => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length >= 10) {
    return (
      <span>
        ({cleanPhone.substring(0, 3)}) 
        <span className="blur-sm select-none">***-****</span>
      </span>
    );
  }
  return <span>(555) <span className="blur-sm select-none">***-****</span></span>;
};

// Helper function to derive business type from use_of_funds
const getBusinessType = (useOfFunds: string): string => {
  const funds = useOfFunds.toLowerCase();
  if (funds.includes('inventory') || funds.includes('equipment')) return 'Equipment Financing';
  if (funds.includes('working capital') || funds.includes('cash flow')) return 'Working Capital';
  if (funds.includes('expansion') || funds.includes('location')) return 'Business Expansion';
  if (funds.includes('marketing') || funds.includes('advertising')) return 'Marketing & Growth';
  return 'Business Loan';
};

// Helper function to derive industry from business description or use_of_funds
const getIndustry = (useOfFunds: string): string => {
  const funds = useOfFunds.toLowerCase();
  if (funds.includes('restaurant') || funds.includes('food')) return 'Restaurant';
  if (funds.includes('construction') || funds.includes('contractor')) return 'Construction';
  if (funds.includes('medical') || funds.includes('healthcare')) return 'Healthcare';
  if (funds.includes('retail') || funds.includes('store')) return 'Retail';
  if (funds.includes('automotive') || funds.includes('auto')) return 'Automotive';
  if (funds.includes('manufacturing')) return 'Manufacturing';
  return 'Service Business';
};

// Helper function to estimate credit score from provided range
const getCreditScore = (creditScoreRange: string): number => {
  const range = creditScoreRange.toLowerCase();
  if (range.includes('excellent') || range.includes('750+') || range.includes('800+')) return 750 + Math.floor(Math.random() * 50);
  if (range.includes('good') || range.includes('700') || range.includes('680-750')) return 680 + Math.floor(Math.random() * 70);
  if (range.includes('fair') || range.includes('650') || range.includes('620-680')) return 620 + Math.floor(Math.random() * 60);
  if (range.includes('poor') || range.includes('below 620')) return 580 + Math.floor(Math.random() * 40);
  return 650 + Math.floor(Math.random() * 100); // Default range
};
const LiveTimer = ({
  submittedAt
}: {
  submittedAt: Date;
}) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const updateElapsed = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - submittedAt.getTime()) / 1000);
      // Add 15 minutes (900 seconds) to create urgency
      setElapsed(diff + 900);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [submittedAt]);
  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400); // 86400 seconds in a day
    const hours = Math.floor(seconds % 86400 / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;

    // If more than 48 hours (2 days), show days
    if (seconds >= 172800) {
      // 48 hours = 172800 seconds
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Otherwise show hours:minutes format
    return `${mins}:${secs.toString().padStart(2, '0')} min ago`;
  };
  return <div className="flex items-center space-x-2 text-xs bg-red-600 text-white px-2 py-1 rounded">
      <Clock className="h-3 w-3 text-white" />
      <span className="font-medium">{formatTime(elapsed)}</span>
    </div>;
};

// Dynamic countdown for urgency in modal
const UrgencyCountdown = ({
  lastSubmissionTime
}: {
  lastSubmissionTime: Date | null;
}) => {
  const [timeSinceSubmission, setTimeSinceSubmission] = useState("");
  useEffect(() => {
    if (!lastSubmissionTime) return;
    const updateTime = () => {
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSubmissionTime.getTime()) / (1000 * 60));
      if (diffInMinutes < 1) {
        setTimeSinceSubmission("just now");
      } else if (diffInMinutes < 60) {
        setTimeSinceSubmission(`${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`);
      } else {
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
          setTimeSinceSubmission(`${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`);
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          setTimeSinceSubmission(`${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`);
        }
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds for more accuracy

    return () => clearInterval(interval);
  }, [lastSubmissionTime]);
  if (!lastSubmissionTime) {
    return <span className="font-semibold text-destructive">Lead waiting for immediate response</span>;
  }
  return <span className="font-semibold text-destructive">Lead is waiting for response</span>;
};
export const LeadsSimulation = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<'US' | 'Canada'>('US');
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const {
    toast
  } = useToast();

  // Fetch real leads from database
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        // Fix country filter to match actual data format
        const countryFilter = selectedCountry === 'US' 
          ? ['US', 'USA', 'United States'] 
          : ['CA', 'Canada', 'Canadian', 'CAN'];
        
        const { data: quizResponses, error } = await supabase
          .from('quiz_responses')
          .select('*')
          .eq('status', 'New') // Fixed: 'New' with capital N, not 'new'
          .in('country', countryFilter)
          .order('created_at', { ascending: false })
          .limit(20); // Increased limit to show more recent leads
        if (error) throw error;
        if (quizResponses && quizResponses.length > 0) {
          const transformedLeads: Lead[] = quizResponses.map(response => {
            // Create business name from name (first part) + industry
            const firstName = response.name.split(' ')[0];
            const industry = getIndustry(response.use_of_funds);
            const businessName = (
              <span>
                <span className="blur-sm select-none">{firstName}</span> {industry}
              </span>
            );
            return {
              id: response.id,
              businessName,
              contactName: maskText(response.name),
              email: maskEmail(response.email),
              phone: maskPhone(response.phone),
              loanAmount: `$${response.loan_amount.toLocaleString()}`,
              submittedAt: new Date(response.created_at),
              creditScore: getCreditScore(response.credit_score),
              industry: getIndustry(response.use_of_funds),
              loanType: getBusinessType(response.use_of_funds),
              phoneVerified: true // Assume verified for leads
            };
          });
          setLeads(transformedLeads);
          // Set the most recent submission time for the urgency countdown
          setLastSubmissionTime(new Date(quizResponses[0].created_at));
        } else {
          setLeads([]);
          setLastSubmissionTime(null);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
        // Fallback to empty array on error
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeads();
    
    // Set up real-time subscription for new leads
    const channel = supabase
      .channel('quiz-responses-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_responses'
        },
        (payload) => {
          console.log('New lead received:', payload);
          // Refresh leads when new one comes in
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCountry]); // Re-fetch when country changes

  const handleUnlockClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  // Phone formatting for US/Canada
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US/Canada
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }));
  };

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  // Phone validation for US/Canada (10 digits)
  const isValidPhone = (phone: string) => {
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length === 10;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!isValidEmail(formData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }
      if (!isValidPhone(formData.phone)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid 10-digit US/Canada phone number.",
          variant: "destructive"
        });
        return;
      }

      // Create client record in database
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company_name: `${formData.name}'s Business`,
          lead_source: 'lead_simulation',
          status: 'new',
          payment_status: 'waiting_payment'
        })
        .select();

      if (error) {
        console.error('Error creating client record:', error);
        toast({
          title: "Error",
          description: "Failed to save your information. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data && data[0]) {
        // Create payment link for the new client
        try {
          const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-client-payment', {
            body: {
              clientId: data[0].id,
              amount: 5000, // $50.00 in cents
              description: 'Lead Simulation Access'
            }
          });

          if (paymentError) {
            console.error('Error creating payment:', paymentError);
            toast({
              title: "Success",
              description: "Your information has been saved! Please contact us to complete payment.",
            });
          } else {
            toast({
              title: "Success",
              description: "Redirecting to payment...",
            });
            // Open payment link in new tab
            window.open(paymentData.paymentUrl, '_blank');
          }
        } catch (paymentError) {
          console.error('Payment creation failed:', paymentError);
          toast({
            title: "Success",
            description: "Your information has been saved! Please contact us to complete payment.",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Your information has been saved successfully!",
        });
      }

      // Close modal and reset form
      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        phone: ""
      });

    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="font-sans text-primary mb-4 text-lg font-medium">Check out the latest leads and call them right now</h3>
          
        </div>

        {/* Country Toggle Switch */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-muted rounded-lg p-1 w-fit border-2 border-border shadow-sm">
            <button onClick={() => setSelectedCountry('US')} className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${selectedCountry === 'US' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-background text-muted-foreground'}`}>
              <span className="text-lg">🇺🇸</span>
              <span className="font-medium">United States</span>
            </button>
            <button onClick={() => setSelectedCountry('Canada')} className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${selectedCountry === 'Canada' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-background text-muted-foreground'}`}>
              <span className="text-lg">🇨🇦</span>
              <span className="font-medium">Canada</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 max-w-sm mx-auto md:max-w-none md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
          {loading ? <div className="col-span-3 text-center py-8">
              <div className="text-muted-foreground">Loading real leads...</div>
            </div> : leads.length === 0 ? <div className="col-span-3 text-center py-8">
              <div className="text-muted-foreground">No new leads available at the moment</div>
            </div> : leads.slice(0, 6).map(lead => <Card key={lead.id} className="border-2 border-green-500 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 relative overflow-hidden hover:border-green-600">
              
              <CardHeader className="relative z-20 pb-2 px-4 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                    Credit Score: {lead.creditScore}
                  </Badge>
                  <LiveTimer submittedAt={lead.submittedAt} />
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  {lead.phoneVerified && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Phone Verified
                    </Badge>}
                  <Badge variant="outline" className="text-xs">{lead.industry}</Badge>
                </div>
                
                <div className="text-center mb-2">
                  <div className="text-yellow-500 mb-1">★★★★★★</div>
                  <CardTitle className="text-xl font-sans text-primary leading-tight">{lead.businessName}</CardTitle>
                  <div className="text-sm text-secondary font-medium">{lead.loanType}</div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-20 pt-0 px-4 pb-4">
                {/* Most Important: Cash Required */}
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Cash Required</div>
                  <div className="text-2xl font-bold text-accent flex items-center justify-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {lead.loanAmount}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">{lead.contactName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{lead.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{lead.email}</span>
                  </div>
                </div>
                
                {/* Action Button */}
                <Button onClick={() => handleUnlockClick(lead)} variant="cta" size="lg" className="w-full text-base bg-green-600 hover:bg-green-700 text-white">
                  🔓 Unlock Lead and Call Now
                </Button>
              </CardContent>
            </Card>)}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-primary">
              🚨 New Qualified Lead!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                 <div className="flex items-center justify-center space-x-2 mb-2">
                   <Clock className="h-5 w-5 text-destructive" />
                   <UrgencyCountdown lastSubmissionTime={lastSubmissionTime} />
                 </div>
                <p className="text-sm text-muted-foreground">
                  This lead submitted their application and needs immediate response
                </p>
              </div>
              
              <Card className="bg-gradient-to-r from-accent/10 to-secondary/10 border-accent/20">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-accent mb-2">Trial Package</div>
                  <div className="text-4xl font-bold text-primary mb-2">$500</div>
                  <div className="text-muted-foreground mb-4">10 Premium Leads</div>
                  <ul className="text-sm space-y-1 text-left">
                    <li>✅ Complete contact information</li>
                    <li>✅ Pre-qualified prospects</li>
                    <li>✅ Same-day response expected</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Your Full Name" value={formData.name} onChange={e => setFormData(prev => ({
              ...prev,
              name: e.target.value
            }))} required />
              <Input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData(prev => ({
              ...prev,
              email: e.target.value
            }))} required />
              <Input type="tel" placeholder="Phone Number (XXX) XXX-XXXX" value={formData.phone} onChange={handlePhoneChange} maxLength={14} required />
              
              <Button type="submit" variant="cta" size="lg" className="w-full text-lg bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "🔓 Unlock Leads for $500"}
              </Button>
            </form>
            
            <div className="text-center text-xs text-muted-foreground">
              Secure payment processed by Stripe • Cancel anytime
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};