import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Check, X, User, Building, Phone, Mail, Globe, FileText, Calendar, Trash2, Search, ChevronDown } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface Application {
  id: string;
  application_type: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  company_name: string;
  company_website: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  license_number: string | null;
  years_of_experience: number | null;
  business_types: string[] | null;
  preferred_industries: string[] | null;
  min_monthly_revenue: string | null;
  max_monthly_revenue: string | null;
  min_time_in_business: string | null;
  min_credit_score: string | null;
  min_loan_amount: string | null;
  max_loan_amount: string | null;
  funding_purposes: string[] | null;
  geographic_areas: string[] | null;
  business_description: string | null;
  additional_requirements: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
}

interface ApplicationsManagementProps {
  onCountUpdate?: () => void;
}

export const ApplicationsManagement: React.FC<ApplicationsManagementProps> = ({ onCountUpdate }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [showRejectionForm, setShowRejectionForm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const {
    toast
  } = useToast();
  const {
    isSuperAdmin
  } = useAuth();
  const fetchApplications = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("lender_broker_applications").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchApplications();
  }, []);
  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);
  const filterApplications = () => {
    let filtered = applications;
    if (searchTerm) {
      filtered = filtered.filter(app => app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) || app.applicant_email.toLowerCase().includes(searchTerm.toLowerCase()) || app.applicant_phone && app.applicant_phone.includes(searchTerm));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    setFilteredApplications(filtered);
  };
  const updateApplicationStatus = async (id: string, status: "approved" | "rejected", rejectionReason?: string) => {
    setProcessingId(id);
    try {
      const {
        error
      } = await supabase.from("lender_broker_applications").update({
        status,
        reviewed_at: new Date().toISOString(),
        rejection_reason: status === "rejected" ? rejectionReason : null
      }).eq("id", id);
      if (error) throw error;
      toast({
        title: "Success",
        description: `Application ${status} successfully`
      });
      fetchApplications();
      setShowRejectionForm(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const openDeleteModal = (id: string) => {
    setApplicationToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setApplicationToDelete(null);
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE APPLICATION') {
      toast({
        title: "Deletion Cancelled",
        description: "Please type exactly 'DELETE APPLICATION' to confirm deletion",
        variant: "destructive"
      });
      return;
    }

    if (!applicationToDelete) return;

    setProcessingId(applicationToDelete);
    try {
      const {
        error
      } = await supabase.from("lender_broker_applications").delete().eq("id", applicationToDelete);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Application deleted successfully"
      });
      fetchApplications();
      onCountUpdate?.();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-orange-500 text-white">Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-500 text-white">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const getTypeIcon = (type: string) => {
    return type === "lender" ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };
  if (loading) {
    return <div className="flex justify-center py-8">Loading applications...</div>;
  }
  return <div className="space-y-4 px-2 sm:px-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Lender & Broker Applications</h2>
          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            {filteredApplications.length !== applications.length ? `${filteredApplications.length}/${applications.length}` : `${applications.length}`}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, email, or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredApplications.map(application => <Card key={application.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(application.application_type)}
                    <CardTitle className="capitalize text-sm sm:text-base">
                      {application.application_type} Application
                    </CardTitle>
                  </div>
                  {getStatusBadge(application.status)}
                </div>
                {isSuperAdmin && <Button variant="outline" size="sm" onClick={() => openDeleteModal(application.id)} disabled={processingId === application.id} className="text-destructive hover:text-destructive self-start">
                    <Trash2 className="w-4 h-4" />
                  </Button>}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="font-medium truncate">{application.applicant_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="truncate">{application.applicant_email}</span>
                  </div>
                  
                  {application.applicant_phone && <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      <span className="truncate">{application.applicant_phone}</span>
                    </div>}
                  
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Building className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="font-medium truncate">{application.company_name}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Applied: {new Date(application.created_at).toLocaleDateString()}
                  </div>
                  
                  {application.reviewed_at && <div className="text-xs sm:text-sm text-muted-foreground">
                      Reviewed: {new Date(application.reviewed_at).toLocaleDateString()}
                    </div>}
                </div>
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
                {application.license_number && <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">License</span>
                    </div>
                    <p className="text-sm">{application.license_number}</p>
                  </div>}
                
                {application.years_of_experience && <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Experience</span>
                    </div>
                    <p className="text-sm">{application.years_of_experience} years</p>
                  </div>}
                
                {application.company_website && <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Website</span>
                    </div>
                    <a href={application.company_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm break-all">
                      {application.company_website}
                    </a>
                  </div>}
              </div>

              {/* Accordion for Business Details */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="business-details" className="border-none">
                  <AccordionTrigger className="flex items-center gap-2 hover:no-underline pb-2 [&[data-state=open]>.accordion-icon]:rotate-180">
                    
                    <span className="text-sm font-medium">View Business Details</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    {/* Business Preferences */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg">Business Preferences</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm mb-2">Business Types</div>
                          <p className="text-sm text-muted-foreground">{application.business_types?.join(", ") || 'Not specified'}</p>
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm mb-2">Preferred Industries</div>
                          <p className="text-sm text-muted-foreground">{application.preferred_industries?.join(", ") || 'Not specified'}</p>
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm mb-2">Monthly Revenue Range</div>
                          <p className="text-sm text-muted-foreground">
                            {application.min_monthly_revenue || 'Not specified'} - {application.max_monthly_revenue || 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm mb-2">Min Time in Business</div>
                          <p className="text-sm text-muted-foreground">{application.min_time_in_business || 'Not specified'}</p>
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm mb-2">Min Credit Score</div>
                          <p className="text-sm text-muted-foreground">{application.min_credit_score || 'Not specified'}</p>
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm mb-2">Loan Amount Range</div>
                          <p className="text-sm text-muted-foreground">
                            {application.min_loan_amount || 'Not specified'} - {application.max_loan_amount || 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm mb-2">Funding Purposes</div>
                          <p className="text-sm text-muted-foreground">{application.funding_purposes?.join(", ") || 'Not specified'}</p>
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm mb-2">Geographic Areas</div>
                          <p className="text-sm text-muted-foreground">{application.geographic_areas?.join(", ") || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {application.business_description && <div>
                        <h4 className="font-medium mb-2">Business Description</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {application.business_description}
                        </p>
                      </div>}

                    {application.additional_requirements && <div>
                        <h4 className="font-medium mb-2">Special Requirements</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {application.additional_requirements}
                        </p>
                      </div>}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {application.rejection_reason && <div>
                  <h4 className="font-medium mb-2 text-destructive">Rejection Reason</h4>
                  <p className="text-sm text-destructive bg-destructive/5 p-3 rounded border border-destructive/20">
                    {application.rejection_reason}
                  </p>
                </div>}

              {isSuperAdmin && application.status === "pending" && <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => updateApplicationStatus(application.id, "approved")} disabled={processingId === application.id} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  
                  <Button variant="destructive" onClick={() => setShowRejectionForm(application.id)} disabled={processingId === application.id}>
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>}

              {showRejectionForm === application.id && <div className="space-y-3 pt-4 border-t">
                  <label className="text-sm font-medium">Rejection Reason</label>
                  <Textarea placeholder="Please provide a reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => updateApplicationStatus(application.id, "rejected", rejectionReason)} disabled={!rejectionReason.trim() || processingId === application.id}>
                      Confirm Rejection
                    </Button>
                    <Button variant="outline" onClick={() => {
                setShowRejectionForm(null);
                setRejectionReason("");
              }}>
                      Cancel
                    </Button>
                  </div>
                </div>}
            </CardContent>
          </Card>)}

        {filteredApplications.length === 0 && applications.length > 0 && <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No applications found matching your criteria</p>
            </CardContent>
          </Card>}

        {applications.length === 0 && <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No applications found</p>
            </CardContent>
          </Card>}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Application</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the application and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                To confirm deletion, please type <span className="font-mono bg-muted px-1 rounded">DELETE APPLICATION</span> below:
              </p>
              <Input 
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)} 
                placeholder="Type DELETE APPLICATION to confirm" 
                className="font-mono" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={deleteConfirmText !== 'DELETE APPLICATION'}
            >
              Delete Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};