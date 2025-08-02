import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Edit3,
  Trash2,
  Key,
  ChevronDown,
  ChevronRight,
  Users,
  TrendingUp,
  Target,
  Award
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PartnerApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  company_name: string;
  company_website: string;
  application_type: string;
  status: string;
  payment_status: string;
  payment_amount: number;
  payment_deadline: string;
  created_at: string;
  updated_at: string;
  admin_notes: string;
  user_id: string;
  total_leads_assigned: number;
  leads_contacted: number;
  leads_spoken: number;
  deals_closed: number;
  operational_status: string;
  partner_notes: string;
}

export default function EnhancedPartnersManagement() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lender_broker_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch partner applications.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updates: any = { 
        status, 
        updated_at: new Date().toISOString(),
        operational_status: status === 'approved' ? 'active' : 'pending'
      };
      if (notes) updates.admin_notes = notes;

      const { error } = await supabase
        .from('lender_broker_applications')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: status === 'approved' ? 
          "Partner approved and activated successfully." : 
          "Application status updated successfully."
      });
      
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string, hasPassword: boolean) => {
    try {
      if (hasPassword) {
        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`
        });
        if (error) throw error;
        
        toast({
          title: "Password Reset Sent",
          description: "Password reset link has been sent to the user's email."
        });
      } else {
        // Send invitation to set password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`
        });
        if (error) throw error;
        
        toast({
          title: "Password Setup Link Sent",
          description: "Link to create password has been sent to the user's email."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send password reset link.",
        variant: "destructive"
      });
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lender_broker_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Partner deleted successfully."
      });
      
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete partner.",
        variant: "destructive"
      });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedPartners(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600 text-white">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="ml-2">
        {type === 'broker' ? 'Broker' : 'Lender'}
      </Badge>
    );
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const activePartners = applications.filter(app => app.status === 'approved');

  const MetricsCard = ({ title, value, icon: Icon, trend }: any) => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-2 text-sm text-green-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          {trend}
        </div>
      )}
    </Card>
  );

  const PartnerCard = ({ partner }: { partner: PartnerApplication }) => {
    const isExpanded = expandedPartners.has(partner.id);
    const conversionRate = partner.total_leads_assigned > 0 
      ? Math.round((partner.deals_closed / partner.total_leads_assigned) * 100) 
      : 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <Collapsible 
          open={isExpanded} 
          onOpenChange={() => toggleExpanded(partner.id)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{partner.applicant_name}</CardTitle>
                      {getStatusBadge(partner.status)}
                      {getTypeBadge(partner.application_type)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {partner.company_name}
                    </p>
                  </div>
                </div>
                
                {partner.status === 'approved' && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{partner.total_leads_assigned}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{partner.deals_closed}</p>
                      <p className="text-xs text-muted-foreground">Deals</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{conversionRate}%</p>
                      <p className="text-xs text-muted-foreground">Rate</p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {partner.applicant_email}
                  </div>
                  {partner.applicant_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {partner.applicant_phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {partner.company_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(partner.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Metrics for Active Partners */}
                {partner.status === 'approved' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricsCard
                      title="Total Leads"
                      value={partner.total_leads_assigned}
                      icon={Users}
                    />
                    <MetricsCard
                      title="Contacted"
                      value={partner.leads_contacted}
                      icon={Phone}
                    />
                    <MetricsCard
                      title="Spoken"
                      value={partner.leads_spoken}
                      icon={Target}
                    />
                    <MetricsCard
                      title="Deals Closed"
                      value={partner.deals_closed}
                      icon={Award}
                    />
                  </div>
                )}

                {/* Admin Notes */}
                {partner.admin_notes && (
                  <div>
                    <Label className="text-sm font-medium">Admin Notes</Label>
                    <p className="text-sm bg-muted p-2 rounded mt-1">{partner.admin_notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {partner.status === 'pending' && (
                    <Button
                      onClick={() => updateApplicationStatus(partner.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedApp(partner);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => resetPassword(partner.applicant_email, true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => deleteApplication(partner.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
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
      <div>
        <h2 className="text-2xl font-bold">Partners Management</h2>
        <p className="text-muted-foreground">Manage pending applications and active partners</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Active ({activePartners.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No pending applications found.</p>
              </CardContent>
            </Card>
          ) : (
            pendingApplications.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activePartners.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No active partners found.</p>
              </CardContent>
            </Card>
          ) : (
            activePartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Partner</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedApp.status}
                  onValueChange={(value) => setSelectedApp({...selectedApp, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  value={selectedApp.admin_notes || ''}
                  onChange={(e) => setSelectedApp({...selectedApp, admin_notes: e.target.value})}
                  placeholder="Add notes about this partner..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateApplicationStatus(selectedApp.id, selectedApp.status, selectedApp.admin_notes);
                    setIsEditModalOpen(false);
                  }}
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}