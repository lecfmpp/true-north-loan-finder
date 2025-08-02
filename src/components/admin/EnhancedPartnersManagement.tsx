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
  Award,
  RefreshCw,
  CreditCard,
  Send
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  application_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  total_leads_assigned: number;
  leads_contacted: number;
  leads_spoken: number;
  deals_closed: number;
}

export default function EnhancedPartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [leadCount, setLeadCount] = useState(10);
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("unconfirmed");
  const { toast } = useToast();

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch partners.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePartnerStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updates: any = { 
        status, 
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Partner status updated to ${status}.`,
      });

      fetchPartners();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update partner status.",
        variant: "destructive"
      });
    }
  };

  const resendConfirmationEmail = async (partner: Partner) => {
    try {
      const { error } = await supabase.functions.invoke('send-partner-confirmation', {
        body: {
          name: partner.name,
          email: partner.email,
          company_name: partner.company_name,
          application_type: partner.application_type
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Confirmation email sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send confirmation email.",
        variant: "destructive"
      });
    }
  };

  const initiatePayment = async (partner: Partner, leadPackageCount: number) => {
    try {
      if (!partner.user_id) {
        toast({
          title: "Error",
          description: "Partner must confirm their account first.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-partner-payment', {
        body: {
          leadPackageCount,
          partnerId: partner.id
        }
      });

      if (error) throw error;

      // Open payment in new tab
      if (data.url) {
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment Link Created",
          description: `Payment link opened for ${leadPackageCount} leads ($${(data.amount / 100).toFixed(2)}).`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create payment link.",
        variant: "destructive"
      });
    }
  };

  const createPartnerManually = async (partnerData: any) => {
    try {
      console.log('Creating partner manually:', partnerData);
      
      const { data: result, error: createError } = await supabase.functions.invoke('create-partner', {
        body: {
          name: partnerData.name,
          email: partnerData.email,
          company_name: partnerData.company_name,
          phone: partnerData.phone,
          application_type: partnerData.application_type,
          status: 'unconfirmed' // Start as unconfirmed until they confirm email
        }
      });

      if (createError) {
        console.error('Partner creation error:', createError);
        throw createError;
      }

      console.log('Partner created successfully:', result);

      // Send confirmation email automatically
      try {
        console.log('Sending confirmation email for new partner:', partnerData.email);
        
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-partner-confirmation', {
          body: {
            name: partnerData.name,
            email: partnerData.email,
            company_name: partnerData.company_name,
            application_type: partnerData.application_type
          }
        });

        if (emailError) {
          console.error('Email sending error:', emailError);
          toast({
            title: "Partner Created",
            description: "Partner created but confirmation email failed to send. Please resend manually.",
            variant: "destructive"
          });
        } else {
          console.log('Confirmation email sent successfully:', emailResult);
          toast({
            title: "Success",
            description: "Partner created and confirmation email sent successfully."
          });
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        toast({
          title: "Partner Created",
          description: "Partner created but confirmation email failed to send.",
          variant: "destructive"
        });
      }

      fetchPartners();
    } catch (error: any) {
      console.error('Failed to create partner:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create partner.",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });
      if (error) throw error;
      
      toast({
        title: "Password Reset Sent",
        description: "Password reset link has been sent to the user's email."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send password reset link.",
        variant: "destructive"
      });
    }
  };

  const deletePartner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Partner deleted successfully."
      });
      
      fetchPartners();
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

  const getStatusBadge = (status: string, hasUserId: boolean) => {
    switch (status) {
      case 'unconfirmed':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Unconfirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Approval</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-600 text-white">Active</Badge>;
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPartnerForm, setNewPartnerForm] = useState({
    name: '',
    email: '',
    company_name: '',
    phone: '',
    application_type: 'broker'
  });

  const unconfirmedPartners = partners.filter(p => p.status === 'unconfirmed' || !p.user_id);
  const pendingPartners = partners.filter(p => p.status === 'pending' && p.user_id);
  const activePartners = partners.filter(p => p.status === 'active');

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

  const PartnerCard = ({ partner }: { partner: Partner }) => {
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
                      <CardTitle className="text-lg">{partner.name}</CardTitle>
                      {getStatusBadge(partner.status, !!partner.user_id)}
                      {getTypeBadge(partner.application_type)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {partner.company_name}
                    </p>
                  </div>
                </div>
                
                {partner.status === 'active' && (
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
                    {partner.email}
                  </div>
                  {partner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {partner.phone}
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

                {/* Account Status Info */}
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Account Status</p>
                  <p className="text-xs text-muted-foreground">
                    {!partner.user_id ? 
                      "🔄 Email confirmation pending - partner needs to confirm email and set password" :
                      partner.status === 'pending' ?
                      "✅ Email confirmed - waiting for admin approval or payment" :
                      "🎉 Fully active - can receive lead assignments"
                    }
                  </p>
                </div>

                {/* Metrics for Active Partners */}
                {partner.status === 'active' && (
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

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t flex-wrap">
                  {partner.status === 'unconfirmed' && (
                    <Button
                      onClick={() => resendConfirmationEmail(partner)}
                      variant="outline"
                      className="border-orange-500 text-orange-700 hover:bg-orange-50"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Resend Confirmation
                    </Button>
                  )}
                  
                  {partner.status === 'pending' && partner.user_id && (
                    <>
                      <Button
                        onClick={() => updatePartnerStatus(partner.id, 'active')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setSelectedPartner(partner);
                          setIsPaymentModalOpen(true);
                        }}
                        variant="outline"
                        className="border-blue-500 text-blue-700 hover:bg-blue-50"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Create Payment
                      </Button>
                    </>
                  )}
                  
                  {partner.user_id && (
                    <Button
                      variant="outline"
                      onClick={() => resetPassword(partner.email)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPartner(partner);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => deletePartner(partner.id)}
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Partners Management</h2>
          <p className="text-muted-foreground">Manage partner workflow from creation to activation</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPartners}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Users className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unconfirmed" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Unconfirmed ({unconfirmedPartners.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingPartners.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Active ({activePartners.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unconfirmed" className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-orange-900 mb-1">Unconfirmed Partners</h3>
            <p className="text-sm text-orange-800">
              These partners haven't confirmed their email yet. Use "Resend Confirmation" to send another email.
            </p>
          </div>
          {unconfirmedPartners.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No unconfirmed partners found.</p>
              </CardContent>
            </Card>
          ) : (
            unconfirmedPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-1">Pending Approval</h3>
            <p className="text-sm text-blue-800">
              These partners have confirmed their email but need approval or payment to become active.
            </p>
          </div>
          {pendingPartners.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No pending partners found.</p>
              </CardContent>
            </Card>
          ) : (
            pendingPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-green-900 mb-1">Active Partners</h3>
            <p className="text-sm text-green-800">
              These partners are fully activated and can receive lead assignments.
            </p>
          </div>
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

      {/* Create Partner Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Partner Name</Label>
              <Input
                id="name"
                value={newPartnerForm.name}
                onChange={(e) => setNewPartnerForm({...newPartnerForm, name: e.target.value})}
                placeholder="Enter partner name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newPartnerForm.email}
                onChange={(e) => setNewPartnerForm({...newPartnerForm, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={newPartnerForm.company_name}
                onChange={(e) => setNewPartnerForm({...newPartnerForm, company_name: e.target.value})}
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newPartnerForm.phone}
                onChange={(e) => setNewPartnerForm({...newPartnerForm, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="application_type">Type</Label>
              <Select
                value={newPartnerForm.application_type}
                onValueChange={(value) => setNewPartnerForm({...newPartnerForm, application_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="lender">Lender</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPartnerForm({
                    name: '',
                    email: '',
                    company_name: '',
                    phone: '',
                    application_type: 'broker'
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  createPartnerManually(newPartnerForm);
                  setShowCreateModal(false);
                  setNewPartnerForm({
                    name: '',
                    email: '',
                    company_name: '',
                    phone: '',
                    application_type: 'broker'
                  });
                }}
                disabled={!newPartnerForm.name || !newPartnerForm.email || !newPartnerForm.company_name}
              >
                Create Partner
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payment for {selectedPartner?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leadCount">Number of Leads</Label>
              <Input
                id="leadCount"
                type="number"
                min="1"
                max="1000"
                value={leadCount}
                onChange={(e) => setLeadCount(parseInt(e.target.value) || 1)}
                placeholder="Enter number of leads"
              />
              <p className="text-sm text-muted-foreground mt-1">
                @ $50 per lead = ${(leadCount * 50).toFixed(2)} total
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedPartner) {
                    initiatePayment(selectedPartner, leadCount);
                  }
                  setIsPaymentModalOpen(false);
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Partner</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedPartner.status}
                  onValueChange={(value) => setSelectedPartner({...selectedPartner, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
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
                    updatePartnerStatus(selectedPartner.id, selectedPartner.status);
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