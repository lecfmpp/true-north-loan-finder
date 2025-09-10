import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format, intervalToDuration } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Helper function to get credit score number from classification
const getCreditScoreNumber = (creditScore: string) => {
  switch (creditScore) {
    case "excellent":
      return "750+";
    case "good":
      return "700-749";
    case "fair":
      return "650-699";
    case "poor":
      return "Below 650";
    default:
      return creditScore;
  }
};

// Helper to map credit score category to an approximate numeric value
const getCreditScoreApprox = (creditScore: string) => {
  switch (creditScore) {
    case "excellent":
      return 775;
    case "good":
      return 725;
    case "fair":
      return 675;
    case "poor":
      return 625;
    case "unsure":
      return 650;
    default:
      {
        const n = parseInt(creditScore, 10);
        return isNaN(n) ? 0 : n;
      }
  }
};

// Qualified rule: revenue >= $10k, business age >= 6 months, credit score >= 600
const isTimeInBusinessAtLeast6Months = (tib?: string) => {
  if (!tib) return false;
  return tib === '6-12' || tib === '1-2' || tib === '2-5' || tib === '5+' || tib === '+5';
};
const isQualifiedLead = (lead: any) => {
  const revenueOk = (lead.monthly_revenue || 0) >= 10000;
  const tibOk = isTimeInBusinessAtLeast6Months(lead.time_in_business);
  const creditOk = getCreditScoreApprox(lead.credit_score) >= 600;
  return revenueOk && tibOk && creditOk;
};

