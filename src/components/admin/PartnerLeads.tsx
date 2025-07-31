import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, DollarSign, Calendar, Building2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthly_revenue: number;
  loan_amount: number;
  credit_score: string;
  time_in_business: string;
  use_of_funds: string;
  created_at: string;
  country: string;
  city_province: string;
}

export default function PartnerLeads() {
  const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAssignedLeads();
    }
  }, [user]);

  const fetchAssignedLeads = async () => {
    try {
      setLoading(true);
      
      // For now, we'll show a placeholder since lead assignment system isn't implemented yet
      // TODO: Implement actual lead assignment logic
      setAssignedLeads([]);
      
      toast({
        title: "Coming Soon",
        description: "Lead assignment feature will be available once payment is processed.",
      });
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assigned leads.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCallLead = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmailLead = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Assigned Leads</h2>
          <p className="text-muted-foreground">Leads that have been assigned to you based on your preferences</p>
        </div>
      </div>

      {assignedLeads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="text-6xl">🔒</div>
              <h3 className="text-xl font-semibold">No Leads Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete your payment to unlock access to qualified leads matching your criteria. 
                Once payment is processed, leads will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignedLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{lead.name}</h3>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ${(lead.loan_amount / 1000)}K Loan
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Monthly Revenue:</span>
                        <span>${(lead.monthly_revenue / 1000)}K</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Time in Business:</span>
                        <span>{lead.time_in_business}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Location:</span>
                        <span>{lead.city_province}, {lead.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Lead Date:</span>
                        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded-lg">
                      <span className="font-medium text-sm">Use of Funds:</span>
                      <p className="text-sm mt-1">{lead.use_of_funds}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-fit">
                    <Button
                      onClick={() => handleCallLead(lead.phone)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Lead
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEmailLead(lead.email)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Lead
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}