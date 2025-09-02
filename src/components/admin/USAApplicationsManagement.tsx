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

interface USASimplifiedApplication {
  id: string;
  application_reference_number: string | null;
  legal_corporation_name: string;
  email_address: string;
  telephone_number: string;
  loan_amount_requested: number;
  status: string;
  conversion_stage: string | null;
  lead_source: string | null;
  quiz_response_id?: string | null;
  user_id?: string | null;
  admin_notes?: string | null;
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

interface USADraft {
  id: string;
  user_id?: string;
  form_data: any;
  current_step: number;
  last_updated: string;
  quiz_response_id?: string;
  created_at: string;
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
const [simplifiedApps, setSimplifiedApps] = useState<USASimplifiedApplication[]>([]);
const [filteredSimplifiedApps, setFilteredSimplifiedApps] = useState<USASimplifiedApplication[]>([]);
const [quizResponses, setQuizResponses] = useState<Record<string, QuizResponse>>({});
const [partners, setPartners] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState<'all' | LeadStatus>('all');
  const [appTypeFilter, setAppTypeFilter] = useState<'all' | 'complete' | 'draft'>('all');
  const [selectedApplication, setSelectedApplication] = useState<USAApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState<USADraft[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<USADraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<USADraft | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

useEffect(() => {
  filterApplications();
}, [applications, simplifiedApps, searchTerm, leadFilter, appTypeFilter]);

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
        setDrafts([]);
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

// Fetch USA applications (2-step simplified)
let simplifiedQuery = supabase
  .from('usa_applications_simplified')
  .select('*')
  .order('created_at', { ascending: false });
if (restrictToQuizIds && restrictToQuizIds.length > 0) {
  simplifiedQuery = simplifiedQuery.in('quiz_response_id', restrictToQuizIds);
}
const { data: simplifiedData, error: simplifiedError } = await simplifiedQuery;
if (simplifiedError) throw simplifiedError;
setSimplifiedApps(simplifiedData || []);

// Fetch USA application drafts
let draftQuery = supabase
  .from('usa_application_drafts')
  .select('*')
  .order('last_updated', { ascending: false });
if (restrictToQuizIds && restrictToQuizIds.length > 0) {
  draftQuery = draftQuery.in('quiz_response_id', restrictToQuizIds);
}
const { data: draftData, error: draftError } = await draftQuery;
if (!draftError) {
  setDrafts(draftData || []);
}

// Fetch related quiz responses and assigned partners
const quizIds = Array.from(new Set([
  ...(data?.filter(a => a.quiz_response_id).map(a => a.quiz_response_id!) || []),
  ...(simplifiedData?.filter(a => a.quiz_response_id).map(a => a.quiz_response_id!) || []),
]));
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
  // Filter complete applications
  let filtered = [...applications];

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(app =>
      (app.application_reference_number || '').toLowerCase().includes(term) ||
      app.legal_corporation_name.toLowerCase().includes(term) ||
      app.email_address.toLowerCase().includes(term) ||
      app.telephone_number.includes(term)
    );
  }

  if (leadFilter !== 'all') {
    filtered = filtered.filter(app => {
      if (!app.quiz_response_id) return false;
      const lead = quizResponses[app.quiz_response_id];
      const normalized = normalizeLeadStatus(lead?.status);
      return normalized === leadFilter;
    });
  }

  // Apply application type filter visibility
  const showComplete = appTypeFilter !== 'draft';
  const showDraft = appTypeFilter !== 'complete';

  setFilteredApplications(showComplete ? filtered : []);

  // Filter simplified applications
  let simplifiedFiltered = [...simplifiedApps];
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    simplifiedFiltered = simplifiedFiltered.filter(app =>
      (app.application_reference_number || '').toLowerCase().includes(term) ||
      app.legal_corporation_name.toLowerCase().includes(term) ||
      app.email_address.toLowerCase().includes(term) ||
      (app.telephone_number || '').toLowerCase().includes(term)
    );
  }
  if (leadFilter !== 'all') {
    simplifiedFiltered = simplifiedFiltered.filter(app => {
      if (!app.quiz_response_id) return false;
      const lead = quizResponses[app.quiz_response_id!];
      const normalized = normalizeLeadStatus(lead?.status);
      return normalized === leadFilter;
    });
  }
  setFilteredSimplifiedApps(showComplete ? simplifiedFiltered : []);