// Helper function to format phone numbers as (XXX) XXX-XXXX
const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // If 11 digits and starts with 1, remove the 1 and format
  if (digits.length === 11 && digits.startsWith('1')) {
    const tenDigits = digits.slice(1);
    return `(${tenDigits.slice(0, 3)}) ${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`;
  }
  
  // Return original if can't format
  return phone;
};
import { Download, Search, Filter, LogOut, Users, FileText, PenTool, Mail, Trash2, Phone, ChevronDown, ChevronRight, CheckSquare, Square, UserCheck, Megaphone, Send, Check, DollarSign, Settings as SettingsIcon, ExternalLink, TrendingUp, ChevronUp, ArrowUpDown, Save, CalendarIcon, Webhook, Loader2, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import BlogManagement from '@/components/admin/BlogManagement';
import BlogPostCreator from '@/components/admin/BlogPostCreator';

import { ApplicationsManagement } from '@/components/admin/ApplicationsManagement';
import USAApplicationsManagement from '@/components/admin/USAApplicationsManagement';
import CanadianApplicationsManagement from '@/components/admin/CanadianApplicationsManagement';
import SocialProofManagement from '@/components/admin/SocialProofManagement';
import SettingsManagement from '@/components/admin/SettingsManagement';
import SimplifiedPartnersManagement from '@/components/admin/SimplifiedPartnersManagement';
// Lead analytics component
import LeadTierAnalytics from '@/components/admin/LeadTierAnalytics';
import BillingManagement from '@/components/admin/BillingManagement';
import ROIManagement from '@/components/admin/ROIManagement';
import ClientsManagement from '@/components/admin/ClientsManagement';
// Removed PartnersManagement component
import ReportDashboard from '@/components/admin/ReportDashboard';
import Footer from '@/components/Footer';
import PartnerROIDashboard from '@/components/partner/PartnerROIDashboard';
import LeadEngineManagement from '@/components/admin/LeadEngineManagement';
import LeadMarketplace from '@/components/admin/LeadMarketplace';
interface QuizResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  company_name: string;
  monthly_revenue: number;
  loan_amount: number;
  credit_score: string;
  time_in_business: string;
  use_of_funds: string;
  score: number;
  status: string;
  admin_notes: string;
  created_at: string;
  country: string;
  city_province: string;
  attribution_channel?: string;
  attribution_url?: string | null;
  bank_account_type?: string;
  homeowner_status?: string;
  // Add application tracking
  has_usa_application?: boolean;
  has_canadian_application?: boolean;
  usa_application_reference?: string;
  canadian_application_reference?: string;
  // Add custom email tracking
  custom_emails_sent?: Array<{
    id: string;
    recipient_emails: string[];
    sent_by: string;
    sent_at: string;
    delivery_status?: string;
    delivered_at?: string;
    resend_email_id?: string;
    error_message?: string;
  }>;
  // Add partner loan amount
  partner_loan_amount?: number;
  // Add partner assignment
  assigned_partner_id?: string;
  partner_name?: string;
  // Add shared notes
  shared_notes?: string;
}
interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  application_type: string;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}
const Admin = () => {
  const [leads, setLeads] = useState<QuizResponse[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<QuizResponse[]>([]);
  // Removed approvedPartners - using partners instead for consistency
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [usaApplicationsCount, setUsaApplicationsCount] = useState(0);
  const [usaDraftsCount, setUsaDraftsCount] = useState(0);
  const [canadianApplicationsCount, setCanadianApplicationsCount] = useState(0);
  const [canadianDraftsCount, setCanadianDraftsCount] = useState(0);
  const [partnerUsaApplicationsCount, setPartnerUsaApplicationsCount] = useState(0);
  const [partnerCanadianApplicationsCount, setPartnerCanadianApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [monthlyRevenueFilter, setMonthlyRevenueFilter] = useState('all');
  const [loanAmountFilter, setLoanAmountFilter] = useState('all');
  const [timeInBusinessFilter, setTimeInBusinessFilter] = useState('all');
  const [applicationSentFilter, setApplicationSentFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined});
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('leads');
  const [expandedLeads, setExpandedLeads] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sendingEmails, setSendingEmails] = useState<{
    [key: string]: boolean;
  }>({});
  const [sendingToMake, setSendingToMake] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedRecipients, setSelectedRecipients] = useState<{
    [key: string]: string;
  }>({});
  const [partners, setPartners] = useState<Partner[]>([]);
  const [assignmentOptions, setAssignmentOptions] = useState<Array<{
    id: string;
    name: string;
    email: string;
    type: 'partner' | 'client';
    company_name?: string;
  }>>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [customEmails, setCustomEmails] = useState<Record<string, string>>({});
  const [sendingCustomEmails, setSendingCustomEmails] = useState<Record<string, boolean>>({});
  const [leadCustomEmails, setLeadCustomEmails] = useState<Record<string, Array<{
    id: string;
    recipient_emails: string[];
    sent_by: string;
    sent_at: string;
    delivery_status?: string;
    delivered_at?: string;
    resend_email_id?: string;
    error_message?: string;
  }>>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [bulkDelete, setBulkDelete] = useState(false); // Track if it's bulk delete
  const [leadAssignments, setLeadAssignments] = useState<Record<string, any>>({});
  const [currentPartnerPcts, setCurrentPartnerPcts] = useState<{ broker: number; platform: number } | null>(null);
  const [leadBookings, setLeadBookings] = useState<Array<{
    id: string;
    booking_status: string;
  }>>([]);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});
  const [savingNotes, setSavingNotes] = useState<{ [key: string]: boolean }>({});
  const sharedNotesRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const {
    user,
    isAdmin,
    isSuperAdmin,
    userRoles,
    signOut,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  const toggleExpandedLead = (leadId: string) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };
  const handleCallNow = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };
  const fetchLeadAssignments = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('lead_assignments').select(`
          *,
          partners!inner(id, name, email, broker_commission_percentage, platform_commission_percentage)
        `);
      if (error) throw error;
      const assignmentMap: Record<string, any> = {};
      data?.forEach(assignment => {
        assignmentMap[assignment.quiz_response_id] = assignment;
      });
      setLeadAssignments(assignmentMap);
    } catch (error) {
      console.error('Error fetching lead assignments:', error);
    }
  };
  const assignLeadToPartner = async (leadId: string, partnerId: string) => {
    try {
      // Check if lead is already assigned
      if (leadAssignments[leadId]) {
        toast({
          title: "Lead Already Assigned",
          description: `This lead is already assigned to ${leadAssignments[leadId].partners.name}`,
          variant: "destructive"
        });
        return;
      }

      // Get partner's user_id for credit deduction
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('user_id, name')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partnerData?.user_id) {
        toast({
          title: "Error",
          description: "Unable to find partner information for credit deduction",
          variant: "destructive"
        });
        return;
      }

      // Check and deduct credit before assignment
      const { data: creditResult, error: creditError } = await supabase.rpc('update_partner_credits', {
        p_user_id: partnerData.user_id,
        p_credit_change: -1,
        p_transaction_type: 'usage',
        p_description: `Lead assigned: ${leadId}`,
        p_reference_id: leadId
      });

      if (creditError) {
        toast({
          title: "Insufficient Credits",
          description: `${partnerData.name} doesn't have enough credits for this lead assignment`,
          variant: "destructive"
        });
        return;
      }

      const {
        error
      } = await supabase.from('lead_assignments').insert({
        quiz_response_id: leadId,
        partner_id: partnerId,
        assigned_by: user?.id,
        status: 'New'
      });
      if (error) throw error;

      // Also reflect assignment on quiz_responses for cross-page consistency
      const {
        error: qrError
      } = await supabase.from('quiz_responses').update({
        assigned_partner_id: partnerId
      }).eq('id', leadId);
      if (qrError) {
        console.warn('quiz_responses update failed (non-blocking):', qrError);
      }

      // Trigger auto-send to Make.com if enabled
      try {
        await supabase.functions.invoke('auto-send-make-on-assignment', {
          body: {
            leadId,
            partnerId,
            assignedBy: user?.id
          }
        });
      } catch (makeError) {
        console.warn('Make.com auto-send failed (non-blocking):', makeError);
      }

      toast({
        title: "Success",
        description: "Lead assigned to partner successfully"
      });
      fetchLeadAssignments(); // Refresh assignments
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: "Error",
        description: "Failed to assign lead to partner",
        variant: "destructive"
      });
    }
  };
  const removePartnerAssignment = async (leadId: string) => {
    try {
      // Get the current assignment to credit back the partner
      const currentAssignment = leadAssignments[leadId];
      if (currentAssignment?.partners) {
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('user_id, name')
          .eq('id', currentAssignment.partner_id)
          .single();

        if (partnerData?.user_id) {
          await supabase.rpc('update_partner_credits', {
            p_user_id: partnerData.user_id,
            p_credit_change: 1,
            p_transaction_type: 'refund',
            p_description: `Lead assignment removed: ${leadId}`,
            p_reference_id: leadId
          });
        }
      }

      const {
        error
      } = await supabase.from('lead_assignments').delete().eq('quiz_response_id', leadId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Partner assignment removed successfully"
      });
      fetchLeadAssignments(); // Refresh assignments
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove partner assignment",
        variant: "destructive"
      });
    }
  };
  const changePartnerAssignment = async (leadId: string, newPartnerId: string) => {
    try {
      // Get the current assignment to know which partner to credit back
      const currentAssignment = leadAssignments[leadId];
      if (!currentAssignment) {
        toast({
          title: "Error",
          description: "No current assignment found for this lead",
          variant: "destructive"
        });
        return;
      }

      // Get both old and new partner info for credit adjustments
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('id, user_id, name')
        .in('id', [currentAssignment.partner_id, newPartnerId]);

      if (partnersError || !partners || partners.length !== 2) {
        toast({
          title: "Error",
          description: "Unable to find partner information for reassignment",
          variant: "destructive"
        });
        return;
      }

      const oldPartner = partners.find(p => p.id === currentAssignment.partner_id);
      const newPartner = partners.find(p => p.id === newPartnerId);

      // Credit back the old partner and deduct from new partner
      if (oldPartner?.user_id) {
        await supabase.rpc('update_partner_credits', {
          p_user_id: oldPartner.user_id,
          p_credit_change: 1,
          p_transaction_type: 'refund',
          p_description: `Lead reassigned away: ${leadId}`,
          p_reference_id: leadId
        });
      }

      if (newPartner?.user_id) {
        const { error: creditError } = await supabase.rpc('update_partner_credits', {
          p_user_id: newPartner.user_id,
          p_credit_change: -1,
          p_transaction_type: 'usage',
          p_description: `Lead reassigned to partner: ${leadId}`,
          p_reference_id: leadId
        });

        if (creditError) {
          toast({
            title: "Insufficient Credits",
            description: `${newPartner.name} doesn't have enough credits for this reassignment`,
            variant: "destructive"
          });
          return;
        }
      }

      const {
        error
      } = await supabase.from('lead_assignments').update({
        partner_id: newPartnerId,
        assigned_by: user?.id,
        assigned_at: new Date().toISOString()
      }).eq('quiz_response_id', leadId);
      if (error) throw error;

      // Trigger auto-send to Make.com if enabled
      try {
        await supabase.functions.invoke('auto-send-make-on-assignment', {
          body: {
            leadId,
            partnerId: newPartnerId,
            assignedBy: user?.id
          }
        });
      } catch (makeError) {
        console.warn('Make.com auto-send failed (non-blocking):', makeError);
      }

      toast({
        title: "Success",
        description: "Partner assignment updated successfully"
      });
      fetchLeadAssignments(); // Refresh assignments
    } catch (error) {
      console.error('Error changing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to change partner assignment",
        variant: "destructive"
      });
    }
  };
  const assignLeadsToPartner = async (leadIds: string[], partnerId: string) => {
    try {
      // Filter out already assigned leads
      const unassignedLeads = leadIds.filter(leadId => !leadAssignments[leadId]);
      const alreadyAssigned = leadIds.filter(leadId => leadAssignments[leadId]);
      if (alreadyAssigned.length > 0) {
        toast({
          title: "Some Leads Already Assigned",
          description: `${alreadyAssigned.length} lead(s) were already assigned and skipped`,
          variant: "destructive"
        });
      }
      if (unassignedLeads.length === 0) return;

      // Get partner's user_id for credit deduction
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('user_id, name')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partnerData?.user_id) {
        toast({
          title: "Error",
          description: "Unable to find partner information for credit deduction",
          variant: "destructive"
        });
        return;
      }

      // Check and deduct credits before assignment (batch deduction)
      const { data: creditResult, error: creditError } = await supabase.rpc('update_partner_credits', {
        p_user_id: partnerData.user_id,
        p_credit_change: -unassignedLeads.length,
        p_transaction_type: 'usage',
        p_description: `Bulk lead assignment: ${unassignedLeads.length} leads`,
        p_reference_id: null
      });

      if (creditError) {
        toast({
          title: "Insufficient Credits",
          description: `${partnerData.name} doesn't have enough credits for ${unassignedLeads.length} lead assignment(s)`,
          variant: "destructive"
        });
        return;
      }

      const assignments = unassignedLeads.map(leadId => ({
        quiz_response_id: leadId,
        partner_id: partnerId,
        assigned_by: user?.id,
        status: 'New'
      }));
      const {
        error
      } = await supabase.from('lead_assignments').insert(assignments);
      if (error) throw error;

      // Trigger auto-send to Make.com for each assignment if enabled
      try {
        for (const leadId of unassignedLeads) {
          await supabase.functions.invoke('auto-send-make-on-assignment', {
            body: {
              leadId,
              partnerId,
              assignedBy: user?.id
            }
          });
        }
      } catch (makeError) {
        console.warn('Make.com bulk auto-send failed (non-blocking):', makeError);
      }

      toast({
        title: "Success",
        description: `${unassignedLeads.length} lead(s) assigned to partner successfully`
      });
      setSelectedLeads([]);
      setSelectedPartner('');
      fetchLeadAssignments(); // Refresh assignments
    } catch (error) {
      console.error('Error assigning leads:', error);
      toast({
        title: "Error",
        description: "Failed to assign leads to partner",
        variant: "destructive"
      });
    }
  };

  // Auto-assign leads by matching the MOST RECENT custom email recipient to partner emails
  const autoAssignLeadsFromEmailHistory = async () => {
    try {
      // Restrict to selected leads only
      const targetLeadIds = selectedLeads && selectedLeads.length > 0 ? selectedLeads : [];
      if (targetLeadIds.length === 0) {
        toast({
          title: "No leads selected",
          description: "Please select one or more leads to auto-assign from emails",
          variant: "destructive"
        });
        return;
      }
      let created = 0;
      let updated = 0;

      // Helper to normalize/parse addresses like "Name <email@domain>"
      const extractEmail = (addr: string) => {
        const match = addr.match(/<([^>]+)>/);
        const email = (match ? match[1] : addr).trim().toLowerCase();
        return email;
      };

      // Build a quick index for leads by id
      const leadById: Record<string, QuizResponse | undefined> = Object.fromEntries(leads.map(l => [l.id, l]));
      for (const leadId of targetLeadIds) {
        const lead = leadById[leadId];
        if (!lead) continue;
        const emails = (leadCustomEmails[lead.id] || []).slice().sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
        if (emails.length === 0) continue;

        // Find the first partner that matches recipients in the latest emails (descending by time)
        let matchedPartnerId: string | undefined;
        for (const email of emails) {
          for (const recipientRaw of email.recipient_emails || []) {
            const recipient = extractEmail(recipientRaw);
            const partner = partners.find(p => p.email && p.email.trim().toLowerCase() === recipient);
            if (partner) {
              matchedPartnerId = partner.id;
              break;
            }
          }
          if (matchedPartnerId) break;
        }
        if (!matchedPartnerId) continue;
        const existing = leadAssignments[lead.id];
        if (!existing) {
          await assignLeadToPartner(lead.id, matchedPartnerId);
          created += 1;
        } else if (existing.partner_id !== matchedPartnerId) {
          await changePartnerAssignment(lead.id, matchedPartnerId);
          updated += 1;
        }
      }
      toast({
        title: "Auto-assignment complete",
        description: `${created} new assignment(s), ${updated} reassignment(s) based on latest emails`
      });
      fetchLeadAssignments();
    } catch (err) {
      console.error('Error during auto-assign:', err);
      toast({
        title: "Error",
        description: "Failed to auto-assign leads from emails",
        variant: "destructive"
      });
    }
  };
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  };
  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);
  useEffect(() => {
    if (user && isAdmin) {
      const isPartner = userRoles.includes('lender') || userRoles.includes('broker');
      if (isPartner && !isSuperAdmin) {
        // Partner (non-superadmin): show only their assigned leads
        setActiveTab('partner-leads');
        fetchPartnerAssignedLeads();
      } else {
        // Superadmin or non-partner admin: load full data
        fetchLeads();
        fetchPartners();
        fetchLeadAssignments();
      }

      // All admins need application counts for menu items
      fetchApplicationsCount();
      fetchUsaApplicationsCount();
      fetchUsaDraftsCount();
      fetchCanadianApplicationsCount();
      fetchCanadianDraftsCount();
      fetchPartnerApplicationsCounts();
    }
  }, [user, isAdmin, isSuperAdmin, userRoles]);
  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, countryFilter, monthlyRevenueFilter, loanAmountFilter, timeInBusinessFilter, applicationSentFilter, partnerFilter, selectedDateRange, sortField, sortDirection]);

  // Update application counts when date range changes
  useEffect(() => {
    if (user && isAdmin) {
      fetchUsaApplicationsCount();
      fetchCanadianApplicationsCount();
      fetchPartnerApplicationsCounts();
    }
  }, [selectedDateRange, user, isAdmin]);

  // Real-time subscription for email delivery updates
  useEffect(() => {
    if (!user || !isAdmin) return;
    const channel = supabase.channel('lead_custom_emails_updates').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'lead_custom_emails'
    }, payload => {
      console.log('Email delivery status updated:', payload);
      // Refresh custom emails data when an email is updated
      fetchLeads();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);
  const fetchLeads = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('quiz_responses').select(`
        *,
        partners!assigned_partner_id(id, name)
      `).order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Fetch application status for each lead
      const enrichedLeads = await Promise.all((data || []).map(async lead => {
        try {
          // Check for USA applications
          const {
            data: usaApps
          } = await supabase.from('usa_applications').select('application_reference_number, date_incorporated, years_in_business, months_in_business').eq('quiz_response_id', lead.id).limit(1);

          // Check for Canadian applications  
          const {
            data: canadianApps
          } = await supabase.from('canadian_applications').select('application_reference_number, business_start_date').eq('quiz_response_id', lead.id).limit(1);
          return {
            ...lead,
            has_usa_application: usaApps && usaApps.length > 0,
            has_canadian_application: canadianApps && canadianApps.length > 0,
            usa_application_reference: usaApps?.[0]?.application_reference_number || null,
            canadian_application_reference: canadianApps?.[0]?.application_reference_number || null,
            usa_date_incorporated: usaApps?.[0]?.date_incorporated || null,
            usa_years_in_business: usaApps?.[0]?.years_in_business ?? null,
            usa_months_in_business: usaApps?.[0]?.months_in_business ?? null,
            canadian_business_start_date: canadianApps?.[0]?.business_start_date || null,
            partner_name: (lead as any).partners?.name || null
          };
        } catch (err) {
          console.error('Error enriching lead:', err);
          return {
            ...lead,
            has_usa_application: false,
            has_canadian_application: false,
            usa_application_reference: null,
            canadian_application_reference: null,
            partner_name: (lead as any).partners?.name || null
          };
        }
      }));
      setLeads(enrichedLeads);

      // Fetch custom emails for all leads
      await fetchLeadCustomEmails(enrichedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchPartnerAssignedLeads = async () => {
    try {
      setLoading(true);
      // Find partner id for current user
      const {
        data: partner,
        error: pErr
      } = await supabase.from('partners').select('id, broker_commission_percentage, platform_commission_percentage').eq('user_id', user?.id!).maybeSingle();
      if (pErr || !partner) {
        setLeads([]);
        setFilteredLeads([]);
        setCurrentPartnerPcts(null);
        setLoading(false);
        return;
      }

      setCurrentPartnerPcts({
        broker: Number((partner as any).broker_commission_percentage) || 0,
        platform: Number((partner as any).platform_commission_percentage) || 0,
      });

      // Fetch assigned leads with full quiz response
      const {
        data: assignments,
        error: aErr
      } = await supabase.from('lead_assignments').select('quiz_responses(*)').eq('partner_id', partner.id);
      if (aErr) throw aErr;
      const baseLeads = (assignments || []).map((row: any) => row.quiz_responses).filter(Boolean);

      // Enrich with application info (same as fetchLeads)
      const enrichedLeads = await Promise.all(baseLeads.map(async (lead: any) => {
        try {
          const {
            data: usaApps
          } = await supabase.from('usa_applications').select('application_reference_number, date_incorporated, years_in_business, months_in_business').eq('quiz_response_id', lead.id).limit(1);
          const {
            data: canadianApps
          } = await supabase.from('canadian_applications').select('application_reference_number, business_start_date').eq('quiz_response_id', lead.id).limit(1);
          return {
            ...lead,
            has_usa_application: usaApps && usaApps.length > 0,
            has_canadian_application: canadianApps && canadianApps.length > 0,
            usa_application_reference: usaApps?.[0]?.application_reference_number || null,
            canadian_application_reference: canadianApps?.[0]?.application_reference_number || null,
            usa_date_incorporated: usaApps?.[0]?.date_incorporated || null,
            usa_years_in_business: usaApps?.[0]?.years_in_business ?? null,
            usa_months_in_business: usaApps?.[0]?.months_in_business ?? null,
            canadian_business_start_date: canadianApps?.[0]?.business_start_date || null
          };
        } catch (err) {
          console.error('Error enriching assigned lead:', err);
          return {
            ...lead,
            has_usa_application: false,
            has_canadian_application: false,
            usa_application_reference: null,
            canadian_application_reference: null
          };
        }
      }));
      setLeads(enrichedLeads);
      // Reuse existing filters pipeline
      // filterLeads will run via the effect listening to leads + filters
    } catch (error) {
      console.error('Error fetching partner assigned leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your leads',
        variant: 'destructive'
      });
      setLeads([]);
      setFilteredLeads([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchLeadCustomEmails = async (leadsData: QuizResponse[]) => {
    try {
      const {
        data: customEmailsData,
        error
      } = await supabase.from('lead_custom_emails').select('*').in('lead_id', leadsData.map(lead => lead.id)).order('sent_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching custom emails:', error);
        return;
      }
      const customEmailsMap: Record<string, Array<{
        id: string;
        recipient_emails: string[];
        sent_by: string;
        sent_at: string;
        delivery_status?: string;
        delivered_at?: string;
        resend_email_id?: string;
        error_message?: string;
      }>> = {};
      customEmailsData?.forEach(email => {
        if (!customEmailsMap[email.lead_id]) {
          customEmailsMap[email.lead_id] = [];
        }
        customEmailsMap[email.lead_id].push({
          id: email.id,
          recipient_emails: email.recipient_emails,
          sent_by: email.sent_by,
          sent_at: email.sent_at,
          delivery_status: email.delivery_status,
          delivered_at: email.delivered_at,
          resend_email_id: email.resend_email_id,
          error_message: email.error_message
        });
      });
      setLeadCustomEmails(customEmailsMap);
    } catch (error) {
      console.error('Error fetching lead custom emails:', error);
    }
  };
  const fetchApplicationsCount = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from('lender_broker_applications').select('*', {
        count: 'exact',
        head: true
      });
      if (error) throw error;
      setApplicationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching applications count:', error);
    }
  };
  const fetchUsaApplicationsCount = async () => {
    try {
      let query = supabase.from('usa_applications').select('*', {
        count: 'exact',
        head: true
      });

      // Apply date filter if selected
      if (selectedDateRange.from) {
        const startDate = new Date(selectedDateRange.from);
        const endDate = selectedDateRange.to ? new Date(selectedDateRange.to) : new Date(selectedDateRange.from);
        
        // Set time to start/end of day for accurate comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
      }

      const { count, error } = await query;
      if (error) throw error;
      setUsaApplicationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching USA applications count:', error);
    }
  };
  const fetchCanadianApplicationsCount = async () => {
    try {
      let query = supabase.from('canadian_applications').select('*', {
        count: 'exact',
        head: true
      });

      // Apply date filter if selected
      if (selectedDateRange.from) {
        const startDate = new Date(selectedDateRange.from);
        const endDate = selectedDateRange.to ? new Date(selectedDateRange.to) : new Date(selectedDateRange.from);
        
        // Set time to start/end of day for accurate comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
      }

      const { count, error } = await query;
      if (error) throw error;
      setCanadianApplicationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching Canadian applications count:', error);
    }
  };

  const fetchPartnerApplicationsCounts = async () => {
    try {
      // Fetch USA applications with assigned partners
      let usaQuery = supabase
        .from('usa_applications')
        .select('quiz_response_id', { count: 'exact', head: true })
        .not('quiz_response_id', 'is', null);

      // Apply date filter if selected
      if (selectedDateRange.from) {
        const startDate = new Date(selectedDateRange.from);
        const endDate = selectedDateRange.to ? new Date(selectedDateRange.to) : new Date(selectedDateRange.from);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        usaQuery = usaQuery.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
      }

      const { count: usaCount, error: usaError } = await usaQuery;
      if (usaError) throw usaError;

      // Get quiz response IDs that have assigned partners
      const { data: assignedLeads, error: assignedError } = await supabase
        .from('quiz_responses')
        .select('id')
        .not('assigned_partner_id', 'is', null);

      if (assignedError) throw assignedError;

      const assignedLeadIds = assignedLeads?.map(lead => lead.id) || [];

      // Count USA applications from assigned leads
      const usaPartnerQuery = supabase
        .from('usa_applications')
        .select('*', { count: 'exact', head: true })
        .in('quiz_response_id', assignedLeadIds);

      const { count: partnerUsaCount, error: partnerUsaError } = await usaPartnerQuery;
      if (partnerUsaError) throw partnerUsaError;

      // Count Canadian applications from assigned leads
      const canadianPartnerQuery = supabase
        .from('canadian_applications')
        .select('*', { count: 'exact', head: true })
        .in('quiz_response_id', assignedLeadIds);

      const { count: partnerCanadianCount, error: partnerCanadianError } = await canadianPartnerQuery;
      if (partnerCanadianError) throw partnerCanadianError;

      setPartnerUsaApplicationsCount(partnerUsaCount || 0);
      setPartnerCanadianApplicationsCount(partnerCanadianCount || 0);
    } catch (error) {
      console.error('Error fetching partner applications count:', error);
    }
  };
  const fetchUsaDraftsCount = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from('usa_application_drafts').select('*', {
        count: 'exact',
        head: true
      });
      if (error) throw error;
      setUsaDraftsCount(count || 0);
    } catch (error) {
      console.error('Error fetching USA drafts count:', error);
    }
  };
  const fetchCanadianDraftsCount = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from('canadian_application_drafts').select('*', {
        count: 'exact',
        head: true
      });
      if (error) throw error;
      setCanadianDraftsCount(count || 0);
    } catch (error) {
      console.error('Error fetching Canadian drafts count:', error);
    }
  };
  const fetchPartners = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('partners').select('*').eq('is_active', true).order('name', {
        ascending: true
      });
      if (error) throw error;
      setPartners(data || []);
      
      // Also fetch clients for assignment dropdown
      await fetchAssignmentOptions();
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const fetchAssignmentOptions = async () => {
    try {
      // Fetch active partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('id, name, email, company_name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (partnersError) throw partnersError;

      // Fetch active clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, email, company_name')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (clientsError) throw clientsError;

      // Combine partners and clients for assignment dropdown
      const options = [
        ...(partnersData || []).map(partner => ({
          id: partner.id,
          name: partner.name,
          email: partner.email,
          company_name: partner.company_name,
          type: 'partner' as const
        })),
        ...(clientsData || []).map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          company_name: client.company_name,
          type: 'client' as const
        }))
      ];

      setAssignmentOptions(options);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: "Error",
        description: "Failed to fetch partners",
        variant: "destructive"
      });
    }
  };

  // Real-time subscription: refresh partners list on insert/update/delete so dropdowns stay in sync
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    const partnersChannel = supabase.channel('partners_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'partners'
    }, () => {
      // Re-fetch active partners when partners table changes
      fetchPartners();
    });

    const clientsChannel = supabase.channel('clients_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'clients'
    }, () => {
      // Re-fetch assignment options when clients table changes
      fetchAssignmentOptions();
    });

    partnersChannel.subscribe();
    clientsChannel.subscribe();

     return () => {
       supabase.removeChannel(partnersChannel);
       supabase.removeChannel(clientsChannel);
   };
  }, [user, isAdmin]);
  
  const sendToMake = async (leadId: string, eventType: string = 'manual_send') => {
    setSendingToMake(prev => ({ ...prev, [leadId]: true }));
    try {
      const { error } = await supabase.functions.invoke('send-to-make', {
        body: { leadId, eventType }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead sent to Make.com successfully",
      });
    } catch (error: any) {
      console.error('Error sending to Make:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to send to Make.com",
        variant: "destructive",
      });
    } finally {
      setSendingToMake(prev => ({ ...prev, [leadId]: false }));
    }
  };

  const bulkSendToMake = async () => {
    if (selectedLeads.length === 0) return;
    
    try {
      for (const leadId of selectedLeads) {
        await sendToMake(leadId, 'manual_send');
      }
      setSelectedLeads([]);
    } catch (error) {
      console.error('Bulk send to Make failed:', error);
    }
  };
  
  const sendCustomLeadEmail = async (leadId: string, recipientEmails: string) => {
    // Parse and validate multiple email addresses
    const emailList = recipientEmails.split(',').map(email => email.trim()).filter(email => email);
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast({
        title: "Error",
        description: `Invalid email addresses: ${invalidEmails.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    if (emailList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one valid email address.",
        variant: "destructive"
      });
      return;
    }
    setSendingCustomEmails(prev => ({
      ...prev,
      [leadId]: true
    }));
    try {
      // Send to multiple recipients
      const results = await Promise.allSettled(emailList.map(recipientEmail => supabase.functions.invoke('send-lead-email', {
        body: {
          leadId,
          recipientEmail,
          recipientName: recipientEmail.split('@')[0] // Use email prefix as name
        }
      })));
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      if (successful > 0) {
        toast({
          title: "🎉 Emails Sent!",
          description: `Lead information sent to ${successful} recipient${successful > 1 ? 's' : ''} successfully!${failed > 0 ? ` (${failed} failed)` : ''}`,
          variant: "success" as any
        });

        // Clear the email input after successful send
        setCustomEmails(prev => ({
          ...prev,
          [leadId]: ""
        }));
      } else {
        throw new Error("All email sends failed");
      }
    } catch (error: any) {
      console.error('Error sending custom lead emails:', error);
      toast({
        title: "Error",
        description: "Failed to send lead emails. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingCustomEmails(prev => ({
        ...prev,
        [leadId]: false
      }));
    }
  };
  const sendLeadEmail = async (leadId: string, recipientId: string) => {
    const recipient = partners.find(p => p.id === recipientId);
    if (!recipient) {
      toast({
        title: "Error",
        description: "Selected recipient is not available. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    // Double-check recipient is still active in partners table before sending
    try {
      const {
        data: verifiedRecipient,
        error
      } = await supabase.from('partners').select('is_active').eq('id', recipientId).eq('is_active', true).single();
      if (error || !verifiedRecipient) {
        toast({
          title: "Error",
          description: "Recipient is no longer an active partner.",
          variant: "destructive"
        });
        // Refresh the partners list
        fetchPartners();
        return;
      }
    } catch (error) {
      console.error('Error verifying recipient approval status:', error);
      toast({
        title: "Error",
        description: "Unable to verify recipient status. Please try again.",
        variant: "destructive"
      });
      return;
    }
    setSendingEmails(prev => ({
      ...prev,
      [leadId]: true
    }));
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('send-lead-email', {
        body: {
          leadId,
          recipientEmail: recipient.email,
          recipientName: recipient.name
        }
      });
      if (error) throw error;
      toast({
        title: "🎉 Awesome!",
        description: `Lead sent to ${recipient.name} successfully!`,
        variant: "success" as any
      });
    } catch (error: any) {
      console.error('Error sending lead email:', error);

      // Handle specific error cases
      if (error.message?.includes('not an active partner')) {
        toast({
          title: "Access Denied",
          description: "Cannot send lead to inactive partners. The recipient list has been updated.",
          variant: "destructive"
        });
        // Refresh the partners list
        fetchPartners();
      } else {
        toast({
          title: "Error",
          description: "Failed to send lead email",
          variant: "destructive"
        });
      }
    } finally {
      setSendingEmails(prev => ({
        ...prev,
        [leadId]: false
      }));
    }
  };
  const openDeleteModal = async (leadId: string) => {
    try {
      const {
        data: bookings,
        error
      } = await supabase.from('call_bookings').select('id, booking_status').eq('quiz_response_id', leadId);
      if (error) {
        console.error('Error checking bookings:', error);
      }
      setLeadToDelete(leadId);
      setBulkDelete(false);
      setDeleteModalOpen(true);
      setDeleteConfirmText('');

      // Store booking info for the modal
      setLeadBookings(bookings || []);
    } catch (error) {
      console.error('Error checking lead bookings:', error);
      setLeadToDelete(leadId);
      setBulkDelete(false);
      setDeleteModalOpen(true);
      setDeleteConfirmText('');
      setLeadBookings([]);
    }
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setLeadToDelete(null);
    setBulkDelete(false);
    setDeleteConfirmText('');
  };
  const confirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE LEAD') {
      toast({
        title: "Deletion Cancelled",
        description: "Please type exactly 'DELETE LEAD' to confirm deletion",
        variant: "destructive"
      });
      return;
    }
    if (bulkDelete) {
      // Handle bulk deletion
      if (selectedLeads.length === 0) return;
      try {
        console.log('Attempting to delete selected leads:', selectedLeads);

        // First, delete any associated call bookings to avoid foreign key constraint
        if (leadBookings.length > 0) {
          console.log('Deleting associated call bookings:', leadBookings);
          const {
            error: bookingsError
          } = await supabase.from('call_bookings').delete().in('quiz_response_id', selectedLeads);
          if (bookingsError) {
            console.error('Error deleting call bookings:', bookingsError);
            throw bookingsError;
          }
          console.log('Associated call bookings deleted successfully');
        }

        // Then delete the selected leads
        const {
          error
        } = await supabase.from('quiz_responses').delete().in('id', selectedLeads);
        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }
        console.log('Selected leads deleted successfully');
        setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
        setSelectedLeads([]);
        const deletionMessage = leadBookings.length > 0 ? `${selectedLeads.length} lead(s) and ${leadBookings.length} associated call booking(s) deleted successfully` : `${selectedLeads.length} lead(s) deleted successfully`;
        toast({
          title: "Success",
          description: deletionMessage
        });
        closeDeleteModal();
      } catch (error: any) {
        console.error('Error deleting selected leads:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete selected leads",
          variant: "destructive"
        });
      }
    } else {
      // Handle individual deletion
      if (!leadToDelete) return;
      try {
        console.log('Attempting to delete lead with ID:', leadToDelete);

        // First, delete any associated call bookings to avoid foreign key constraint
        if (leadBookings.length > 0) {
          console.log('Deleting associated call bookings:', leadBookings);
          const {
            error: bookingsError
          } = await supabase.from('call_bookings').delete().eq('quiz_response_id', leadToDelete);
          if (bookingsError) {
            console.error('Error deleting call bookings:', bookingsError);
            throw bookingsError;
          }
          console.log('Associated call bookings deleted successfully');
        }

        // Then delete the lead
        const {
          error
        } = await supabase.from('quiz_responses').delete().eq('id', leadToDelete);
        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }
        console.log('Lead deleted successfully');
        setLeads(leads.filter(lead => lead.id !== leadToDelete));
        const deletionMessage = leadBookings.length > 0 ? `Lead and ${leadBookings.length} associated call booking(s) deleted successfully` : "Lead deleted successfully";
        toast({
          title: "Success",
          description: deletionMessage
        });
        closeDeleteModal();
      } catch (error: any) {
        console.error('Error deleting lead:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete lead",
          variant: "destructive"
        });
      }
    }
  };
  const filterLeads = () => {
    let filtered = leads;
    if (searchTerm) {
      filtered = filtered.filter(lead => lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || lead.phone.includes(searchTerm));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    if (countryFilter !== 'all') {
      filtered = filtered.filter(lead => lead.country === countryFilter);
    }
    if (monthlyRevenueFilter !== 'all') {
      filtered = filtered.filter(lead => {
        const revenue = lead.monthly_revenue;
        switch (monthlyRevenueFilter) {
          case 'under-10k':
            return revenue < 10000;
          case '10k-25k':
            return revenue >= 10000 && revenue < 25000;
          case '25k-50k':
            return revenue >= 25000 && revenue < 50000;
          case '50k-100k':
            return revenue >= 50000 && revenue < 100000;
          case '100k-250k':
            return revenue >= 100000 && revenue < 250000;
          case 'over-250k':
            return revenue >= 250000;
          default:
            return true;
        }
      });
    }
    if (loanAmountFilter !== 'all') {
      filtered = filtered.filter(lead => {
        const loanAmount = lead.loan_amount;
        switch (loanAmountFilter) {
          case 'under-25k':
            return loanAmount < 25000;
          case '25k-50k':
            return loanAmount >= 25000 && loanAmount < 50000;
          case '50k-100k':
            return loanAmount >= 50000 && loanAmount < 100000;
          case '100k-250k':
            return loanAmount >= 100000 && loanAmount < 250000;
          case '250k-500k':
            return loanAmount >= 250000 && loanAmount < 500000;
          case 'over-500k':
            return loanAmount >= 500000;
          default:
            return true;
        }
      });
    }
    if (timeInBusinessFilter !== 'all') {
      filtered = filtered.filter(lead => {
        const timeInBusiness = lead.time_in_business;
        return timeInBusiness === timeInBusinessFilter;
      });
    }
    if (applicationSentFilter !== 'all') {
      filtered = filtered.filter(lead => {
        const hasApplication = lead.has_usa_application || lead.has_canadian_application;
        switch (applicationSentFilter) {
          case 'yes':
            return hasApplication;
          case 'no':
            return !hasApplication;
          default:
            return true;
        }
      });
    }
    if (partnerFilter !== 'all') {
      filtered = filtered.filter(lead => {
        if (partnerFilter === 'unassigned') {
          return !lead.assigned_partner_id;
        }
        
        // Check if applications were sent to this partner's email
        const selectedPartner = partners.find(p => p.id === partnerFilter);
        if (selectedPartner) {
          // Check if any custom emails were sent to this partner's email
          const leadEmails = leadCustomEmails[lead.id] || [];
          const sentToPartner = leadEmails.some(email => 
            email.recipient_emails.includes(selectedPartner.email)
          );
          if (sentToPartner) return true;
        }
        
        return lead.assigned_partner_id === partnerFilter;
      });
    }

    // Apply date filter
    if (selectedDateRange.from) {
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at);
        const startDate = new Date(selectedDateRange.from!);
        const endDate = selectedDateRange.to ? new Date(selectedDateRange.to) : new Date(selectedDateRange.from!);
        
        // Set time to start/end of day for accurate comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        return leadDate >= startDate && leadDate <= endDate;
      });
    }

    // Apply sorting
    if (sortField) {
      filtered = filtered.sort((a, b) => {
        let aValue: any = a[sortField as keyof QuizResponse];
        let bValue: any = b[sortField as keyof QuizResponse];

        // Handle special cases for sorting
        if (sortField === 'created_at') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else if (sortField === 'monthly_revenue' || sortField === 'loan_amount' || sortField === 'score' || sortField === 'partner_loan_amount') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }
    setFilteredLeads(filtered);

    // Clear selected leads that are no longer in filtered results
    setSelectedLeads(prev => prev.filter(id => filtered.some(lead => lead.id === id)));
  };
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const exportSelectedToCSV = () => {
    const leadsToExport = selectedLeads.length > 0 ? leads.filter(lead => selectedLeads.includes(lead.id)) : filteredLeads;
    const headers = ['Name', 'Email', 'Phone', 'Country', 'State/Province', 'Monthly Revenue', 'Loan Amount', 'Credit Score', 'Time in Business', 'Use of Funds', 'Score', 'Status', 'Created At'];
    const csvContent = [headers.join(','), ...leadsToExport.map(lead => [lead.name, lead.email, lead.phone, lead.country || '', lead.city_province || '', lead.monthly_revenue, lead.loan_amount, lead.credit_score, lead.time_in_business, lead.use_of_funds, lead.score, lead.status, format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm:ss')].join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${selectedLeads.length > 0 ? 'selected' : 'filtered'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const deleteSelectedLeads = async () => {
    if (selectedLeads.length === 0) return;

    // Check if any selected leads have associated call bookings
    try {
      const {
        data: bookings,
        error
      } = await supabase.from('call_bookings').select('id, booking_status, quiz_response_id').in('quiz_response_id', selectedLeads);
      if (error) {
        console.error('Error checking bookings:', error);
      }
      setBulkDelete(true);
      setDeleteModalOpen(true);
      setDeleteConfirmText('');
      setLeadBookings(bookings || []);
    } catch (error) {
      console.error('Error checking lead bookings:', error);
      setBulkDelete(true);
      setDeleteModalOpen(true);
      setDeleteConfirmText('');
      setLeadBookings([]);
    }
  };
  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('quiz_responses').update({
        status: newStatus
      }).eq('id', leadId);
      if (error) throw error;
      setLeads(leads.map(lead => lead.id === leadId ? {
        ...lead,
        status: newStatus
      } : lead));
      toast({
        title: "Success",
        description: "Lead status updated"
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive"
      });
    }
  };
  const saveSharedNotes = async (leadId: string) => {
    const textarea = sharedNotesRefs.current[leadId];
    if (!textarea) return;
    
    const notes = textarea.value;

    setSavingNotes(prev => ({ ...prev, [leadId]: true }));
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .update({ shared_notes: notes })
        .eq('id', leadId);

      if (error) throw error;

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, shared_notes: notes } : lead
      ));

      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
    } catch (error) {
      console.error('Error updating shared notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    } finally {
      setSavingNotes(prev => ({ ...prev, [leadId]: false }));
    }
  };

  const updatePartnerLoanAmount = async (leadId: string, amount: string) => {
    try {
      const numericAmount = amount ? parseInt(amount) : null;
      const {
        error
      } = await supabase.from('quiz_responses').update({
        partner_loan_amount: numericAmount
      }).eq('id', leadId);
      if (error) throw error;
      setLeads(leads.map(lead => lead.id === leadId ? {
        ...lead,
        partner_loan_amount: numericAmount
      } : lead));
      toast({
        title: "Success",
        description: "Partner loan amount updated"
      });
    } catch (error) {
      console.error('Error updating partner loan amount:', error);
      toast({
        title: "Error",
        description: "Failed to update partner loan amount",
        variant: "destructive"
      });
    }
  };
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Country', 'State/Province', 'Monthly Revenue', 'Loan Amount', 'Credit Score', 'Time in Business', 'Use of Funds', 'Score', 'Status', 'Created At'];
    const csvContent = [headers.join(','), ...filteredLeads.map(lead => [lead.name, lead.email, lead.phone, lead.country || '', lead.city_province || '', lead.monthly_revenue, lead.loan_amount, lead.credit_score, lead.time_in_business, lead.use_of_funds, lead.score, lead.status, format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm:ss')].join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-800 text-white hover:bg-blue-800 hover:text-white';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800';
      case 'qualified':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800';
    }
  };

  // PDF Download Function
  const downloadApplicationPDF = async (lead: QuizResponse) => {
    try {
      let applicationData = null;
      let referenceNumber = '';
      let applicationType = '';

      // Determine which application to download
      if (lead.has_usa_application && lead.usa_application_reference) {
        const {
          data
        } = await supabase.from('usa_applications').select('*').eq('quiz_response_id', lead.id).single();
        applicationData = data;
        referenceNumber = lead.usa_application_reference;
        applicationType = 'USA Business Loan Application';
      } else if (lead.has_canadian_application && lead.canadian_application_reference) {
        const {
          data
        } = await supabase.from('canadian_applications').select('*').eq('quiz_response_id', lead.id).single();
        applicationData = data;
        referenceNumber = lead.canadian_application_reference;
        applicationType = 'Canadian Business Loan Application';
      }
      if (!applicationData) {
        toast({
          title: "Error",
          description: "No application found for this lead",
          variant: "destructive"
        });
        return;
      }

      // Create comprehensive PDF using jsPDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let y = margin;

      // Header
      doc.setFontSize(18);
      doc.text(applicationType, pageWidth / 2, y, {
        align: 'center'
      });
      y += 20;
      doc.setFontSize(12);
      doc.text(`Reference: ${referenceNumber}`, margin, y);
      y += 10;
      doc.text(`Status: ${applicationData.status}`, margin, y);
      y += 10;
      doc.text(`Applied: ${new Date(applicationData.created_at).toLocaleDateString()}`, margin, y);
      y += 20;

      // Lead Information Section
      doc.setFontSize(16);
      doc.text('Quiz Lead Information:', margin, y);
      y += 10;
      doc.setFontSize(10);
      const leadInfo = [['Name:', lead.name], ['Email:', lead.email], ['Phone:', lead.phone], ['Monthly Revenue:', `$${lead.monthly_revenue.toLocaleString()}`], ['Loan Amount:', `$${lead.loan_amount.toLocaleString()}`], ['Credit Score:', lead.credit_score], ['Time in Business:', lead.time_in_business], ['Use of Funds:', lead.use_of_funds], ['Quiz Score:', lead.score.toString()]];
      leadInfo.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, margin, y);
        y += 8;
        if (y > 250) {
          doc.addPage();
          y = margin;
        }
      });
      y += 10;

      // Business Information
      doc.setFontSize(14);
      doc.text('Business Information', margin, y);
      y += 10;
      doc.setFontSize(10);
      let businessInfo = [];
      if (applicationType.includes('USA')) {
        businessInfo = [['Legal Corporation Name:', applicationData.legal_corporation_name || 'N/A'], ['DBA Name:', applicationData.dba_name || 'N/A'], ['Business Phone:', applicationData.telephone_number || 'N/A'], ['Email Address:', applicationData.email_address || 'N/A'], ['Physical Address:', applicationData.physical_address || 'N/A'], ['City:', applicationData.city || 'N/A'], ['State:', applicationData.state || 'N/A'], ['ZIP Code:', applicationData.zip || 'N/A'], ['Entity Type:', applicationData.entity_type || 'N/A'], ['Federal Tax ID:', applicationData.federal_tax_id || 'N/A'], ['Years in Business:', `${applicationData.years_in_business} years, ${applicationData.months_in_business} months` || 'N/A'], ['Number of Employees:', applicationData.number_of_employees || 'N/A'], ['Monthly Rent/Mortgage:', applicationData.monthly_rent_mortgage ? `$${applicationData.monthly_rent_mortgage.toLocaleString()}` : 'N/A'], ['Average Monthly Deposits:', applicationData.average_monthly_deposits ? `$${applicationData.average_monthly_deposits.toLocaleString()}` : 'N/A']];
      } else {
        businessInfo = [['Legal Business Name:', applicationData.legal_business_name || 'N/A'], ['DBA Name:', applicationData.dba_name || 'N/A'], ['Business Phone:', applicationData.business_phone || 'N/A'], ['Email Address:', applicationData.email_address || 'N/A'], ['Physical Address:', applicationData.physical_address || 'N/A'], ['City:', applicationData.city || 'N/A'], ['State/Province:', applicationData.state || 'N/A'], ['ZIP/Postal Code:', applicationData.zip || 'N/A'], ['Type of Entity:', applicationData.type_of_entity || 'N/A'], ['Federal Tax ID:', applicationData.federal_tax_id || 'N/A'], ['Business Start Date:', applicationData.business_start_date || 'N/A'], ['Number of Locations:', applicationData.number_of_locations || 'N/A'], ['Annual Gross Sales:', applicationData.annual_gross_sales ? `$${applicationData.annual_gross_sales.toLocaleString()}` : 'N/A'], ['Monthly Rent/Mortgage:', applicationData.monthly_rent_or_mortgage ? `$${applicationData.monthly_rent_or_mortgage.toLocaleString()}` : 'N/A']];
      }
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
      let ownerInfo = [];
      if (applicationType.includes('USA')) {
        ownerInfo = [['Name:', applicationData.principal_name || 'N/A'], ['Title:', applicationData.principal_title || 'N/A'], ['Email:', applicationData.principal_email || 'N/A'], ['Home Address:', applicationData.principal_home_address || 'N/A'], ['City:', applicationData.principal_city || 'N/A'], ['State:', applicationData.principal_state || 'N/A'], ['ZIP:', applicationData.principal_zip || 'N/A'], ['Home Phone:', applicationData.principal_home_phone || 'N/A'], ['Cell Phone:', applicationData.principal_cell_phone || 'N/A'], ['Date of Birth:', applicationData.principal_date_of_birth ? new Date(applicationData.principal_date_of_birth).toLocaleDateString() : 'N/A'], ['SSN:', applicationData.principal_ssn ? '***-**-****' : 'N/A'], ['Ownership %:', applicationData.principal_ownership_percentage ? `${applicationData.principal_ownership_percentage}%` : 'N/A']];
      } else {
        ownerInfo = [['Name:', applicationData.principal_owner_name || 'N/A'], ['Home Address:', applicationData.home_address || 'N/A'], ['City:', applicationData.city_owner || 'N/A'], ['State:', applicationData.state_owner || 'N/A'], ['ZIP:', applicationData.zip_owner || 'N/A'], ['Home Phone:', applicationData.home_phone || 'N/A'], ['Cell Phone:', applicationData.cell_phone || 'N/A'], ['Date of Birth:', applicationData.dob ? new Date(applicationData.dob).toLocaleDateString() : 'N/A'], ['SSN:', applicationData.ssn ? '***-**-****' : 'N/A'], ['Ownership %:', applicationData.ownership_percentage ? `${applicationData.ownership_percentage}%` : 'N/A']];
      }
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
      let loanInfo = [];
      if (applicationType.includes('USA')) {
        loanInfo = [['Amount Requested:', applicationData.loan_amount_requested ? `$${applicationData.loan_amount_requested.toLocaleString()}` : 'N/A'], ['Use of Funds:', applicationData.use_of_funds || 'N/A'], ['Current Processor:', applicationData.current_processor || 'N/A'], ['Monthly Processing Volume:', applicationData.monthly_processing_volume ? `$${applicationData.monthly_processing_volume.toLocaleString()}` : 'N/A'], ['Average Ticket:', applicationData.average_ticket ? `$${applicationData.average_ticket.toLocaleString()}` : 'N/A'], ['High Ticket:', applicationData.high_ticket ? `$${applicationData.high_ticket.toLocaleString()}` : 'N/A']];
      } else {
        loanInfo = [['Amount Requested:', applicationData.amount_requested ? `$${applicationData.amount_requested.toLocaleString()}` : 'N/A'], ['Use of Funds:', applicationData.use_of_funds || 'N/A'], ['Existing Advance:', applicationData.existing_advance ? 'Yes' : 'No'], ['Outstanding Balance:', applicationData.outstanding_balance ? `$${applicationData.outstanding_balance.toLocaleString()}` : 'N/A'], ['Current Processor:', applicationData.current_credit_card_processor || 'N/A']];
      }
      loanInfo.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, margin, y);
        y += 8;
      });
      if (applicationData.admin_notes) {
        y += 10;
        doc.setFontSize(14);
        doc.text('Admin Notes', margin, y);
        y += 10;
        doc.setFontSize(10);
        const splitNotes = doc.splitTextToSize(applicationData.admin_notes, pageWidth - 2 * margin);
        doc.text(splitNotes, margin, y);
      }
      doc.save(`Complete_Application_${referenceNumber}.pdf`);
      toast({
        title: "Success",
        description: "Complete application PDF downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading application:', error);
      toast({
        title: "Error",
        description: "Failed to download application PDF",
        variant: "destructive"
      });
    }
  };
  if (authLoading || loading) {
    return <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>;
  }
  if (!user || !isAdmin) {
    return null;
  }

  // Role-based menu items
  const getMenuItems = () => {
    const isPartner = userRoles.includes('lender') || userRoles.includes('broker');
    if (isSuperAdmin) {
      // Superadmin sees everything
      return [{
        title: "Leads",
        value: "leads",
        icon: Users,
        count: leads.length
      }, {
        title: "Lead Analytics",
        value: "lead-analytics",
        icon: TrendingUp
      }, {
        title: "Partners",
        value: "partners",
        icon: Users,
        count: partners.length
      }, {
        title: "Lead Engine",
        value: "lead-engine", 
        icon: SettingsIcon
      }, {
        title: "Lead Marketplace",
        value: "lead-marketplace",
        icon: DollarSign
      }, {
        title: "USA Applications",
        value: "usa-applications",
        icon: FileText,
        count: `${usaApplicationsCount} (${usaDraftsCount})`
      }, {
        title: "Canadian Applications",
        value: "canadian-applications",
        icon: FileText,
        count: `${canadianApplicationsCount} (${canadianDraftsCount})`
      }, {
        title: "Blog Management",
        value: "blog",
        icon: FileText
      }, {
        title: "Social Proof",
        value: "social-proof",
        icon: Megaphone
      }, {
        title: "Settings",
        value: "settings",
        icon: SettingsIcon
      }, {
        title: "Ads Performance",
        value: "roi",
        icon: TrendingUp
      }, {
        title: "Billing Management",
        value: "billing",
        icon: DollarSign
      }, {
        title: "Report",
        value: "report",
        icon: FileText
      }];
    } else if (isPartner) {
      // Partners see limited tabs
      return [{
        title: "My Leads",
        value: "partner-leads",
        icon: Users
      }, {
        title: "ROI",
        value: "partner-roi",
        icon: TrendingUp
      }, {
        title: "Payment & Access",
        value: "partner-payments",
        icon: DollarSign,
        disabled: true
      }];
    } else {
      // Regular users see basic tabs
      return [{
        title: "USA Applications",
        value: "usa-applications",
        icon: FileText,
        count: `${usaApplicationsCount} (${usaDraftsCount})`
      }, {
        title: "Canadian Applications",
        value: "canadian-applications",
        icon: FileText,
        count: `${canadianApplicationsCount} (${canadianDraftsCount})`
      }];
    }
  };
  const menuItems = getMenuItems();
  const handleMenuItemClick = (value: string) => {
    const item: any = (menuItems as any[]).find((mi: any) => mi.value === value);
    if (item && item.disabled) return;
    setActiveTab(value);
    if (value === 'leads' || value === 'partner-leads') {
      setApplicationSentFilter('all');
    }
  };
  const renderContent = () => {
    switch (activeTab) {
      case 'leads':
      case 'partner-leads':
        return <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredLeads.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredLeads.filter(l => (l.status || '').toString().trim().toLowerCase().replace(/_/g, ' ') === 'new').length}</div>
                  <div className="text-xs text-muted-foreground">
                    {filteredLeads.length > 0 ? Math.round((filteredLeads.filter(l => (l.status || '').toString().trim().toLowerCase().replace(/_/g, ' ') === 'new').length / filteredLeads.length) * 100) : 0}% of total
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredLeads.filter(l => isQualifiedLead(l)).length}</div>
                  <div className="text-xs text-muted-foreground">
                    {filteredLeads.length > 0 ? Math.round((filteredLeads.filter(l => isQualifiedLead(l)).length / filteredLeads.length) * 100) : 0}% of total
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Contacted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredLeads.filter(l => (l.status || '').toString().trim().toLowerCase().replace(/_/g, ' ') === 'contacted').length}</div>
                  <div className="text-xs text-muted-foreground">
                    {filteredLeads.length > 0 ? Math.round((filteredLeads.filter(l => (l.status || '').toString().trim().toLowerCase().replace(/_/g, ' ') === 'contacted').length / filteredLeads.length) * 100) : 0}% of total
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{partnerUsaApplicationsCount + partnerCanadianApplicationsCount}</div>
                  <div className="text-xs text-muted-foreground">
                    From partner-assigned leads
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Funded</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredLeads.filter(l => (l.status || '').toString().trim().toLowerCase().replace(/_/g, ' ') === 'loan approved').length}</div>
                  <div className="text-xs text-muted-foreground">
                    {filteredLeads.length > 0 ? Math.round((filteredLeads.filter(l => (l.status || '').toString().trim().toLowerCase().replace(/_/g, ' ') === 'loan approved').length / filteredLeads.length) * 100) : 0}% of total
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 mb-6">
                  {/* Search and Primary Filters */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 min-w-0 max-w-md">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by name, email, or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-44">
                          <SelectValue placeholder="Lead Status (All)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Lead Status (All)</SelectItem>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="No Answer">No Answer</SelectItem>
                          <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Application Sent">Lender Approval</SelectItem>
                          <SelectItem value="Disqualified">Disqualified</SelectItem>
                          <SelectItem value="Loan Approved">Loan Approved</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={countryFilter} onValueChange={setCountryFilter}>
                        <SelectTrigger className="w-full sm:w-36">
                          <SelectValue placeholder="All Countries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Countries</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                   {/* Additional Filters in Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                    <Select value={monthlyRevenueFilter} onValueChange={setMonthlyRevenueFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Monthly Revenue (All)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Monthly Revenue (All)</SelectItem>
                        <SelectItem value="under-10k">Under $10k</SelectItem>
                        <SelectItem value="10k-25k">$10k - $25k</SelectItem>
                        <SelectItem value="25k-50k">$25k - $50k</SelectItem>
                        <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                        <SelectItem value="100k-250k">$100k - $250k</SelectItem>
                        <SelectItem value="over-250k">Over $250k</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={loanAmountFilter} onValueChange={setLoanAmountFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Loan Required (All)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Loan Required (All)</SelectItem>
                        <SelectItem value="under-25k">Under $25k</SelectItem>
                        <SelectItem value="25k-50k">$25k - $50k</SelectItem>
                        <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                        <SelectItem value="100k-250k">$100k - $250k</SelectItem>
                        <SelectItem value="250k-500k">$250k - $500k</SelectItem>
                        <SelectItem value="over-500k">Over $500k</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={timeInBusinessFilter} onValueChange={setTimeInBusinessFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Business Age (All)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Business Age (All)</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="6-12">6-12 months</SelectItem>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="2-5">2-5 years</SelectItem>
                        <SelectItem value="5+">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={applicationSentFilter} onValueChange={setApplicationSentFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Applications (All)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Applications (All)</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Partner (All)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Partner (All)</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                         {assignmentOptions.map(option => <SelectItem key={option.id} value={option.id}>
                            {option.name} ({option.type === 'client' ? 'Client' : 'Partner'})
                           </SelectItem>)}
                      </SelectContent>
                     </Select>
                     
                     {/* Date Range Filter */}
                     <Popover>
                       <PopoverTrigger asChild>
                         <Button
                           variant="outline"
                           className={cn(
                             "w-full justify-start text-left font-normal",
                             !selectedDateRange.from && "text-muted-foreground"
                           )}
                         >
                           <CalendarIcon className="mr-2 h-4 w-4" />
                           {selectedDateRange.from ? (
                             selectedDateRange.to ? (
                               selectedDateRange.from.toDateString() === selectedDateRange.to.toDateString() ? 
                               format(selectedDateRange.from, "MMM dd, yyyy") :
                               `${format(selectedDateRange.from, "MMM dd")} - ${format(selectedDateRange.to, "MMM dd, yyyy")}`
                             ) : (
                               format(selectedDateRange.from, "MMM dd, yyyy")
                             )
                           ) : (
                             <span>Pick date range</span>
                           )}
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0" align="start">
                         <Calendar
                           mode="range"
                           selected={selectedDateRange}
                           onSelect={(range) => {
                             if (!range) {
                               setSelectedDateRange({from: undefined, to: undefined});
                               return;
                             }
                             
                             // Handle single day selection (clicking twice on same day)
                             if (range.from && range.to && range.from.toDateString() === range.to.toDateString()) {
                               setSelectedDateRange({from: range.from, to: range.from});
                             } else {
                               setSelectedDateRange({from: range.from, to: range.to});
                             }
                           }}
                           numberOfMonths={2}
                           initialFocus
                           className={cn("p-3 pointer-events-auto")}
                         />
                         {selectedDateRange.from && (
                           <div className="p-3 border-t">
                             <Button
                               variant="outline"
                               size="sm"
                               className="w-full"
                               onClick={() => setSelectedDateRange({from: undefined, to: undefined})}
                             >
                               Clear Date Range
                             </Button>
                           </div>
                         )}
                       </PopoverContent>
                     </Popover>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                     {selectedLeads.length > 0 && isSuperAdmin && <Button variant="outline" onClick={bulkSendToMake}>
                        <Webhook className="mr-2 h-4 w-4" />
                        Send {selectedLeads.length} to Make
                      </Button>}
                     {selectedLeads.length > 0 && isSuperAdmin && <Button variant="destructive" onClick={() => {
                       setBulkDelete(true);
                       setDeleteModalOpen(true);
                     }} className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Selected ({selectedLeads.length})
                      </Button>}
                    <Button onClick={exportToCSV} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {isSuperAdmin && selectedLeads.length > 0 && <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3">Bulk Actions ({selectedLeads.length} leads selected)</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={autoAssignLeadsFromEmailHistory} className="text-xs">
                          Auto-assign from Emails
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">Assign to Partner:</span>
                        <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select partner" />
                          </SelectTrigger>
                          <SelectContent>
                           {assignmentOptions.map(option => <SelectItem key={option.id} value={option.id}>
                                {option.name} ({option.email}) - {option.type === 'client' ? 'Client' : 'Partner'}
                               </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="sm" disabled={!selectedPartner || selectedLeads.length === 0} onClick={() => assignLeadsToPartner(selectedLeads, selectedPartner)} className="text-xs">
                          Assign {selectedLeads.length} Lead(s)
                        </Button>
                      </div>
                    </div>
                  </div>}
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[70vh]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        {isSuperAdmin && <TableHead className="w-12">
                            <Checkbox checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0} onCheckedChange={checked => {
                          if (checked) {
                            setSelectedLeads(filteredLeads.map(lead => lead.id));
                          } else {
                            setSelectedLeads([]);
                          }
                        }} />
                          </TableHead>}
                        <TableHead className="min-w-[200px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('name')}>
                            Lead Info
                            {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'name' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('monthly_revenue')}>
                            Monthly Revenue
                            {sortField === 'monthly_revenue' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'monthly_revenue' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>
                         <TableHead className="min-w-[120px]">Bank Account Type</TableHead>
                         <TableHead className="min-w-[120px]">Homeowner Status</TableHead>
                        <TableHead className="min-w-[120px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('loan_amount')}>
                            Loan Amount
                            {sortField === 'loan_amount' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'loan_amount' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>
                        <TableHead className="min-w-[100px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('credit_score')}>
                            Credit Score
                            {sortField === 'credit_score' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'credit_score' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('time_in_business')}>
                            Business Age
                            {sortField === 'time_in_business' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'time_in_business' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>
                        <TableHead className="min-w-[100px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('score')}>
                            Score
                            {sortField === 'score' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'score' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>
                        <TableHead className="min-w-[100px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('status')}>
                            Status
                            {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'status' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>
                        <TableHead className="min-w-[120px]">Applications</TableHead>
                        <TableHead className="min-w-[100px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('created_at')}>
                            Created
                            {sortField === 'created_at' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'created_at' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>
                        
                      {isSuperAdmin && <>
    <TableHead className="min-w-[100px]">
      <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('attribution_channel')}>
        Lead Source
        {sortField === 'attribution_channel' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
        {sortField !== 'attribution_channel' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
      </Button>
    </TableHead>
    <TableHead className="min-w-[220px]">Source URL</TableHead>
  </>}
                         <TableHead className="min-w-[120px]">Actions</TableHead>
                         {isSuperAdmin && <TableHead className="min-w-[120px]">Send to Make</TableHead>}
                        {isSuperAdmin && <TableHead className="min-w-[200px]">Send to Partner</TableHead>}
                        {isSuperAdmin && <TableHead className="min-w-[180px]">Assign Lead</TableHead>}
                        {isSuperAdmin && <TableHead className="min-w-[250px]">Custom Email</TableHead>}
                        {isSuperAdmin && <TableHead className="min-w-[150px]">
                          <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('partner_loan_amount')}>
                            Partner Loan Amount
                            {sortField === 'partner_loan_amount' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                            {sortField !== 'partner_loan_amount' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                          </Button>
                        </TableHead>}
                        <TableHead className="min-w-[200px]">Notes</TableHead>
                        {isSuperAdmin && <TableHead className="min-w-[100px]">Admin</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map(lead => <TableRow key={lead.id} className={selectedLeads.includes(lead.id) ? 'bg-blue-50' : ''}>
                          {isSuperAdmin && <TableCell>
                              <Checkbox checked={selectedLeads.includes(lead.id)} onCheckedChange={checked => {
                          if (checked) {
                            setSelectedLeads(prev => [...prev, lead.id]);
                          } else {
                            setSelectedLeads(prev => prev.filter(id => id !== lead.id));
                          }
                        }} />
                            </TableCell>}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{lead.name}</div>
                                <Button variant="ghost" size="sm" onClick={() => toggleExpandedLead(lead.id)} className="h-6 w-6 p-0">
                                  {expandedLeads[lead.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </Button>
                              </div>
                              <div className="text-sm text-muted-foreground">{lead.email}</div>
                              <div className="text-sm text-muted-foreground">{formatPhoneNumber(lead.phone)}</div>
                              <div className="text-xs text-muted-foreground">{lead.country}, {lead.city_province}</div>
                              
                              {/* Email sent status indicator */}
                              {leadCustomEmails[lead.id] && leadCustomEmails[lead.id].length > 0 && <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  ✉️ Sent ({leadCustomEmails[lead.id].length})
                                </Badge>}
                              
                              <Collapsible open={expandedLeads[lead.id]}>
                                <CollapsibleContent className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                                  <div><strong>Company:</strong> {lead.company_name || 'Not provided'}</div>
                                  <div><strong>Website:</strong> {lead.website || 'Not provided'}</div>
                                  <div><strong>Use of Funds:</strong> {lead.use_of_funds}</div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              ${lead.monthly_revenue?.toLocaleString()}/mo
                            </div>
                          </TableCell>
                           <TableCell>
                             <div className="text-sm font-medium capitalize">
                               {lead.bank_account_type || '—'}
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="text-sm font-medium capitalize">
                               {lead.homeowner_status || '—'}
                             </div>
                           </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              ${lead.loan_amount?.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {getCreditScoreNumber(lead.credit_score)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                            const y = (lead as any).founding_year as number | undefined;
                            const m = (lead as any).founding_month as number | undefined;
                            const d = (lead as any).founding_day as number | undefined;
                            let start: Date | null = null;
                            if (y && y > 0) {
                              start = new Date(y, m && m > 0 ? m - 1 : 0, d && d > 0 ? d : 1);
                            } else {
                              const usaDate = (lead as any).usa_date_incorporated as string | undefined;
                              const canDate = (lead as any).canadian_business_start_date as string | undefined;
                              if (usaDate) start = new Date(usaDate);else if (canDate) start = new Date(canDate);else {
                                const usaYears = (lead as any).usa_years_in_business as number | undefined;
                                const usaMonths = (lead as any).usa_months_in_business as number | undefined;
                                if (usaYears && usaYears > 0 || usaMonths && usaMonths > 0) {
                                  const now = new Date();
                                  const approx = new Date(now);
                                  if (usaYears && usaYears > 0) approx.setFullYear(approx.getFullYear() - usaYears);
                                  if (usaMonths && usaMonths > 0) approx.setMonth(approx.getMonth() - usaMonths);
                                  start = approx;
                                }
                              }
                            }
                            if (start) {
                              const duration = intervalToDuration({
                                start,
                                end: new Date()
                              });
                              const years = duration.years ?? 0;
                              const months = duration.months ?? 0;
                              const days = duration.days ?? 0;
                              const parts: string[] = [];
                              if (years > 0) parts.push(`${years} years`);
                              if (months > 0) parts.push(`${months} months`);
                              parts.push(`${days} days`);
                              return parts.join(', ');
                            }
                            return lead.time_in_business === 'startup' ? 'Startup' : lead.time_in_business === '6-12' ? '6-12 months' : lead.time_in_business === '1-2' ? '1-2 years' : lead.time_in_business === '2-5' ? '2-5 years' : lead.time_in_business === '+5' ? '5+ years' : lead.time_in_business || 'N/A';
                          })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${lead.score >= 85 ? 'bg-green-500' : lead.score >= 65 ? 'bg-blue-500' : lead.score >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                              <span className="font-medium">{lead.score}/100</span>
                              <span className="text-xs text-muted-foreground">
                                ({lead.score >= 85 ? 'Exceptional' : lead.score >= 65 ? 'Strong' : lead.score >= 45 ? 'Good' : 'Potential'})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select value={lead.status} onValueChange={value => updateLeadStatus(lead.id, value)}>
                              <SelectTrigger className="w-40 whitespace-nowrap">
                                <SelectValue />
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
                                  <Badge className="bg-purple-100 text-purple-800">Lender Approval</Badge>
                                </SelectItem>
                                <SelectItem value="Disqualified">
                                  <Badge className="bg-red-100 text-red-800">Disqualified</Badge>
                                </SelectItem>
                                <SelectItem value="Loan Approved">
                                  <Badge className="bg-green-100 text-green-800">Loan Approved</Badge>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {lead.has_usa_application || lead.has_canadian_application ? <div className="space-y-1">
                                {lead.has_usa_application && <div className="flex items-center gap-2">
                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      <FileText className="h-3 w-3 mr-1" />
                                      USA App
                                    </Badge>
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {lead.usa_application_reference}
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => downloadApplicationPDF(lead)} className="h-6 w-6 p-0" title="Download Application">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>}
                                {lead.has_canadian_application && <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {lead.canadian_application_reference}
                                  </span>
                                  <Button variant="ghost" size="sm" onClick={() => downloadApplicationPDF(lead)} className="h-6 w-6 p-0" title="Download Application">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>}
                              </div> : <Badge variant="outline" className="text-muted-foreground whitespace-nowrap">
                                No Application
                              </Badge>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          {isSuperAdmin && <>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {lead.attribution_channel ? lead.attribution_channel.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Direct'}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[320px]">
                                {lead.attribution_url ? <a href={lead.attribution_url.startsWith('http') ? lead.attribution_url : `https://${lead.attribution_url}`} target="_blank" rel="noopener noreferrer" className="text-xs underline break-all">
                                    {lead.attribution_url}
                                  </a> : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                            </>}
                          <TableCell>
                            <Button size="sm" onClick={() => handleCallNow(lead.phone)} disabled={!lead.phone} className="bg-green-600 hover:bg-green-700 text-white">
                              <Phone className="w-4 h-4 mr-2" />
                              Call Now
                            </Button>
                          </TableCell>
                          {isSuperAdmin && <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendToMake(lead.id)}
                              disabled={sendingToMake[lead.id]}
                              className="flex items-center gap-1"
                            >
                              {sendingToMake[lead.id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Webhook className="h-3 w-3" />
                              )}
                              {sendingToMake[lead.id] ? 'Sending...' : 'Send to Make'}
                            </Button>
                          </TableCell>}
                          {isSuperAdmin && <TableCell>
                              {partners.length > 0 ? <div className="flex items-center gap-2">
                                  <Select disabled={sendingEmails[lead.id]} value={selectedRecipients[lead.id] || ""} onValueChange={value => setSelectedRecipients(prev => ({
                            ...prev,
                            [lead.id]: value
                          }))}>
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder={sendingEmails[lead.id] ? "Sending..." : "Select partner"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {assignmentOptions.map(option => <SelectItem key={option.id} value={option.id}>
                                           <div className="flex items-center gap-2">
                                             <Send className="w-4 h-4" />
                                             {option.name} - {option.type === 'client' ? 'Client' : 'Partner'}
                                           </div>
                                         </SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  {selectedRecipients[lead.id] && <Button size="sm" onClick={async () => {
                            // First assign the lead if not already assigned
                            if (!leadAssignments[lead.id]) {
                              await assignLeadToPartner(lead.id, selectedRecipients[lead.id]);
                            }
                            // Then send the email
                            sendLeadEmail(lead.id, selectedRecipients[lead.id]);
                            // Clear selection after sending
                            setSelectedRecipients(prev => ({
                              ...prev,
                              [lead.id]: ""
                            }));
                          }} disabled={sendingEmails[lead.id]} className="bg-blue-600 hover:bg-blue-700 text-white">
                                      <Send className="w-4 h-4 mr-2" />
                                      Send Lead
                                    </Button>}
                                </div> : <div className="text-sm text-muted-foreground">
                                  No active partners
                                </div>}
                            </TableCell>}
                          {isSuperAdmin && <TableCell>
                              {leadAssignments[lead.id] ? <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                     <div className="flex flex-col">
                                       <div className="text-sm font-medium text-green-700">
                                         Assigned to: {leadAssignments[lead.id].partners.name}
                                       </div>
                                       <div className="text-xs text-blue-600">
                                         📧 {leadAssignments[lead.id].partners.email}
                                       </div>
                                       <div className="text-xs text-muted-foreground">
                                         {format(new Date(leadAssignments[lead.id].assigned_at), 'MMM dd, yyyy')}
                                       </div>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Select value={leadAssignments[lead.id].partner_id} onValueChange={partnerId => changePartnerAssignment(lead.id, partnerId)}>
                                      <SelectTrigger className="w-32 h-8 text-xs">
                                        <SelectValue placeholder="Change" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border shadow-md z-50">
                                         {assignmentOptions.map(option => <SelectItem key={option.id} value={option.id}>
                                             <div className="flex items-center gap-2">
                                               <UserCheck className="w-3 h-3" />
                                               {option.name} - {option.type === 'client' ? 'Client' : 'Partner'}
                                             </div>
                                           </SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => removePartnerAssignment(lead.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div> : partners.length > 0 ? <div className="flex items-center gap-2">
                                  <Select value="" onValueChange={partnerId => assignLeadToPartner(lead.id, partnerId)}>
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Assign to partner" />
                                    </SelectTrigger>
                                     <SelectContent className="bg-background border shadow-md z-50">
                                        {assignmentOptions.map(option => <SelectItem key={option.id} value={option.id}>
                                            <div className="flex items-center gap-2">
                                              <UserCheck className="w-4 h-4" />
                                              {option.name} - {option.type === 'client' ? 'Client' : 'Partner'}
                                            </div>
                                          </SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div> : <div className="text-sm text-muted-foreground">
                                  No active partners
                                </div>}
                            </TableCell>}
                          {isSuperAdmin && <TableCell>
                              <div className="space-y-2">
                                {/* Display sent emails with delivery status */}
                                {leadCustomEmails[lead.id] && leadCustomEmails[lead.id].length > 0 && <div className="space-y-1">
                                  {leadCustomEmails[lead.id] && leadCustomEmails[lead.id].length > 0 && <div className="text-xs text-muted-foreground">
                                      <div className="font-medium text-green-700">
                                        {leadCustomEmails[lead.id][0].recipient_emails.join(', ')}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {new Date(leadCustomEmails[lead.id][0].sent_at).toLocaleDateString()} {new Date(leadCustomEmails[lead.id][0].sent_at).toLocaleTimeString()}
                                      </div>
                                    </div>}
                                </div>}
                                
                                {/* Input for sending new emails */}
                                <div className="flex items-center gap-2">
                                  <Input placeholder="Enter email(s)..." value={customEmails[lead.id] || ""} onChange={e => setCustomEmails(prev => ({
                              ...prev,
                              [lead.id]: e.target.value
                            }))} className="w-40" />
                                  <Button size="sm" onClick={() => sendCustomLeadEmail(lead.id, customEmails[lead.id] || "")} disabled={sendingCustomEmails[lead.id] || !customEmails[lead.id]} className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap">
                                    <Send className="w-4 h-4 mr-1" />
                                    {sendingCustomEmails[lead.id] ? "Sending..." : "Send"}
                                  </Button>
                                </div>
                              </div>
                            </TableCell>}
                           {isSuperAdmin && <TableCell>
                             <Input type="number" placeholder="Enter amount..." value={lead.partner_loan_amount || ""} onChange={e => updatePartnerLoanAmount(lead.id, e.target.value)} className="w-32" />
                           </TableCell>}
                           <TableCell>
                               <div className="max-w-[200px] space-y-2">
                                 <Textarea
                                   placeholder="Add notes..."
                                   defaultValue={lead.shared_notes || ""}
                                   rows={2}
                                   className="text-xs resize-none"
                                   ref={(el) => { sharedNotesRefs.current[lead.id] = el; }}
                                 />
                                 <Button
                                   size="sm"
                                   onClick={() => saveSharedNotes(lead.id)}
                                   disabled={savingNotes[lead.id]}
                                   className="w-full"
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  {savingNotes[lead.id] ? "Saving..." : "Save"}
                                </Button>
                              </div>
                             </TableCell>
                          {isSuperAdmin && <TableCell>
                              <Button variant="destructive" size="sm" onClick={() => {
                          setLeadToDelete(lead.id);
                          setBulkDelete(false);
                          setDeleteModalOpen(true);
                        }} className="flex items-center gap-1">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>}
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {filteredLeads.length === 0 && <div className="text-center py-8 text-muted-foreground">
                No leads found matching your criteria.
              </div>}
          </div>
      case 'lead-engine':
        return <LeadEngineManagement />;
      case 'lead-marketplace':
        return <LeadMarketplace />;
      case 'applications':
        return <SimplifiedPartnersManagement />;
      case 'partners':
        return <SimplifiedPartnersManagement />;
      case 'usa-applications':
        return <USAApplicationsManagement onCountUpdate={() => {
          fetchUsaApplicationsCount();
          fetchUsaDraftsCount();
        }} />;
      case 'canadian-applications':
        return <CanadianApplicationsManagement onCountUpdate={() => {
          fetchCanadianApplicationsCount();
          fetchCanadianDraftsCount();
        }} />;
      case 'blog-creator':
        return <BlogPostCreator onBlogCreated={() => setActiveTab('blog')} />;
      case 'blog':
        return <BlogManagement />;
      case 'lead-analytics':
        return <LeadTierAnalytics />;
      case 'social-proof':
        return <SocialProofManagement />;
      case 'settings':
        return <SettingsManagement />;
      case 'partner-payments':
        return <div className="p-6 text-center text-muted-foreground">Payment & Access is temporarily disabled.</div>;
      case 'billing':
        return <BillingManagement />;
      case 'roi':
        return <ROIManagement />;
      case 'report':
        return <ReportDashboard />;
      case 'partner-roi':
        return <PartnerROIDashboard />;
      default:
        return <div>Select a menu item</div>;
    }
  };
  return <SidebarProvider>
      <div className="dashboard-container min-h-screen bg-background w-full">
        {/* Top header - spans full width */}
        <div className="app-header">
          <Header />
        </div>
        
        {/* Dashboard header with sidebar trigger and sign out */}
        <div className="dashboard-header border-b h-16 flex items-center px-4 lg:col-span-2">
          <SidebarTrigger className="mr-4 lg:hidden" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Sidebar */}
        <Sidebar collapsible="icon" className="app-sidebar border-r">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.value;
                  const disabled = !!item.disabled;
                  return <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton asChild isActive={!disabled && isActive} onClick={disabled ? undefined : () => handleMenuItemClick(item.value)}>
                          <button className={`flex items-center gap-2 w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={disabled} aria-disabled={disabled}>
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.count !== undefined && <div className="ml-auto inline-flex items-center justify-center whitespace-nowrap min-w-[20px] h-5 px-1.5 text-xs font-medium text-sidebar-primary bg-status-active rounded">
                                {item.count}
                              </div>}
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>;
                })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main content */}
        <main className="main-content p-2 sm:p-4 md:p-6 overflow-y-auto min-w-0">
          <div className="min-w-0 max-w-full">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <div className="app-footer">
          <Footer />
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-destructive">
                {bulkDelete ? `Delete ${selectedLeads.length} Leads` : 'Delete Lead'}
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the {bulkDelete ? `${selectedLeads.length} selected leads` : 'lead'} and all associated data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  To confirm deletion, please type <span className="font-mono bg-muted px-1 rounded">DELETE LEAD</span> below:
                </p>
                <Input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE LEAD to confirm" className="font-mono" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteConfirmText !== 'DELETE LEAD'}>
                {bulkDelete ? `Delete ${selectedLeads.length} Leads` : 'Delete Lead'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>;
};
export default Admin;