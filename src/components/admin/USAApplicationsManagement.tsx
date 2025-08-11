import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Eye, Search, Filter, FileText, User, Building2, Phone, Mail, Download, Paperclip, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import { useAuth } from "@/hooks/use-auth";

interface USAApplication {
  id: string;
  application_reference_number: string;
  legal_corporation_name: string;
  dba_name?: string;
  physical_address: string;
  city: string;
  state: string;
  zip: string;
  telephone_number: string;
  fax_number?: string;
  website?: string;
  email_address: string;
  entity_type: string;
  federal_tax_id: string;
  state_tax_id?: string;
  date_incorporated?: string;
  state_of_incorporation?: string;
  business_type: string;
  business_description: string;
  years_in_business: number;
  months_in_business: number;
  number_of_employees: number;
  monthly_rent_mortgage: number;
  loan_amount_requested: number;
  use_of_funds: string;
  principal_name: string;
  principal_title: string;
  principal_email: string;
  principal_date_of_birth: string;
  principal_ssn: string;
  principal_home_address: string;
  principal_city: string;
  principal_state: string;
  principal_zip: string;
  principal_home_phone?: string;
  principal_cell_phone?: string;
  principal_ownership_percentage: number;
  bank_name: string;
  bank_account_type: string;
  bank_routing_number: string;
  bank_account_number: string;
  months_with_bank: number;
  average_monthly_deposits: number;
  accept_cards: string[];
  current_processor?: string;
  mid_number?: string;
  monthly_processing_volume?: number;
  average_ticket?: number;
  high_ticket?: number;
  document_files?: any;
  status: string;
  conversion_stage: string;
  lead_source: string;
  quiz_response_id?: string;
  user_id?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface QuizResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthly_revenue: number;
  loan_amount: number;
  status: string;
  created_at: string;
  assigned_partner_id?: string;
}

interface USAApplicationsManagementProps {
  onCountUpdate?: () => void;
  restrictToQuizIds?: string[];
  partnerMode?: boolean;
}

