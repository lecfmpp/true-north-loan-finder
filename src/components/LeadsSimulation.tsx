import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Clock, Phone, Mail, Building2, DollarSign, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  loanAmount: string;
  timeArrived: string;
  urgency: "HIGH" | "MEDIUM";
  industry: string;
}

const mockLeads: Lead[] = [
  {
    id: "1",
    businessName: "****** Restaurant",
    contactName: "J*** S******",
    email: "j****@******.com",
    phone: "(555) ***-****",
    loanAmount: "$85,000",
    timeArrived: "2 minutes ago",
    urgency: "HIGH",
    industry: "Restaurant"
  },
  {
    id: "2", 
    businessName: "******* Construction",
    contactName: "M*** R*******",
    email: "m****@******.com",
    phone: "(555) ***-****",
    loanAmount: "$150,000",
    timeArrived: "5 minutes ago",
    urgency: "HIGH",
    industry: "Construction"
  },
  {
    id: "3",
    businessName: "***** Auto Repair",
    contactName: "D*** L****",
    email: "d****@******.com", 
    phone: "(555) ***-****",
    loanAmount: "$45,000",
    timeArrived: "8 minutes ago",
    urgency: "MEDIUM",
    industry: "Automotive"
  }
];

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

        <div className="space-y-4">
          {mockLeads.map((lead) => (
            <Card key={lead.id} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95 backdrop-blur-sm z-10"></div>
              
              <CardHeader className="relative z-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge variant={lead.urgency === "HIGH" ? "destructive" : "secondary"} className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{lead.urgency} PRIORITY</span>
                    </Badge>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{lead.timeArrived}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{lead.industry}</Badge>
                </div>
                
                <CardTitle className="text-lg font-sans text-primary">{lead.businessName}</CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-20">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-secondary" />
                      <span className="text-muted-foreground">Contact: {lead.contactName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-secondary" />
                      <span className="text-muted-foreground">{lead.email}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-secondary" />
                      <span className="text-muted-foreground">{lead.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-4 w-4 text-secondary" />
                      <span className="text-muted-foreground font-semibold">{lead.loanAmount} requested</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleUnlockClick(lead)}
                  variant="cta" 
                  size="lg" 
                  className="w-full text-lg bg-accent hover:bg-accent/90"
                >
                  🔓 Unlock Lead & Contact Now
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
                  This lead arrived {selectedLead?.timeArrived} and needs immediate response
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