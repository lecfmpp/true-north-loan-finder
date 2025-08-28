import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, Mail, Building2, DollarSign, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CalendlyInline from "@/components/CalendlyInline";
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
  return <span>
      {start}
      <span className="blur-sm select-none">{rest}</span>
    </span>;
};
const maskEmail = (email: string): JSX.Element => {
  const [localPart, domain] = email.split('@');
  if (!domain) return <span>{email}</span>;
  const maskedLocal = localPart.length > 3 ? <span>
      {localPart.substring(0, 3)}
      <span className="blur-sm select-none">{localPart.substring(3)}</span>
    </span> : <span>{localPart}</span>;
  const maskedDomain = domain.length > 4 ? <span>
      <span className="blur-sm select-none">{domain.substring(0, domain.length - 4)}</span>
      {domain.substring(domain.length - 4)}
    </span> : <span>{domain}</span>;
  return <span>{maskedLocal}@{maskedDomain}</span>;
};
const maskPhone = (phone: string): JSX.Element => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length >= 10) {
    return <span>
        ({cleanPhone.substring(0, 3)}) 
        <span className="blur-sm select-none">***-****</span>
      </span>;
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
  const calendlyRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();

  // Fetch real leads from database
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        // Use the secure RPC function that returns masked data
        const {
          data: leadData,
          error
        } = await supabase.rpc('get_public_lead_feed', {
          p_country: selectedCountry,
          p_limit: 20
        });
        if (error) throw error;
        if (leadData && leadData.length > 0) {
          const transformedLeads: Lead[] = leadData.map(lead => {
            // Data is already masked at database level for security
            const businessName = <span>{lead.business_name}</span>;
            return {
              id: lead.id,
              businessName,
              contactName: <span>{lead.contact_name}</span>,
              email: <span>{lead.email || 'Not available'}</span>,
              phone: <span>{lead.phone || 'Not available'}</span>,
              loanAmount: `$${Number(lead.loan_amount).toLocaleString()}`,
              submittedAt: new Date(lead.submitted_at),
              creditScore: getCreditScore(lead.credit_score_range),
              industry: lead.industry,
              loanType: lead.loan_type,
              phoneVerified: lead.phone_verified
            };
          });
          setLeads(transformedLeads);
          // Set the most recent submission time for the urgency countdown
          setLastSubmissionTime(new Date(leadData[0].submitted_at));
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

    // Refresh leads every 30 seconds to show updates
    const interval = setInterval(fetchLeads, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [selectedCountry]); // Re-fetch when country changes

  const CALENDLY_URL = 'https://calendly.com/leandro-truenorth-businessloan/30min';
  const handleUnlockClick = (lead: Lead) => {
    setSelectedLead(lead);
    calendlyRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
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
    window.open(CALENDLY_URL, '_blank');
    setShowModal(false);
  };
  return <>
      <div className="space-y-6 hidden">
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
                  {lead.phoneVerified && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Phone Verified
                    </Badge>}
                  <LiveTimer submittedAt={lead.submittedAt} />
                </div>
                
                <div className="text-center mb-2">
                  <div className="text-yellow-500 mb-1">★★★★★★</div>
                  <CardTitle className="text-xl font-sans text-primary leading-tight truncate">{lead.businessName}</CardTitle>
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
                    <span className="text-sm text-foreground font-medium truncate">{lead.contactName}</span>
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
                  🔓 Unlock 10 Leads Trial
                </Button>
              </CardContent>
            </Card>)}
        </div>
      </div>

      <section ref={calendlyRef} id="schedule-demo" aria-label="Schedule your 10 Leads Trial" className="max-w-3xl mx-auto mt-8">
        <div className="text-center mb-4">
          <h2 className="font-bold text-primary text-4xl">Book your ‘20 Leads’ trial call and find out if we can start filling your pipeline this week.</h2>
          <p className="text-sm text-muted-foreground">Pick a time to chat and activate your trial.</p>
        </div>
          <CalendlyInline url="https://calendly.com/leandro-truenorth-businessloan/30min?hide_gdpr_banner=1&primary_color=29df77" height={1100} />
      </section>
    </>;
};