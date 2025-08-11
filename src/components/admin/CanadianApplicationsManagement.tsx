import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Eye, Search, Filter, FileText, User, Building2, Phone, Mail, Download, Paperclip, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import { useAuth } from "@/hooks/use-auth";

interface CanadianApplication {
  id: string;
  application_reference_number: string;
  legal_business_name: string;
  dba_name?: string;
  email_address: string;
  business_phone: string;
  business_fax?: string;
  physical_address: string;
  mailing_address?: string;
  city: string;
  state: string;
  zip: string;
  type_of_entity: string;
  federal_tax_id: string;
  business_start_date: string;
  number_of_locations: number;
  business_property_type: string;
  landlord_or_bank_company_name?: string;
  landlord_or_bank_phone?: string;
  monthly_rent_or_mortgage?: number;
  annual_gross_sales: number;
  annual_credit_card_sales?: number;
  average_monthly_cc_volume?: number;
  current_credit_card_processor?: string;
  amount_requested: number;
  use_of_funds: string;
  existing_advance: boolean;
  outstanding_balance?: number;
  if_so_with_who?: string;
  principal_owner_name: string;
  principal_owner_name_2?: string;
  home_address: string;
  city_owner: string;
  state_owner: string;
  zip_owner: string;
  home_phone?: string;
  cell_phone?: string;
  home_address_2?: string;
  city_owner_2?: string;
  state_owner_2?: string;
  zip_owner_2?: string;
  home_phone_2?: string;
  cell_phone_2?: string;
  email_address_2?: string;
  dob: string;
  dob_2?: string;
  ssn: string;
  ssn_2?: string;
  ownership_percentage: number;
  ownership_percentage_2?: number;
  processing_statements?: any;
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
  company_name?: string;
  monthly_revenue: number;
  loan_amount: number;
  status: string;
  created_at: string;
  assigned_partner_id?: string;
}
interface CanadianApplicationsManagementProps {
  onCountUpdate?: () => void;
  restrictToQuizIds?: string[];
  partnerMode?: boolean;
}

