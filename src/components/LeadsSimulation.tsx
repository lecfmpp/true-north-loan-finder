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
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  loanAmount: string;
  submittedAt: Date;
  creditScore: number;
  industry: string;
  loanType: string;
  phoneVerified: boolean;
}

const mockLeads: Lead[] = [
  {
    id: "1",
    businessName: "****** Restaurant",
    contactName: "J*** S******",
    email: "j****@******.com",
    phone: "(555) ***-****",
    loanAmount: "$85,000",
    submittedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    creditScore: 720,
    industry: "Restaurant",
    loanType: "Working Capital",
    phoneVerified: true
  },
  {
    id: "2", 
    businessName: "******* Construction",
    contactName: "M*** R*******",
    email: "m****@******.com",
    phone: "(555) ***-****",
    loanAmount: "$150,000",
    submittedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    creditScore: 680,
    industry: "Construction", 
    loanType: "Equipment Financing",
    phoneVerified: true
  },
  {
    id: "3",
    businessName: "***** Auto Repair",
    contactName: "D*** L****",
    email: "d****@******.com", 
    phone: "(555) ***-****",
    loanAmount: "$45,000",
    submittedAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    creditScore: 650,
    industry: "Automotive",
    loanType: "Business Loan",
    phoneVerified: true
  },
  {
    id: "4",
    businessName: "******* Medical",
    contactName: "S*** K****",
    email: "s****@******.com",
    phone: "(555) ***-****", 
    loanAmount: "$200,000",
    submittedAt: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    creditScore: 740,
    industry: "Healthcare",
    loanType: "Practice Expansion",
    phoneVerified: true
  }
];

const LiveTimer = ({ submittedAt }: { submittedAt: Date }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - submittedAt.getTime()) / 1000);
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [submittedAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} ago`;
  };

  return (
    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span className="text-red-600 font-medium">{formatTime(elapsed)}</span>
    </div>
  );
};

export const LeadsSimulation = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const { toast } = useToast();

  const handleUnlockClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit broker application
      const { error } = await supabase
        .from('lender_broker_applications')
        .insert({
          applicant_name: formData.name,
          applicant_email: formData.email,
          applicant_phone: formData.phone,
          company_name: "Trial Broker", // Temporary
          application_type: 'broker',
          business_description: "Lead trial signup"
        });

      if (error) throw error;

      // TODO: Redirect to Stripe payment
      toast({
        title: "Success!",
        description: "Redirecting to payment...",
      });

      // Close modal and reset form
      setShowModal(false);
      setFormData({ name: "", email: "", phone: "" });
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold font-sans text-primary mb-4">Live Leads Dashboard</h3>
          <p className="text-muted-foreground font-serif">See real leads waiting for your response right now</p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto md:max-w-none md:flex md:space-y-0 md:space-x-0 md:justify-center md:items-start">
          {mockLeads.slice(0, 3).map((lead, index) => (
            <Card key={lead.id} className={`border-2 border-green-500 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 relative overflow-hidden hover:border-green-600 md:w-80 md:hover:z-30 md:hover:scale-105 ${
              index === 0 ? 'md:ml-0 md:z-20' : 
              index === 1 ? 'md:z-10 md:-ml-4' : 
              index === 2 ? 'md:z-10 md:-ml-4' : 
              'md:z-10 md:-ml-4'
            }`}>
              
              <CardHeader className="relative z-20 pb-2 px-4 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                    Credit Score: {lead.creditScore}
                  </Badge>
                  <LiveTimer submittedAt={lead.submittedAt} />
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  {lead.phoneVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Phone Verified
                    </Badge>
                  )}
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
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4">
                  <div className="text-xs text-muted-foreground mb-1">Cash Required</div>
                  <div className="text-2xl font-bold text-accent flex items-center">
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
                <Button 
                  onClick={() => handleUnlockClick(lead)}
                  variant="cta" 
                  size="lg" 
                  className="w-full text-base bg-green-600 hover:bg-green-700 text-white"
                >
                  🔓 Unlock Lead
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-primary">
              🚨 Lead About to Expire!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">URGENT: Lead expires in 23 minutes</span>
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
                    <li>✅ Financial documents included</li>
                    <li>✅ Same-day response expected</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Your Full Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
              
              <Button 
                type="submit" 
                variant="cta"
                size="lg"
                className="w-full text-lg bg-accent hover:bg-accent/90" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "🔓 Unlock Leads for $500"}
              </Button>
            </form>
            
            <div className="text-center text-xs text-muted-foreground">
              Secure payment processed by Stripe • Cancel anytime
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};