export const USAApplicationsManagement: React.FC<USAApplicationsManagementProps> = ({ onCountUpdate, restrictToQuizIds, partnerMode }) => {
  const { isSuperAdmin } = useAuth();
  const [applications, setApplications] = useState<USAApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<USAApplication[]>([]);
  const [quizResponses, setQuizResponses] = useState<Record<string, QuizResponse>>({});
  const [partners, setPartners] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<USAApplication | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, stageFilter]);

  // Auto-link applications without quiz by matching applicant email to quiz response email
  const autoLinkMissingApplications = async (apps: USAApplication[]) => {
    try {
      const missing = apps.filter((a) => !a.quiz_response_id);
      if (missing.length === 0) return 0;

      const emails = Array.from(new Set(missing.map((a) => a.email_address).filter(Boolean)));
      if (emails.length === 0) return 0;

      const { data: qr, error: qrErr } = await supabase
        .from('quiz_responses')
        .select('id,email,assigned_partner_id')
        .in('email', emails);

      if (qrErr || !qr) return 0;

      const emailToQuiz = new Map<string, string>();
      const duplicates = new Set<string>();
      qr.forEach((q: any) => {
        const e = q.email as string;
        if (!e) return;
        if (emailToQuiz.has(e)) duplicates.add(e);
        else emailToQuiz.set(e, q.id as string);
      });

      const updates = missing
        .filter((a) => emailToQuiz.has(a.email_address) && !duplicates.has(a.email_address))
        .map(async (a) => {
          const quizId = emailToQuiz.get(a.email_address)!;
          const { error } = await supabase
            .from('usa_applications')
            .update({ quiz_response_id: quizId, lead_source: 'quiz' })
            .eq('id', a.id);
          if (error) console.error('Auto-link (USA) error', a.id, error);
          return !error;
        });

      const results = await Promise.all(updates);
      const successCount = results.filter(Boolean).length;
      if (successCount > 0) toast.success(`Auto-linked ${successCount} USA application(s) to quiz responses`);
      return successCount;
    } catch (e) {
      console.error('Auto-link (USA) exception', e);
      return 0;
    }
  };

  useEffect(() => {
    if (partnerMode) return; // Skip auto-linking in partner mode
    let cancelled = false;
    const run = async () => {
      const missing = applications.filter((a) => !a.quiz_response_id);
      if (missing.length === 0) return;
      const linked = await autoLinkMissingApplications(applications);
      if (!cancelled && linked > 0) {
        fetchApplications();
      }
    };
    run();
    return () => { cancelled = true; };
  }, [applications, partnerMode]);

  const fetchApplications = async () => {
    try {
      // Partner mode: if we have explicit restrictions and none found, return empty
      if (partnerMode && restrictToQuizIds && restrictToQuizIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('usa_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (restrictToQuizIds && restrictToQuizIds.length > 0) {
        query = query.in('quiz_response_id', restrictToQuizIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      setApplications(data || []);

      // Fetch related quiz responses and assigned partners
      const quizIds = data?.filter(app => app.quiz_response_id).map(app => app.quiz_response_id) || [];
      if (quizIds.length > 0) {
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_responses')
          .select('*')
          .in('id', quizIds);

        if (!quizError && quizData) {
          const quizMap = quizData.reduce((acc, quiz) => {
            acc[quiz.id] = quiz;
            return acc;
          }, {} as Record<string, QuizResponse>);
          setQuizResponses(quizMap);

          const partnerIds = Array.from(new Set(
            quizData.filter(q => (q as any).assigned_partner_id).map(q => (q as any).assigned_partner_id as string)
          ));
          if (partnerIds.length > 0) {
            const { data: partnerResp, error: partnerErr } = await supabase.functions.invoke('get-partners-basic', {
              body: { ids: partnerIds }
            });
            if (!partnerErr && partnerResp?.partners) {
              const partnerMap = (partnerResp.partners as Array<{ id: string; name: string; email: string }>).reduce((acc, p) => {
                acc[p.id] = { name: p.name, email: p.email };
                return acc;
              }, {} as Record<string, { name: string; email: string }>);
              setPartners(partnerMap);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.application_reference_number.toLowerCase().includes(term) ||
        app.legal_corporation_name.toLowerCase().includes(term) ||
        app.email_address.toLowerCase().includes(term) ||
        app.telephone_number.includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter(app => app.conversion_stage === stageFilter);
    }

    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updateData: any = { 
        status,
        conversion_stage: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'in_review'
      };
      
      if (notes) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('usa_applications')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success("Application status updated successfully");
      fetchApplications();
      setSelectedApplication(null);
      setNotes("");
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error("Failed to update application status");
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<{id: string, refNumber: string} | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const openDeleteModal = (id: string, refNumber: string) => {
    setApplicationToDelete({id, refNumber});
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setApplicationToDelete(null);
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE APPLICATION') {
      toast.error("Please type exactly 'DELETE APPLICATION' to confirm deletion");
      return;
    }

    if (!applicationToDelete) return;

    try {
      const { error } = await supabase
        .from('usa_applications')
        .delete()
        .eq('id', applicationToDelete.id);

      if (error) throw error;

      toast.success("Application deleted successfully");
      fetchApplications();
      onCountUpdate?.();
      // Close modal if the deleted application was being viewed
      if (selectedApplication?.id === applicationToDelete.id) {
        setSelectedApplication(null);
        setNotes("");
      }
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error("Failed to delete application");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'applicant': 'default',
      'in_review': 'secondary',
      'approved': 'default',
      'rejected': 'destructive'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getStageBadge = (stage: string) => {
    const colors: Record<string, string> = {
      'lead': 'bg-blue-100 text-blue-800',
      'application': 'bg-yellow-100 text-yellow-800',
      'in_review': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[stage] || 'bg-gray-100 text-gray-800'}`}>
        {stage}
      </span>
    );
  };

  const getSourceBadge = (source: string) => {
    return source === 'quiz' ? (
      <Badge variant="outline" className="text-green-600 border-green-600">Quiz Lead</Badge>
    ) : (
      <Badge variant="outline">Direct</Badge>
    );
  };

  const downloadApplicationPDF = (application: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Header
    doc.setFontSize(18);
    doc.text('USA Business Loan Application', pageWidth / 2, y, { align: 'center' });
    y += 20;

    doc.setFontSize(12);
    doc.text(`Reference: ${application.application_reference_number}`, margin, y);
    y += 10;
    doc.text(`Status: ${application.status}`, margin, y);
    y += 10;
    doc.text(`Applied: ${new Date(application.created_at).toLocaleDateString()}`, margin, y);
    y += 20;

    // Business Information
    doc.setFontSize(14);
    doc.text('Business Information', margin, y);
    y += 10;
    doc.setFontSize(10);
    
    const businessInfo = [
      ['Legal Corporation Name:', application.legal_corporation_name || 'N/A'],
      ['DBA Name:', application.dba_name || 'N/A'],
      ['Business Phone:', application.telephone_number || 'N/A'],
      ['Email Address:', application.email_address || 'N/A'],
      ['Physical Address:', application.physical_address || 'N/A'],
      ['City:', application.city || 'N/A'],
      ['State:', application.state || 'N/A'],
      ['ZIP Code:', application.zip || 'N/A'],
      ['Entity Type:', application.entity_type || 'N/A'],
      ['Federal Tax ID:', application.federal_tax_id || 'N/A'],
      ['Years in Business:', `${application.years_in_business} years, ${application.months_in_business} months` || 'N/A'],
      ['Number of Employees:', application.number_of_employees || 'N/A'],
      ['Monthly Rent/Mortgage:', application.monthly_rent_mortgage ? `$${application.monthly_rent_mortgage.toLocaleString()}` : 'N/A'],
      ['Average Monthly Deposits:', application.average_monthly_deposits ? `$${application.average_monthly_deposits.toLocaleString()}` : 'N/A']
    ];

    businessInfo.forEach(([label, value]) => {
      doc.text(`${label} ${value}`, margin, y);
      y += 8;
      if (y > 250) {
        doc.addPage();
        y = margin;
      }
    });

    y += 10;

    // Principal Owner Information
    doc.setFontSize(14);
    doc.text('Principal Owner Information', margin, y);
    y += 10;
    doc.setFontSize(10);

    const ownerInfo = [
      ['Name:', application.principal_name || 'N/A'],
      ['Title:', application.principal_title || 'N/A'],
      ['Email:', application.principal_email || 'N/A'],
      ['Home Address:', application.principal_home_address || 'N/A'],
      ['City:', application.principal_city || 'N/A'],
      ['State:', application.principal_state || 'N/A'],
      ['ZIP:', application.principal_zip || 'N/A'],
      ['Home Phone:', application.principal_home_phone || 'N/A'],
      ['Cell Phone:', application.principal_cell_phone || 'N/A'],
      ['Date of Birth:', application.principal_date_of_birth ? new Date(application.principal_date_of_birth).toLocaleDateString() : 'N/A'],
      ['SSN:', application.principal_ssn || 'N/A'],
      ['Ownership %:', application.principal_ownership_percentage ? `${application.principal_ownership_percentage}%` : 'N/A']
    ];

    ownerInfo.forEach(([label, value]) => {
      doc.text(`${label} ${value}`, margin, y);
      y += 8;
      if (y > 250) {
        doc.addPage();
        y = margin;
      }
    });

    y += 10;

    // Banking Information
    doc.setFontSize(14);
    doc.text('Banking Information', margin, y);
    y += 10;
    doc.setFontSize(10);

    const bankingInfo = [
      ['Bank Name:', application.bank_name || 'N/A'],
      ['Account Type:', application.bank_account_type || 'N/A'],
      ['Routing Number:', application.bank_routing_number || 'N/A'],
      ['Account Number:', application.bank_account_number ? '****' + application.bank_account_number.slice(-4) : 'N/A'],
      ['Months with Bank:', application.months_with_bank || 'N/A']
    ];

    bankingInfo.forEach(([label, value]) => {
      doc.text(`${label} ${value}`, margin, y);
      y += 8;
    });

    y += 10;

    // Loan Information
    doc.setFontSize(14);
    doc.text('Loan Information', margin, y);
    y += 10;
    doc.setFontSize(10);

    const loanInfo = [
      ['Amount Requested:', application.loan_amount_requested ? `$${application.loan_amount_requested.toLocaleString()}` : 'N/A'],
      ['Use of Funds:', application.use_of_funds || 'N/A'],
      ['Current Processor:', application.current_processor || 'N/A'],
      ['Monthly Processing Volume:', application.monthly_processing_volume ? `$${application.monthly_processing_volume.toLocaleString()}` : 'N/A'],
      ['Average Ticket:', application.average_ticket ? `$${application.average_ticket.toLocaleString()}` : 'N/A'],
      ['High Ticket:', application.high_ticket ? `$${application.high_ticket.toLocaleString()}` : 'N/A']
    ];

    loanInfo.forEach(([label, value]) => {
      doc.text(`${label} ${value}`, margin, y);
      y += 8;
    });

    if (application.admin_notes) {
      y += 10;
      doc.setFontSize(14);
      doc.text('Admin Notes', margin, y);
      y += 10;
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(application.admin_notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, y);
    }

    doc.save(`USA_Application_${application.application_reference_number}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const downloadFileFromStorage = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('application-documents')
        .download(filePath);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error("Failed to download file");
    }
  };

  if (loading) {
    return <div>Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">USA Applications Management</h2>
        <div className="text-sm text-muted-foreground">
          Total: {applications.length} | Showing: {filteredApplications.length}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, company, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="applicant">Applicant</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setStageFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.map((application) => {
          const linkedQuiz = application.quiz_response_id ? quizResponses[application.quiz_response_id] : null;
          
          return (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm font-bold text-primary">
                        {application.application_reference_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{application.legal_corporation_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {application.email_address}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {application.telephone_number}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Loan Amount:</span>
                      <span className="text-green-600 font-semibold">
                        ${application.loan_amount_requested.toLocaleString()}
                      </span>
                    </div>

                    {linkedQuiz && (
                      <div className="text-sm text-blue-600">
                        <span className="font-medium">Linked Quiz Lead:</span> {linkedQuiz.name}
                        <span className="ml-2">
                          (Quiz Score: {linkedQuiz.monthly_revenue ? `$${linkedQuiz.monthly_revenue.toLocaleString()}/mo` : 'N/A'})
                        </span>
                      </div>
                    )}

                    {linkedQuiz?.assigned_partner_id && partners[linkedQuiz.assigned_partner_id as any] && (
                      <div className="text-sm text-purple-600">
                        <span className="font-medium">Assigned Partner:</span> {partners[linkedQuiz.assigned_partner_id as any].name}
                        <span className="ml-2 text-muted-foreground">
                          ({partners[linkedQuiz.assigned_partner_id as any].email})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Stage:</span>
                        {getStageBadge(application.conversion_stage)}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Source:</span>
                        {getSourceBadge(application.lead_source)}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div>Applied: {new Date(application.created_at).toLocaleDateString()}</div>
                      <div>Updated: {new Date(application.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>

                    {linkedQuiz && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin?tab=quiz&id=${linkedQuiz.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Quiz
                      </Button>
                    )}

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => updateApplicationStatus(application.id, 'approved')}
                        disabled={application.status === 'approved'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => updateApplicationStatus(application.id, 'rejected')}
                        disabled={application.status === 'rejected'}
                      >
                        Reject
                      </Button>
                    </div>

                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => openDeleteModal(application.id, application.application_reference_number)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {application.admin_notes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Admin Notes:</span>
                    <p className="text-sm mt-1">{application.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complete Application Details
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadApplicationPDF(selectedApplication)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Application Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Reference Number</span>
                  <p className="font-mono font-bold text-primary">{selectedApplication.application_reference_number}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Application Date</span>
                  <p className="font-medium">{new Date(selectedApplication.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Legal Corporation Name:</span>
                    <p className="mt-1">{selectedApplication.legal_corporation_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">DBA Name:</span>
                    <p className="mt-1">{selectedApplication.dba_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Business Phone:</span>
                    <p className="mt-1">{selectedApplication.telephone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Email Address:</span>
                    <p className="mt-1">{selectedApplication.email_address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Physical Address:</span>
                    <p className="mt-1">{selectedApplication.physical_address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">City:</span>
                    <p className="mt-1">{selectedApplication.city || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">State:</span>
                    <p className="mt-1">{selectedApplication.state || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">ZIP Code:</span>
                    <p className="mt-1">{selectedApplication.zip || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Entity Type:</span>
                    <p className="mt-1">{selectedApplication.entity_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Federal Tax ID:</span>
                    <p className="mt-1">{selectedApplication.federal_tax_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Business Type:</span>
                    <p className="mt-1">{selectedApplication.business_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Time in Business:</span>
                    <p className="mt-1">{selectedApplication.years_in_business ? `${selectedApplication.years_in_business} years, ${selectedApplication.months_in_business} months` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Average Monthly Deposits:</span>
                    <p className="mt-1 text-green-600 font-semibold">
                      {selectedApplication.average_monthly_deposits ? `$${selectedApplication.average_monthly_deposits.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Monthly Rent/Mortgage:</span>
                    <p className="mt-1">
                      {selectedApplication.monthly_rent_mortgage ? `$${selectedApplication.monthly_rent_mortgage.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Loan Amount Requested:</span>
                    <p className="mt-1 text-primary font-bold text-lg">
                      {selectedApplication.loan_amount_requested ? `$${selectedApplication.loan_amount_requested.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Monthly Processing Volume:</span>
                    <p className="mt-1">
                      {selectedApplication.monthly_processing_volume ? `$${selectedApplication.monthly_processing_volume.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Average Ticket:</span>
                    <p className="mt-1">
                      {selectedApplication.average_ticket ? `$${selectedApplication.average_ticket.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">High Ticket:</span>
                    <p className="mt-1">
                      {selectedApplication.high_ticket ? `$${selectedApplication.high_ticket.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Principal Owner Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Principal Owner Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Name:</span>
                    <p className="mt-1">{selectedApplication.principal_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Title:</span>
                    <p className="mt-1">{selectedApplication.principal_title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <p className="mt-1">{selectedApplication.principal_email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Home Address:</span>
                    <p className="mt-1">{selectedApplication.principal_home_address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">City:</span>
                    <p className="mt-1">{selectedApplication.principal_city || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">State:</span>
                    <p className="mt-1">{selectedApplication.principal_state || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">ZIP:</span>
                    <p className="mt-1">{selectedApplication.principal_zip || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Date of Birth:</span>
                    <p className="mt-1">{selectedApplication.principal_date_of_birth ? new Date(selectedApplication.principal_date_of_birth).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Home Phone:</span>
                    <p className="mt-1">{selectedApplication.principal_home_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Cell Phone:</span>
                    <p className="mt-1">{selectedApplication.principal_cell_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Ownership Percentage:</span>
                    <p className="mt-1">{selectedApplication.principal_ownership_percentage ? `${selectedApplication.principal_ownership_percentage}%` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Bank Name:</span>
                    <p className="mt-1">{selectedApplication.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Account Type:</span>
                    <p className="mt-1">{selectedApplication.bank_account_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Months with Bank:</span>
                    <p className="mt-1">{selectedApplication.months_with_bank || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Current Processor:</span>
                    <p className="mt-1">{selectedApplication.current_processor || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Loan Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Use of Funds:</span>
                    <p className="mt-1">{selectedApplication.use_of_funds || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Accepted Cards:</span>
                    <p className="mt-1">{selectedApplication.accept_cards && Array.isArray(selectedApplication.accept_cards) ? selectedApplication.accept_cards.join(', ') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              {(selectedApplication.document_files && Array.isArray(selectedApplication.document_files) && selectedApplication.document_files.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Uploaded Documents
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-2">Supporting Documents:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedApplication.document_files.map((file: any, index: number) => {
                          const hasValidPath = file.path || file.url;
                          return (
                            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                              <FileText className="h-4 w-4 text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name || `Document ${index + 1}`}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                  {!hasValidPath && ' - No file path'}
                                </p>
                              </div>
                              {hasValidPath ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadFileFromStorage(file.path || file.url, file.name || `document-${index + 1}`)}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" disabled>
                                  No File
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Admin Section</h3>
                
                {selectedApplication.admin_notes && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Existing Admin Notes:</span>
                    <p className="text-sm mt-1">{selectedApplication.admin_notes}</p>
                  </div>
                )}

                <div className="mb-4">
                  <span className="text-sm font-medium">Add/Update Admin Notes:</span>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes about this application..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'approved', notes)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve Application
                  </Button>
                  <Button
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected', notes)}
                    variant="destructive"
                  >
                    Reject Application
                  </Button>
                  <Button
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'in_review', notes)}
                    variant="outline"
                  >
                    Mark In Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadApplicationPDF(selectedApplication)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedApplication(null);
                      setNotes("");
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Application</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete application {applicationToDelete?.refNumber} and all associated data.
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
    </div>
  );
};

export default USAApplicationsManagement;