const CanadianApplicationsManagement: React.FC<CanadianApplicationsManagementProps> = ({ onCountUpdate, restrictToQuizIds, partnerMode }) => {
  const { isSuperAdmin } = useAuth();
  const [applications, setApplications] = useState<CanadianApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<CanadianApplication[]>([]);
  const [quizResponses, setQuizResponses] = useState<Record<string, QuizResponse>>({});
  const [partners, setPartners] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<CanadianApplication | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, stageFilter]);

  // Auto-link applications without quiz by matching applicant email to quiz response email
  const autoLinkMissingApplications = async (apps: CanadianApplication[]) => {
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
            .from('canadian_applications')
            .update({ quiz_response_id: quizId, lead_source: 'quiz' })
            .eq('id', a.id);
          if (error) console.error('Auto-link (CAN) error', a.id, error);
          return !error;
        });

      const results = await Promise.all(updates);
      const successCount = results.filter(Boolean).length;
      if (successCount > 0) toast.success(`Auto-linked ${successCount} Canadian application(s) to quiz responses`);
      return successCount;
    } catch (e) {
      console.error('Auto-link (CAN) exception', e);
      return 0;
    }
  };

  const fetchApplications = async () => {
    try {
      // Partner mode: if restricted and empty, return nothing
      if (partnerMode && restrictToQuizIds && restrictToQuizIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('canadian_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (restrictToQuizIds && restrictToQuizIds.length > 0) {
        query = query.in('quiz_response_id', restrictToQuizIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      let apps = data || [];

      // Try to auto-link missing apps to quizzes by email (superadmin mode only)
      if (!partnerMode) {
        const linked = await autoLinkMissingApplications(apps);
        if (linked > 0) {
          const { data: refetched } = await supabase
            .from('canadian_applications')
            .select('*')
            .order('created_at', { ascending: false });
          apps = refetched || apps;
        }
      }

      setApplications(apps);

      // Fetch related quiz responses
      const quizIds = apps.filter(app => app.quiz_response_id).map(app => app.quiz_response_id) as string[];
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

          // Fetch partner information for assigned partners using edge function to bypass RLS
          const partnerIds = Array.from(new Set(
            quizData
              .filter(quiz => (quiz as any).assigned_partner_id)
              .map(quiz => (quiz as any).assigned_partner_id as string)
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
        app.legal_business_name.toLowerCase().includes(term) ||
        app.email_address.toLowerCase().includes(term) ||
        app.business_phone.includes(term)
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
        .from('canadian_applications')
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
  const [emailRecipient, setEmailRecipient] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [linkQuizModalOpen, setLinkQuizModalOpen] = useState(false);
  const [applicationToLink, setApplicationToLink] = useState<CanadianApplication | null>(null);
  const [availableQuizResponses, setAvailableQuizResponses] = useState<QuizResponse[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");

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
        .from('canadian_applications')
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
    doc.text('Canadian Business Loan Application', pageWidth / 2, y, { align: 'center' });
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
      ['Legal Business Name:', application.legal_business_name || 'N/A'],
      ['DBA Name:', application.dba_name || 'N/A'],
      ['Business Phone:', application.business_phone || 'N/A'],
      ['Email Address:', application.email_address || 'N/A'],
      ['Physical Address:', application.physical_address || 'N/A'],
      ['City:', application.city || 'N/A'],
      ['State/Province:', application.state || 'N/A'],
      ['ZIP/Postal Code:', application.zip || 'N/A'],
      ['Type of Entity:', application.type_of_entity || 'N/A'],
      ['Federal Tax ID:', application.federal_tax_id || 'N/A'],
      ['Business Start Date:', application.business_start_date || 'N/A'],
      ['Number of Locations:', application.number_of_locations || 'N/A'],
      ['Annual Gross Sales:', application.annual_gross_sales ? `$${application.annual_gross_sales.toLocaleString()}` : 'N/A'],
      ['Monthly Rent/Mortgage:', application.monthly_rent_or_mortgage ? `$${application.monthly_rent_or_mortgage.toLocaleString()}` : 'N/A']
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
      ['Name:', application.principal_owner_name || 'N/A'],
      ['Home Address:', application.home_address || 'N/A'],
      ['City:', application.city_owner || 'N/A'],
      ['State:', application.state_owner || 'N/A'],
      ['ZIP:', application.zip_owner || 'N/A'],
      ['Home Phone:', application.home_phone || 'N/A'],
      ['Cell Phone:', application.cell_phone || 'N/A'],
      ['Date of Birth:', application.dob || 'N/A'],
      ['SSN:', application.ssn || 'N/A'],
      ['Ownership %:', application.ownership_percentage || 'N/A']
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

    // Loan Information
    doc.setFontSize(14);
    doc.text('Loan Information', margin, y);
    y += 10;
    doc.setFontSize(10);

    const loanInfo = [
      ['Amount Requested:', application.amount_requested ? `$${application.amount_requested.toLocaleString()}` : 'N/A'],
      ['Use of Funds:', application.use_of_funds || 'N/A'],
      ['Existing Advance:', application.existing_advance ? 'Yes' : 'No'],
      ['Outstanding Balance:', application.outstanding_balance ? `$${application.outstanding_balance.toLocaleString()}` : 'N/A'],
      ['Current Processor:', application.current_credit_card_processor || 'N/A']
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

    doc.save(`Canadian_Application_${application.application_reference_number}.pdf`);
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

  const sendApplicationEmail = async () => {
    if (!emailRecipient || !selectedApplication) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRecipient)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsEmailSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-application-email', {
        body: {
          applicationId: selectedApplication.id,
          recipientEmail: emailRecipient,
          applicationType: 'canadian'
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        toast.error('Failed to send email');
        return;
      }

      toast.success(`Application details sent to ${emailRecipient} with ${data.attachmentCount} attachments`);
      setEmailRecipient("");
    } catch (error) {
      console.error('Error sending application email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsEmailSending(false);
    }
  };

  // Function to fetch available quiz responses for linking
  const fetchAvailableQuizResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .is('assigned_partner_id', null) // Only unassigned quiz responses
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAvailableQuizResponses(data || []);
    } catch (error) {
      console.error('Error fetching quiz responses:', error);
      toast.error("Failed to fetch quiz responses");
    }
  };

  // Function to open link quiz modal
  const openLinkQuizModal = (application: CanadianApplication) => {
    setApplicationToLink(application);
    setLinkQuizModalOpen(true);
    fetchAvailableQuizResponses();
  };

  // Function to close link quiz modal
  const closeLinkQuizModal = () => {
    setLinkQuizModalOpen(false);
    setApplicationToLink(null);
    setSelectedQuizId("");
    setAvailableQuizResponses([]);
  };

  // Function to link application to quiz response
  const linkApplicationToQuiz = async () => {
    if (!applicationToLink || !selectedQuizId) {
      toast.error("Please select a quiz response to link");
      return;
    }

    try {
      const { error } = await supabase
        .from('canadian_applications')
        .update({ 
          quiz_response_id: selectedQuizId,
          lead_source: 'quiz'
        })
        .eq('id', applicationToLink.id);

      if (error) throw error;

      toast.success("Application successfully linked to quiz response");
      fetchApplications(); // Refresh the applications list
      closeLinkQuizModal();
    } catch (error) {
      console.error('Error linking application to quiz:', error);
      toast.error("Failed to link application to quiz response");
    }
  };

  if (loading) {
    return <div>Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Canadian Applications Management</h2>
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
                      <span className="font-semibold">{application.legal_business_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {application.email_address}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {application.business_phone}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Loan Amount:</span>
                      <span className="text-green-600 font-semibold">
                        ${application.amount_requested.toLocaleString()}
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

                    {linkedQuiz?.assigned_partner_id && partners[linkedQuiz.assigned_partner_id] && (
                      <div className="text-sm text-purple-600">
                        <span className="font-medium">Assigned Partner:</span> {partners[linkedQuiz.assigned_partner_id].name}
                        <span className="ml-2 text-muted-foreground">
                          ({partners[linkedQuiz.assigned_partner_id].email})
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

                     {!application.quiz_response_id && (
                       <Button
                         variant="outline"
                         size="sm"
                         className="text-blue-600 border-blue-600 hover:bg-blue-50"
                         onClick={() => openLinkQuizModal(application)}
                       >
                         <ExternalLink className="h-4 w-4 mr-2" />
                         Link to Quiz
                       </Button>
                     )}

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
          <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
            <CardHeader className="flex flex-row items-center justify-between relative">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complete Application Details
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedApplication(null);
                  setNotes("");
                  setEmailRecipient("");
                }}
                className="absolute top-4 right-4 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <X className="h-4 w-4" />
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
                    <span className="font-medium text-muted-foreground">Legal Business Name:</span>
                    <p className="mt-1">{selectedApplication.legal_business_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">DBA Name:</span>
                    <p className="mt-1">{selectedApplication.dba_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Business Phone:</span>
                    <p className="mt-1">{selectedApplication.business_phone || 'N/A'}</p>
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
                    <span className="font-medium text-muted-foreground">State/Province:</span>
                    <p className="mt-1">{selectedApplication.state || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">ZIP/Postal Code:</span>
                    <p className="mt-1">{selectedApplication.zip || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Type of Entity:</span>
                    <p className="mt-1">{selectedApplication.type_of_entity || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Federal Tax ID:</span>
                    <p className="mt-1">{selectedApplication.federal_tax_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Business Start Date:</span>
                    <p className="mt-1">{selectedApplication.business_start_date ? new Date(selectedApplication.business_start_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Number of Locations:</span>
                    <p className="mt-1">{selectedApplication.number_of_locations || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Annual Gross Sales:</span>
                    <p className="mt-1 text-green-600 font-semibold">
                      {selectedApplication.annual_gross_sales ? `$${selectedApplication.annual_gross_sales.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Monthly Rent/Mortgage:</span>
                    <p className="mt-1">
                      {selectedApplication.monthly_rent_or_mortgage ? `$${selectedApplication.monthly_rent_or_mortgage.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Amount Requested:</span>
                    <p className="mt-1 text-primary font-bold text-lg">
                      {selectedApplication.amount_requested ? `$${selectedApplication.amount_requested.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Annual Credit Card Sales:</span>
                    <p className="mt-1">
                      {selectedApplication.annual_credit_card_sales ? `$${selectedApplication.annual_credit_card_sales.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Avg Monthly CC Volume:</span>
                    <p className="mt-1">
                      {selectedApplication.average_monthly_cc_volume ? `$${selectedApplication.average_monthly_cc_volume.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Current Processor:</span>
                    <p className="mt-1">{selectedApplication.current_credit_card_processor || 'N/A'}</p>
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
                    <p className="mt-1">{selectedApplication.principal_owner_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Home Address:</span>
                    <p className="mt-1">{selectedApplication.home_address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">City:</span>
                    <p className="mt-1">{selectedApplication.city_owner || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">State:</span>
                    <p className="mt-1">{selectedApplication.state_owner || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">ZIP:</span>
                    <p className="mt-1">{selectedApplication.zip_owner || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Date of Birth:</span>
                    <p className="mt-1">{selectedApplication.dob ? new Date(selectedApplication.dob).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Home Phone:</span>
                    <p className="mt-1">{selectedApplication.home_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Cell Phone:</span>
                    <p className="mt-1">{selectedApplication.cell_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Ownership Percentage:</span>
                    <p className="mt-1">{selectedApplication.ownership_percentage ? `${selectedApplication.ownership_percentage}%` : 'N/A'}</p>
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
                    <span className="font-medium text-muted-foreground">Existing Advance:</span>
                    <p className="mt-1">{selectedApplication.existing_advance ? 'Yes' : 'No'}</p>
                  </div>
                  {selectedApplication.existing_advance && (
                    <div>
                      <span className="font-medium text-muted-foreground">Outstanding Balance:</span>
                      <p className="mt-1">
                        {selectedApplication.outstanding_balance ? `$${selectedApplication.outstanding_balance.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-muted-foreground">With Who:</span>
                    <p className="mt-1">{selectedApplication.if_so_with_who || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              {((selectedApplication.processing_statements && Array.isArray(selectedApplication.processing_statements) && selectedApplication.processing_statements.length > 0) ||
                (selectedApplication.document_files && Array.isArray(selectedApplication.document_files) && selectedApplication.document_files.length > 0)) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Uploaded Documents
                  </h3>
                  <div className="space-y-4">
                    {selectedApplication.processing_statements && Array.isArray(selectedApplication.processing_statements) && selectedApplication.processing_statements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Processing Statements:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedApplication.processing_statements.map((file: any, index: number) => {
                            const hasValidPath = file.path || file.url;
                            return (
                              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                                <FileText className="h-4 w-4 text-primary" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name || `Processing Statement ${index + 1}`}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                    {!hasValidPath && ' - No file path'}
                                  </p>
                                </div>
                                {hasValidPath ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadFileFromStorage(file.path || file.url, file.name || `processing-statement-${index + 1}`)}
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
                    )}

                    {selectedApplication.document_files && Array.isArray(selectedApplication.document_files) && selectedApplication.document_files.length > 0 && (
                      <div>
                        <h4 className="font-medium text-muted-foreground mb-2">Supporting Documents:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedApplication.document_files.map((file: any, index: number) => {
                            // Handle both string paths and file objects
                            const filePath = typeof file === 'string' ? file : (file.path || file.url);
                            const fileName = typeof file === 'string' 
                              ? file.split('/').pop()?.replace(/^\d+-/, '') || `Document ${index + 1}` 
                              : file.name || `Document ${index + 1}`;
                            const fileSize = typeof file === 'string' ? null : file.size;
                            const hasValidPath = !!filePath;
                            
                            return (
                              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                                <FileText className="h-4 w-4 text-primary" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                                    {!hasValidPath && ' - No file path'}
                                  </p>
                                </div>
                                {hasValidPath ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadFileFromStorage(filePath, fileName)}
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
                    )}
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

                {/* Email Application Section */}
                <div className="mt-6 p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Complete Application
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="Enter recipient email address..."
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button
                      onClick={sendApplicationEmail}
                      disabled={isEmailSending || !emailRecipient}
                      className="sm:w-auto w-full"
                    >
                      {isEmailSending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This will send complete application details and all uploaded documents as attachments.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
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

      {/* Link to Quiz Modal */}
      <Dialog open={linkQuizModalOpen} onOpenChange={setLinkQuizModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Link Application to Quiz Response
            </DialogTitle>
            <DialogDescription>
              Connect this Canadian application to an existing quiz response to enable lead tracking and partner assignment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {applicationToLink && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">Application to Link:</p>
                <p className="text-sm text-muted-foreground">
                  {applicationToLink.application_reference_number} - {applicationToLink.legal_business_name}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Select Quiz Response:</span>
              <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a quiz response to link..." />
                </SelectTrigger>
                <SelectContent>
                  {availableQuizResponses.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{quiz.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {quiz.email} - ${quiz.monthly_revenue?.toLocaleString()}/mo - {quiz.company_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {availableQuizResponses.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No available quiz responses found.</p>
                <p className="text-xs mt-1">Only quiz responses without partner assignments are shown.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeLinkQuizModal}>
              Cancel
            </Button>
            <Button 
              onClick={linkApplicationToQuiz} 
              disabled={!selectedQuizId}
            >
              Link Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CanadianApplicationsManagement;