  // Filter drafts using the same search term
  let draftFiltered = drafts;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    draftFiltered = drafts.filter((d) => {
      const fd = (d as any).form_data || {};
      const company = String(fd.legal_corporation_name || fd.legal_business_name || '').toLowerCase();
      const email = String(fd.email_address || '').toLowerCase();
      const phone = String(fd.telephone_number || fd.business_phone || '').toLowerCase();
      return company.includes(term) || email.includes(term) || phone.includes(term);
    });
  }
  setFilteredDrafts(showDraft ? draftFiltered : []);
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

      // Sync lead status from application status when possible
      const app = applications.find(a => a.id === id);
      if (app?.quiz_response_id) {
        const newLeadStatus = appStatusToLeadStatus(status);
        await supabase
          .from('quiz_responses')
          .update({ status: newLeadStatus })
          .eq('id', app.quiz_response_id);
      }

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

  // Draft delete management
  const [draftDeleteModalOpen, setDraftDeleteModalOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<USADraft | null>(null);
  const [draftDeleteConfirmText, setDraftDeleteConfirmText] = useState('');

  const openDraftDeleteModal = (draft: USADraft) => {
    setDraftToDelete(draft);
    setDraftDeleteModalOpen(true);
  };

  const closeDraftDeleteModal = () => {
    setDraftDeleteModalOpen(false);
    setDraftToDelete(null);
    setDraftDeleteConfirmText('');
  };

  const confirmDraftDelete = async () => {
    if (draftDeleteConfirmText !== 'DELETE DRAFT') {
      toast.error("Please type exactly 'DELETE DRAFT' to confirm deletion");
      return;
    }
    if (!draftToDelete) return;
    try {
      const { error } = await supabase
        .from('usa_application_drafts')
        .delete()
        .eq('id', draftToDelete.id);
      if (error) throw error;
      toast.success('Draft deleted successfully');
      onCountUpdate?.();
      fetchApplications();
      closeDraftDeleteModal();
    } catch (e) {
      console.error('Error deleting draft:', e);
      toast.error('Failed to delete draft');
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

  // Lead/Application status sync helpers
  const LEAD_STATUS_OPTIONS = ['New','No Answer','Wrong Number','Contacted','Application Sent','Disqualified','Loan Approved'] as const;
  type LeadStatus = typeof LEAD_STATUS_OPTIONS[number];

  const normalizeLeadStatus = (s?: string | null): LeadStatus => {
    switch ((s || '').toLowerCase()) {
      case 'new':
        return 'New';
      case 'no answer':
        return 'No Answer';
      case 'wrong number':
        return 'Wrong Number';
      case 'contacted':
      case 'assigned':
      case 'spoken':
        return 'Contacted';
      case 'application sent':
      case 'application_sent':
        return 'Application Sent';
      case 'disqualified':
      case 'closed':
        return 'Disqualified';
      case 'loan approved':
      case 'loan_approved':
        return 'Loan Approved';
      default:
        return 'New';
    }
  };

  const leadStatusToAppStatus = (s: LeadStatus): 'applicant' | 'in_review' | 'approved' | 'rejected' => {
    switch (s) {
      case 'Loan Approved':
        return 'approved';
      case 'Disqualified':
        return 'rejected';
      case 'Application Sent':
      case 'Contacted':
      case 'No Answer':
      case 'Wrong Number':
        return 'in_review';
      case 'New':
      default:
        return 'applicant';
    }
  };

  const appStatusToLeadStatus = (s: string): LeadStatus => {
    switch (s) {
      case 'approved':
        return 'Loan Approved';
      case 'rejected':
        return 'Disqualified';
      case 'in_review':
        return 'Application Sent';
      case 'applicant':
      default:
        return 'New';
    }
  };

  const updateLeadStatusAndSync = async (application: USAApplication, newStatus: LeadStatus) => {
    if (!application.quiz_response_id) {
      toast.error('No linked lead to update');
      return;
    }
    try {
      const { error: qErr } = await supabase
        .from('quiz_responses')
        .update({ status: newStatus })
        .eq('id', application.quiz_response_id);
      if (qErr) throw qErr;

      const newAppStatus = leadStatusToAppStatus(newStatus);
      await supabase
        .from('usa_applications')
        .update({
          status: newAppStatus,
          conversion_stage: newAppStatus === 'approved' ? 'approved' : newAppStatus === 'rejected' ? 'rejected' : 'in_review'
        })
        .eq('id', application.id);

      toast.success('Lead status updated');
      fetchApplications();
    } catch (e) {
      console.error('Error updating lead status:', e);
      toast.error('Failed to update lead status');
    }
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
      console.log('Attempting to download file:', { filePath, fileName });
      
      if (!filePath) {
        throw new Error('File path is empty or undefined');
      }

      // Extract relative path from full URL if it's a Supabase storage URL
      let relativePath = filePath;
      const publicMatch = filePath.match(/\/storage\/v1\/object\/public\/application-documents\/(.+)$/);
      const privateMatch = filePath.match(/\/storage\/v1\/object\/application-documents\/(.+)$/);
      if (publicMatch) {
        relativePath = publicMatch[1];
      } else if (privateMatch) {
        relativePath = privateMatch[1];
      } else {
        const idx = filePath.lastIndexOf('applications/');
        if (idx !== -1) {
          relativePath = filePath.substring(idx);
        }
      }

      // Try downloading from Supabase storage first
      try {
        const { data, error } = await supabase.storage
          .from('application-documents')
          .download(relativePath);

        if (error) throw error;

        if (!data) {
          throw new Error('No file data received from storage');
        }

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
        return;
      } catch (storageError) {
        console.warn('Storage download failed, trying signed URL then direct fetch:', storageError);
        
        // Attempt to generate a signed URL (works for private buckets when permitted)
        try {
          const { data: signed, error: signedErr } = await supabase.storage
            .from('application-documents')
            .createSignedUrl(relativePath, 60);
          
          if (!signedErr && signed?.signedUrl) {
            const response = await fetch(signed.signedUrl);
            if (!response.ok) throw new Error(`Signed URL fetch failed: ${response.statusText}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("File downloaded successfully");
            return;
          }
        } catch (signedUrlError) {
          console.warn('Signed URL generation failed:', signedUrlError);
        }
        
        // Fallback: fetch the URL directly (works only if bucket/object is public)
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("File downloaded successfully");
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to download file: ${errorMessage}`);
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
            
            <Select value={leadFilter} onValueChange={(val) => setLeadFilter(val as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Lead Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lead Statuses</SelectItem>
                <SelectItem value="New"><Badge className="bg-blue-100 text-blue-800">New</Badge></SelectItem>
                <SelectItem value="No Answer"><Badge className="bg-gray-100 text-gray-800">No Answer</Badge></SelectItem>
                <SelectItem value="Wrong Number"><Badge className="bg-red-100 text-red-800">Wrong Number</Badge></SelectItem>
                <SelectItem value="Contacted"><Badge className="bg-yellow-100 text-yellow-800">Contacted</Badge></SelectItem>
                <SelectItem value="Application Sent"><Badge className="bg-purple-100 text-purple-800">Application Sent</Badge></SelectItem>
                <SelectItem value="Disqualified"><Badge className="bg-red-100 text-red-800">Disqualified</Badge></SelectItem>
                <SelectItem value="Loan Approved"><Badge className="bg-green-100 text-green-800">Loan Approved</Badge></SelectItem>
              </SelectContent>
            </Select>

            <Select value={appTypeFilter} onValueChange={(val) => setAppTypeFilter(val as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Application Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (Draft + Complete)</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setLeadFilter('all');
                setAppTypeFilter('all');
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

                      {linkedQuiz && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Lead Status:</span>
                          <Select
                            value={normalizeLeadStatus(quizResponses[application.quiz_response_id!]?.status)}
                            onValueChange={(val) => updateLeadStatusAndSync(application, val as any)}
                          >
                            <SelectTrigger className="h-8 w-[160px]">
                              <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="New">
                                 <Badge className="bg-blue-100 text-blue-800">New</Badge>
                               </SelectItem>
                               <SelectItem value="No Answer">
                                 <Badge className="bg-gray-100 text-gray-800">No Answer</Badge>
                               </SelectItem>
                               <SelectItem value="Wrong Number">
                                 <Badge className="bg-red-100 text-red-800">Wrong Number</Badge>
                               </SelectItem>
                               <SelectItem value="Contacted">
                                 <Badge className="bg-yellow-100 text-yellow-800">Contacted</Badge>
                               </SelectItem>
                               <SelectItem value="Application Sent">
                                 <Badge className="bg-purple-100 text-purple-800">Application Sent</Badge>
                               </SelectItem>
                               <SelectItem value="Disqualified">
                                 <Badge className="bg-red-100 text-red-800">Disqualified</Badge>
                               </SelectItem>
                               <SelectItem value="Loan Approved">
                                 <Badge className="bg-green-100 text-green-800">Loan Approved</Badge>
                               </SelectItem>
                             </SelectContent>
                          </Select>
                        </div>
                      )}
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

{/* USA Applications (2-Step) */}
{appTypeFilter !== 'draft' && filteredSimplifiedApps.length > 0 && (
  <>
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-semibold">USA Applications (2-Step)</h3>
      <div className="text-sm text-muted-foreground">
        Total: {simplifiedApps.length} | Showing: {filteredSimplifiedApps.length}
      </div>
    </div>
    <div className="grid gap-4">
      {filteredSimplifiedApps.map((app) => {
        const linkedQuiz = app.quiz_response_id ? quizResponses[app.quiz_response_id] : null;
        return (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm font-bold text-primary">
                      {app.application_reference_number}
                    </span>
                    {app.lead_source && getSourceBadge(app.lead_source)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{app.legal_corporation_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {app.email_address}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {app.telephone_number}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Loan Amount:</span>
                    <span className="text-green-600 font-semibold">
                      ${app.loan_amount_requested.toLocaleString()}
                    </span>
                  </div>
                  {linkedQuiz && (
                    <div className="text-sm text-blue-600">
                      <span className="font-medium">Linked Quiz Lead:</span> {linkedQuiz.name}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(app.status)}
                    {app.conversion_stage && getStageBadge(app.conversion_stage)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>Applied: {new Date(app.created_at).toLocaleDateString()}</div>
                    <div>Updated: {new Date(app.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              {app.admin_notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium">Admin Notes:</span>
                  <p className="text-sm mt-1">{app.admin_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  </>
)}

{/* Draft Applications */}
      {filteredDrafts.length > 0 && appTypeFilter !== 'complete' && (
        <div className="grid gap-4">
          {filteredDrafts.map((draft) => {
            const fd = (draft as any).form_data || {};
            const company = fd.legal_corporation_name || fd.legal_business_name || 'Untitled';
            const email = fd.email_address || '—';
            const phone = fd.telephone_number || fd.business_phone || '—';
            return (
              <Card key={draft.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{company}</span>
                      <Badge variant="status-draft">Draft</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {phone}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>Step {draft.current_step}</div>
                    <div>Updated: {new Date(draft.last_updated).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2 justify-start md:justify-end">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDraft(draft)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => openDraftDeleteModal(draft)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                
                {selectedApplication.quiz_response_id && (
                  <div className="mb-4">
                    <span className="text-sm font-medium">Lead Status:</span>
                    <div className="mt-1">
                      <Select
                        value={normalizeLeadStatus(quizResponses[selectedApplication.quiz_response_id!]?.status)}
                        onValueChange={(val) => updateLeadStatusAndSync(selectedApplication, val as any)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Set status" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="New"><Badge className="bg-blue-100 text-blue-800">New</Badge></SelectItem>
                           <SelectItem value="No Answer"><Badge className="bg-gray-100 text-gray-800">No Answer</Badge></SelectItem>
                           <SelectItem value="Wrong Number"><Badge className="bg-red-100 text-red-800">Wrong Number</Badge></SelectItem>
                           <SelectItem value="Contacted"><Badge className="bg-yellow-100 text-yellow-800">Contacted</Badge></SelectItem>
                           <SelectItem value="Application Sent"><Badge className="bg-purple-100 text-purple-800">Application Sent</Badge></SelectItem>
                           <SelectItem value="Disqualified"><Badge className="bg-red-100 text-red-800">Disqualified</Badge></SelectItem>
                           <SelectItem value="Loan Approved"><Badge className="bg-green-100 text-green-800">Loan Approved</Badge></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

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

      {/* Draft Details Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Draft Application Details
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedDraft(null)}>Close</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => { const fd = (selectedDraft as any).form_data || {}; return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Company</span>
                      <p className="font-medium">{fd.legal_corporation_name || fd.legal_business_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Email</span>
                      <p>{fd.email_address || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Phone</span>
                      <p>{fd.telephone_number || fd.business_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Loan Amount</span>
                      <p>{fd.loan_amount_requested ? `$${Number(fd.loan_amount_requested).toLocaleString()}` : 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Use of Funds</span>
                      <p>{fd.use_of_funds || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>Current Step: {selectedDraft.current_step}</div>
                    <div>Last Updated: {new Date(selectedDraft.last_updated).toLocaleString()}</div>
                  </div>
                </div>
              ); })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Draft Delete Confirmation Modal */}
      <Dialog open={draftDeleteModalOpen} onOpenChange={setDraftDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Draft</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this draft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                To confirm, type <span className="font-mono bg-muted px-1 rounded">DELETE DRAFT</span> below:
              </p>
              <Input 
                value={draftDeleteConfirmText} 
                onChange={(e) => setDraftDeleteConfirmText(e.target.value)} 
                placeholder="Type DELETE DRAFT to confirm" 
                className="font-mono" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDraftDeleteModal}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDraftDelete} 
              disabled={draftDeleteConfirmText !== 'DELETE DRAFT'}
            >
              Delete Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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