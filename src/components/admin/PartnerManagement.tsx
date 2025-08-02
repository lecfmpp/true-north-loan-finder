import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Send,
  Eye,
  Edit3,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
}

export default function PartnerManagement() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
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
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (notes) updates.admin_notes = notes;

      // Get the application data before updating
      const { data: application, error: fetchError } = await supabase
        .from('lender_broker_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('lender_broker_applications')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // If approving the application, create partner record and assign role
      if (status === 'approved' && application) {
        try {
          // Check if partner already exists for this user
          const { data: existingPartner } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', application.user_id)
            .single();

          if (!existingPartner) {
            // Create partner record
            const { error: partnerError } = await supabase
              .from('partners')
              .insert([{
                user_id: application.user_id,
                name: application.applicant_name,
                email: application.applicant_email,
                company_name: application.company_name,
                phone: application.applicant_phone,
                application_type: application.application_type,
                status: 'active'
              }]);

            if (partnerError) throw partnerError;

            // Assign user role based on application type
            const roleToAssign = application.application_type === 'broker' ? 'broker' : 'lender';
            
            // Check if role already exists
            const { data: existingRole } = await supabase
              .from('user_roles')
              .select('id')
              .eq('user_id', application.user_id)
              .eq('role', roleToAssign)
              .single();

            if (!existingRole) {
              const { error: roleError } = await supabase
                .from('user_roles')
                .insert([{
                  user_id: application.user_id,
                  role: roleToAssign,
                  assigned_by: (await supabase.auth.getUser()).data.user?.id
                }]);

              if (roleError) {
                console.error('Role assignment error:', roleError);
              }
            }
          }
        } catch (partnerError) {
          console.error('Partner creation error:', partnerError);
          // Don't fail the status update if partner creation fails
        }
      }

      toast({
        title: "Success",
        description: status === 'approved' ? 
          "Application approved and partner account created successfully." : 
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

  const sendPaymentLink = async (application: PartnerApplication) => {
    try {
      setIsSendingEmail(true);
      
      const { data, error } = await supabase.functions.invoke('create-broker-payment');

      if (error) throw error;

      // Open payment link in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Payment Link Generated!",
          description: `Payment link opened for ${application.applicant_name}`
        });
      }

      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate payment link.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
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
        description: "Application deleted successfully."
      });
      
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary"><DollarSign className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
    const statusMatch = filterStatus === "all" || app.status === filterStatus;
    const paymentMatch = filterPaymentStatus === "all" || app.payment_status === filterPaymentStatus;
    return statusMatch && paymentMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Partner Applications</h2>
          <p className="text-muted-foreground">Review and approve broker/lender applications</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Payment Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No partner applications found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{app.applicant_name}</h3>
                      {getStatusBadge(app.status)}
                      {getPaymentStatusBadge(app.payment_status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {app.company_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {app.applicant_email}
                      </div>
                      {app.applicant_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {app.applicant_phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {app.payment_status === 'pending' && (
                      <div className="flex items-center gap-1 text-sm text-orange-600">
                        <DollarSign className="h-4 w-4" />
                        ${(app.payment_amount / 100).toFixed(2)} due by {new Date(app.payment_deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 min-w-fit">
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Applicant Name</Label>
                                <p className="text-sm">{app.applicant_name}</p>
                              </div>
                              <div>
                                <Label>Company</Label>
                                <p className="text-sm">{app.company_name}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{app.applicant_email}</p>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <p className="text-sm">{app.applicant_phone || 'N/A'}</p>
                              </div>
                              <div>
                                <Label>Website</Label>
                                <p className="text-sm">{app.company_website || 'N/A'}</p>
                              </div>
                              <div>
                                <Label>Application Type</Label>
                                <p className="text-sm capitalize">{app.application_type}</p>
                              </div>
                            </div>
                            {app.admin_notes && (
                              <div>
                                <Label>Admin Notes</Label>
                                <p className="text-sm bg-muted p-2 rounded">{app.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {app.payment_status === 'pending' && (
                        <Button
                          onClick={() => sendPaymentLink(app)}
                          disabled={isSendingEmail}
                          size="sm"
                          className="flex-1"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          {isSendingEmail ? "Generating..." : "Payment Link"}
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => deleteApplication(app.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Application</DialogTitle>
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
                  placeholder="Add notes about this application..."
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