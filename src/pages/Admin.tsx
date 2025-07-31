import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Helper function to get credit score number from classification
const getCreditScoreNumber = (creditScore: string) => {
  switch (creditScore) {
    case "excellent": return "750+";
    case "good": return "700-749"; 
    case "fair": return "650-699";
    case "poor": return "Below 650";
    default: return creditScore;
  }
};
import { Download, Search, Filter, LogOut, Users, FileText, PenTool, Mail, Trash2, Phone, ChevronDown, ChevronRight, CheckSquare, Square, UserCheck, Megaphone, Send, Check, DollarSign, Settings as SettingsIcon, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import BlogManagement from '@/components/admin/BlogManagement';
import BlogPostCreator from '@/components/admin/BlogPostCreator';
import EmailSequenceManagement from '@/components/admin/EmailSequenceManagement';
import { ApplicationsManagement } from '@/components/admin/ApplicationsManagement';
import USAApplicationsManagement from '@/components/admin/USAApplicationsManagement';
import CanadianApplicationsManagement from '@/components/admin/CanadianApplicationsManagement';
import SocialProofManagement from '@/components/admin/SocialProofManagement';
import SettingsManagement from '@/components/admin/SettingsManagement';
import PartnerManagement from '@/components/admin/PartnerManagement';
import Footer from '@/components/Footer';

interface QuizResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
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
  // Add application tracking
  has_usa_application?: boolean;
  has_canadian_application?: boolean;
  usa_application_reference?: string;
  canadian_application_reference?: string;
}

const Admin = () => {
  const [leads, setLeads] = useState<QuizResponse[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<QuizResponse[]>([]);
  const [approvedPartners, setApprovedPartners] = useState<Array<{
    id: string;
    name: string;
    email: string;
  }>>([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [usaApplicationsCount, setUsaApplicationsCount] = useState(0);
  const [canadianApplicationsCount, setCanadianApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('leads');
  const [expandedLeads, setExpandedLeads] = useState<{
    [key: string]: boolean;
  }>({});
  const [emailEnrollments, setEmailEnrollments] = useState<{
    [key: string]: {
      [key: string]: boolean;
    };
  }>({});
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sendingEmails, setSendingEmails] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedRecipients, setSelectedRecipients] = useState<{
    [key: string]: string;
  }>({});
  const [customEmails, setCustomEmails] = useState<Record<string, string>>({});
  const [sendingCustomEmails, setSendingCustomEmails] = useState<Record<string, boolean>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [bulkDelete, setBulkDelete] = useState(false); // Track if it's bulk delete
  const [leadBookings, setLeadBookings] = useState<Array<{
    id: string;
    booking_status: string;
  }>>([]);
  const {
    user,
    isAdmin,
    isSuperAdmin,
    signOut,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Email sequence IDs - these should match the actual sequence IDs from your database
  const EMAIL_SEQUENCES = {
    FOLLOW_UP: '7473795a-4822-49ef-9f5f-d1b35857277a',
    PRE_CALL: 'a4eb9d81-6602-4e99-959d-1a1b8e5592a5'
  };

  const toggleExpandedLead = (leadId: string) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const handleCallNow = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchLeads();
      fetchApplicationsCount();
      fetchUsaApplicationsCount();
      fetchCanadianApplicationsCount();
      if (isSuperAdmin) {
        fetchApprovedPartners();
      }
    }
  }, [user, isAdmin, isSuperAdmin]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('quiz_responses').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Fetch application status for each lead
      const enrichedLeads = await Promise.all((data || []).map(async (lead) => {
        try {
          // Check for USA applications
          const { data: usaApps } = await supabase
            .from('usa_applications')
            .select('application_reference_number')
            .eq('quiz_response_id', lead.id)
            .limit(1);

          // Check for Canadian applications  
          const { data: canadianApps } = await supabase
            .from('canadian_applications')
            .select('application_reference_number')
            .eq('quiz_response_id', lead.id)
            .limit(1);

          return {
            ...lead,
            has_usa_application: (usaApps && usaApps.length > 0),
            has_canadian_application: (canadianApps && canadianApps.length > 0),
            usa_application_reference: usaApps?.[0]?.application_reference_number || null,
            canadian_application_reference: canadianApps?.[0]?.application_reference_number || null,
          };
        } catch (err) {
          console.error('Error enriching lead:', err);
          return {
            ...lead,
            has_usa_application: false,
            has_canadian_application: false,
            usa_application_reference: null,
            canadian_application_reference: null,
          };
        }
      }));

      setLeads(enrichedLeads);

      // Fetch email enrollments for all leads
      await fetchEmailEnrollments(enrichedLeads);
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

  const fetchEmailEnrollments = async (leadsData: QuizResponse[]) => {
    try {
      console.log('Fetching email enrollments for leads:', leadsData.length);
      
      const {
        data: enrollments,
        error
      } = await supabase.from('email_enrollments').select('user_email, sequence_id, status').in('user_email', leadsData.map(lead => lead.email));
      
      if (error) {
        console.error('Error fetching enrollments:', error);
        throw error;
      }

      console.log('Retrieved enrollments:', enrollments);

      // Initialize enrollment map for all leads first
      const enrollmentMap: {
        [key: string]: {
          [key: string]: boolean;
        };
      } = {};
      
      leadsData.forEach(lead => {
        enrollmentMap[lead.email] = {
          [EMAIL_SEQUENCES.FOLLOW_UP]: false,
          [EMAIL_SEQUENCES.PRE_CALL]: false
        };
      });

      // Then update with actual ACTIVE enrollments
      enrollments?.forEach(enrollment => {
        if (enrollmentMap[enrollment.user_email] && enrollment.status === 'active') {
          enrollmentMap[enrollment.user_email][enrollment.sequence_id] = true;
          console.log(`Setting ${enrollment.user_email} sequence ${enrollment.sequence_id} to active`);
        }
      });
      
      console.log('Final enrollment map:', enrollmentMap);
      setEmailEnrollments(enrollmentMap);
    } catch (error) {
      console.error('Error fetching email enrollments:', error);
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
      const {
        count,
        error
      } = await supabase.from('usa_applications').select('*', {
        count: 'exact',
        head: true
      });
      if (error) throw error;
      setUsaApplicationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching USA applications count:', error);
    }
  };

  const fetchCanadianApplicationsCount = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from('canadian_applications').select('*', {
        count: 'exact',
        head: true
      });
      if (error) throw error;
      setCanadianApplicationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching Canadian applications count:', error);
    }
  };

  const fetchApprovedPartners = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('lender_broker_applications').select('id, applicant_name, applicant_email').eq('status', 'approved');
      if (error) throw error;
      setApprovedPartners(data.map(partner => ({
        id: partner.id,
        name: partner.applicant_name,
        email: partner.applicant_email
      })));
    } catch (error) {
      console.error('Error fetching approved partners:', error);
    }
  };

  // Set up real-time subscription for approved partners
  useEffect(() => {
    if (isSuperAdmin) {
      const channel = supabase.channel('approved-partners-changes').on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'lender_broker_applications',
        filter: 'status=eq.approved'
      }, () => {
        fetchApprovedPartners();
      }).subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isSuperAdmin]);

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
      const results = await Promise.allSettled(
        emailList.map(recipientEmail => 
          supabase.functions.invoke('send-lead-email', {
            body: {
              leadId,
              recipientEmail,
              recipientName: recipientEmail.split('@')[0] // Use email prefix as name
            }
          })
        )
      );

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
    const recipient = approvedPartners.find(p => p.id === recipientId);
    if (!recipient) {
      toast({
        title: "Error",
        description: "Selected recipient is not available. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    // Double-check recipient is still approved before sending
    try {
      const {
        data: verifiedRecipient,
        error
      } = await supabase.from('lender_broker_applications').select('status').eq('id', recipientId).eq('status', 'approved').single();
      if (error || !verifiedRecipient) {
        toast({
          title: "Error",
          description: "Recipient is no longer approved to receive leads.",
          variant: "destructive"
        });
        // Refresh the approved partners list
        fetchApprovedPartners();
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
      if (error.message?.includes('not an approved partner')) {
        toast({
          title: "Access Denied",
          description: "Cannot send lead to non-approved partners. The recipient list has been updated.",
          variant: "destructive"
        });
        // Refresh the approved partners list
        fetchApprovedPartners();
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
          const { error: bookingsError } = await supabase
            .from('call_bookings')
            .delete()
            .in('quiz_response_id', selectedLeads);
          
          if (bookingsError) {
            console.error('Error deleting call bookings:', bookingsError);
            throw bookingsError;
          }
          console.log('Associated call bookings deleted successfully');
        }

        // Then delete the selected leads
        const { error } = await supabase
          .from('quiz_responses')
          .delete()
          .in('id', selectedLeads);
        
        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }
        
        console.log('Selected leads deleted successfully');
        setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
        setSelectedLeads([]);
        
        const deletionMessage = leadBookings.length > 0 
          ? `${selectedLeads.length} lead(s) and ${leadBookings.length} associated call booking(s) deleted successfully`
          : `${selectedLeads.length} lead(s) deleted successfully`;
        
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
          const { error: bookingsError } = await supabase
            .from('call_bookings')
            .delete()
            .eq('quiz_response_id', leadToDelete);
          
          if (bookingsError) {
            console.error('Error deleting call bookings:', bookingsError);
            throw bookingsError;
          }
          console.log('Associated call bookings deleted successfully');
        }

        // Then delete the lead
        const { error } = await supabase
          .from('quiz_responses')
          .delete()
          .eq('id', leadToDelete);
        
        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }
        
        console.log('Lead deleted successfully');
        setLeads(leads.filter(lead => lead.id !== leadToDelete));
        
        const deletionMessage = leadBookings.length > 0 
          ? `Lead and ${leadBookings.length} associated call booking(s) deleted successfully`
          : "Lead deleted successfully";
        
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

  const toggleEmailSequence = async (leadEmail: string, leadName: string, sequenceId: string, isEnabled: boolean) => {
    console.log(`Toggling email sequence for ${leadEmail}, sequence: ${sequenceId}, enabled: ${isEnabled}`);
    
    // Optimistically update UI
    setEmailEnrollments(prev => ({
      ...prev,
      [leadEmail]: {
        ...prev[leadEmail],
        [sequenceId]: isEnabled
      }
    }));

    try {
      if (isEnabled) {
        // Check if there's an existing enrollment first
        const { data: existingEnrollment } = await supabase
          .from('email_enrollments')
          .select('id, status')
          .eq('user_email', leadEmail)
          .eq('sequence_id', sequenceId)
          .maybeSingle();

        if (existingEnrollment && existingEnrollment.status === 'cancelled') {
          // Reactivate existing enrollment
          console.log('Reactivating existing enrollment:', existingEnrollment.id);
          const { error } = await supabase
            .from('email_enrollments')
            .update({ 
              status: 'active',
              enrolled_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEnrollment.id);
          
          if (error) throw error;
        }

        // Always trigger the email sequence when enabling (for both new and reactivated enrollments)
        const sequenceType = sequenceId === EMAIL_SEQUENCES.FOLLOW_UP ? 'follow_up' : 'pre_call_reminder';
        console.log(`Triggering email sequence: ${sequenceType}`);
        
        const leadData = leads.find(l => l.email === leadEmail);
        
        const { error: emailError } = await supabase.functions.invoke('send-email-sequence', {
          body: {
            type: sequenceType,
            userEmail: leadEmail,
            userName: leadName,
            variables: {
              callDate: '',
              callTime: '',
              userPhone: leadData?.phone || '',
              monthly_revenue: leadData?.monthly_revenue || 0,
              loan_amount: leadData?.loan_amount || 0,
              credit_score: leadData?.credit_score || '',
              time_in_business: leadData?.time_in_business || '',
              use_of_funds: leadData?.use_of_funds || ''
            }
          }
        });
        
        if (emailError) {
          console.error('Email sequence error:', emailError);
          throw emailError;
        }

        console.log('Email sequence triggered successfully');
      } else {
        // Unenroll from sequence
        console.log('Unenrolling from sequence');
        const { error } = await supabase.from('email_enrollments')
          .update({ status: 'cancelled' })
          .eq('user_email', leadEmail)
          .eq('sequence_id', sequenceId);
        
        if (error) throw error;
        console.log('Successfully unenrolled from sequence');
      }

      const sequenceName = sequenceId === EMAIL_SEQUENCES.FOLLOW_UP ? 'Follow-up' : 'Pre-Call';
      toast({
        title: "Success",
        description: `${sequenceName} sequence ${isEnabled ? 'enabled' : 'disabled'} for ${leadName}${isEnabled ? ' - Email sent!' : ''}`
      });
      
    } catch (error) {
      console.error('Error in toggleEmailSequence:', error);
      
      // Reset the toggle state on error
      setEmailEnrollments(prev => ({
        ...prev,
        [leadEmail]: {
          ...prev[leadEmail],
          [sequenceId]: !isEnabled
        }
      }));
      
      toast({
        title: "Error", 
        description: `Failed to ${isEnabled ? 'enable' : 'disable'} email sequence: ${error.message}`,
        variant: "destructive"
      });
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
    setFilteredLeads(filtered);

    // Clear selected leads that are no longer in filtered results
    setSelectedLeads(prev => prev.filter(id => filtered.some(lead => lead.id === id)));
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
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
      const { data: bookings, error } = await supabase
        .from('call_bookings')
        .select('id, booking_status, quiz_response_id')
        .in('quiz_response_id', selectedLeads);
      
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
        const { data } = await supabase
          .from('usa_applications')
          .select('*')
          .eq('quiz_response_id', lead.id)
          .single();
        applicationData = data;
        referenceNumber = lead.usa_application_reference;
        applicationType = 'USA Business Loan Application';
      } else if (lead.has_canadian_application && lead.canadian_application_reference) {
        const { data } = await supabase
          .from('canadian_applications')
          .select('*')
          .eq('quiz_response_id', lead.id)
          .single();
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
      doc.text(applicationType, pageWidth / 2, y, { align: 'center' });
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
      
      const leadInfo = [
        ['Name:', lead.name],
        ['Email:', lead.email],
        ['Phone:', lead.phone],
        ['Monthly Revenue:', `$${lead.monthly_revenue.toLocaleString()}`],
        ['Loan Amount:', `$${lead.loan_amount.toLocaleString()}`],
        ['Credit Score:', lead.credit_score],
        ['Time in Business:', lead.time_in_business],
        ['Use of Funds:', lead.use_of_funds],
        ['Quiz Score:', lead.score.toString()]
      ];

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
        businessInfo = [
          ['Legal Corporation Name:', applicationData.legal_corporation_name || 'N/A'],
          ['DBA Name:', applicationData.dba_name || 'N/A'],
          ['Business Phone:', applicationData.telephone_number || 'N/A'],
          ['Email Address:', applicationData.email_address || 'N/A'],
          ['Physical Address:', applicationData.physical_address || 'N/A'],
          ['City:', applicationData.city || 'N/A'],
          ['State:', applicationData.state || 'N/A'],
          ['ZIP Code:', applicationData.zip || 'N/A'],
          ['Entity Type:', applicationData.entity_type || 'N/A'],
          ['Federal Tax ID:', applicationData.federal_tax_id || 'N/A'],
          ['Years in Business:', `${applicationData.years_in_business} years, ${applicationData.months_in_business} months` || 'N/A'],
          ['Number of Employees:', applicationData.number_of_employees || 'N/A'],
          ['Monthly Rent/Mortgage:', applicationData.monthly_rent_mortgage ? `$${applicationData.monthly_rent_mortgage.toLocaleString()}` : 'N/A'],
          ['Average Monthly Deposits:', applicationData.average_monthly_deposits ? `$${applicationData.average_monthly_deposits.toLocaleString()}` : 'N/A']
        ];
      } else {
        businessInfo = [
          ['Legal Business Name:', applicationData.legal_business_name || 'N/A'],
          ['DBA Name:', applicationData.dba_name || 'N/A'],
          ['Business Phone:', applicationData.business_phone || 'N/A'],
          ['Email Address:', applicationData.email_address || 'N/A'],
          ['Physical Address:', applicationData.physical_address || 'N/A'],
          ['City:', applicationData.city || 'N/A'],
          ['State/Province:', applicationData.state || 'N/A'],
          ['ZIP/Postal Code:', applicationData.zip || 'N/A'],
          ['Type of Entity:', applicationData.type_of_entity || 'N/A'],
          ['Federal Tax ID:', applicationData.federal_tax_id || 'N/A'],
          ['Business Start Date:', applicationData.business_start_date || 'N/A'],
          ['Number of Locations:', applicationData.number_of_locations || 'N/A'],
          ['Annual Gross Sales:', applicationData.annual_gross_sales ? `$${applicationData.annual_gross_sales.toLocaleString()}` : 'N/A'],
          ['Monthly Rent/Mortgage:', applicationData.monthly_rent_or_mortgage ? `$${applicationData.monthly_rent_or_mortgage.toLocaleString()}` : 'N/A']
        ];
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
        ownerInfo = [
          ['Name:', applicationData.principal_name || 'N/A'],
          ['Title:', applicationData.principal_title || 'N/A'],
          ['Email:', applicationData.principal_email || 'N/A'],
          ['Home Address:', applicationData.principal_home_address || 'N/A'],
          ['City:', applicationData.principal_city || 'N/A'],
          ['State:', applicationData.principal_state || 'N/A'],
          ['ZIP:', applicationData.principal_zip || 'N/A'],
          ['Home Phone:', applicationData.principal_home_phone || 'N/A'],
          ['Cell Phone:', applicationData.principal_cell_phone || 'N/A'],
          ['Date of Birth:', applicationData.principal_date_of_birth ? new Date(applicationData.principal_date_of_birth).toLocaleDateString() : 'N/A'],
          ['SSN:', applicationData.principal_ssn ? '***-**-****' : 'N/A'],
          ['Ownership %:', applicationData.principal_ownership_percentage ? `${applicationData.principal_ownership_percentage}%` : 'N/A']
        ];
      } else {
        ownerInfo = [
          ['Name:', applicationData.principal_owner_name || 'N/A'],
          ['Home Address:', applicationData.home_address || 'N/A'],
          ['City:', applicationData.city_owner || 'N/A'],
          ['State:', applicationData.state_owner || 'N/A'],
          ['ZIP:', applicationData.zip_owner || 'N/A'],
          ['Home Phone:', applicationData.home_phone || 'N/A'],
          ['Cell Phone:', applicationData.cell_phone || 'N/A'],
          ['Date of Birth:', applicationData.dob ? new Date(applicationData.dob).toLocaleDateString() : 'N/A'],
          ['SSN:', applicationData.ssn ? '***-**-****' : 'N/A'],
          ['Ownership %:', applicationData.ownership_percentage ? `${applicationData.ownership_percentage}%` : 'N/A']
        ];
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
        loanInfo = [
          ['Amount Requested:', applicationData.loan_amount_requested ? `$${applicationData.loan_amount_requested.toLocaleString()}` : 'N/A'],
          ['Use of Funds:', applicationData.use_of_funds || 'N/A'],
          ['Current Processor:', applicationData.current_processor || 'N/A'],
          ['Monthly Processing Volume:', applicationData.monthly_processing_volume ? `$${applicationData.monthly_processing_volume.toLocaleString()}` : 'N/A'],
          ['Average Ticket:', applicationData.average_ticket ? `$${applicationData.average_ticket.toLocaleString()}` : 'N/A'],
          ['High Ticket:', applicationData.high_ticket ? `$${applicationData.high_ticket.toLocaleString()}` : 'N/A']
        ];
      } else {
        loanInfo = [
          ['Amount Requested:', applicationData.amount_requested ? `$${applicationData.amount_requested.toLocaleString()}` : 'N/A'],
          ['Use of Funds:', applicationData.use_of_funds || 'N/A'],
          ['Existing Advance:', applicationData.existing_advance ? 'Yes' : 'No'],
          ['Outstanding Balance:', applicationData.outstanding_balance ? `$${applicationData.outstanding_balance.toLocaleString()}` : 'N/A'],
          ['Current Processor:', applicationData.current_credit_card_processor || 'N/A']
        ];
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
        description: "Complete application PDF downloaded successfully",
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

  const menuItems = [{
    title: "Leads",
    value: "leads",
    icon: Users,
    count: leads.length
  }, {
    title: "Partner Applications",
    value: "applications",
    icon: UserCheck,
    count: applicationsCount
  }, {
    title: "USA Applications",
    value: "usa-applications", 
    icon: FileText,
    count: usaApplicationsCount
  }, {
    title: "Canadian Applications",
    value: "canadian-applications",
    icon: FileText,
    count: canadianApplicationsCount
  }, ...(isSuperAdmin ? [{
    title: "Email Sequence",
    value: "email-sequence",
    icon: Mail
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
  }] : [])];

  const handleMenuItemClick = (value: string) => {
    setActiveTab(value);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'leads':
        return <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leads.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leads.filter(l => l.status === 'new').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Qualified</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leads.filter(l => l.status === 'qualified').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0}
                  </div>
                </CardContent>
              </Card>
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
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    {selectedLeads.length > 0 && (
                      <>
                        <Button 
                          onClick={deleteSelectedLeads}
                          variant="destructive"
                          className="text-white"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Selected ({selectedLeads.length})
                        </Button>
                        <Button onClick={exportSelectedToCSV} className="bg-green-600 hover:bg-green-700 text-white">
                          <Download className="w-4 h-4 mr-2" />
                          Export Selected ({selectedLeads.length})
                        </Button>
                      </>
                    )}
                    <Button onClick={exportSelectedToCSV} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0} onCheckedChange={toggleSelectAll} aria-label="Select all leads" />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Loan Details</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Application Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Email Sequences</TableHead>
                        <TableHead>Call Now</TableHead>
                        {isSuperAdmin && <TableHead>Send Lead To Partner</TableHead>}
                        {isSuperAdmin && <TableHead>Send to Custom Email</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map(lead => <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox checked={selectedLeads.includes(lead.id)} onCheckedChange={() => toggleSelectLead(lead.id)} aria-label={`Select ${lead.name}`} />
                          </TableCell>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{lead.email}</div>
                              <div className="text-muted-foreground">{lead.phone}</div>
                              {lead.website && <div className="text-muted-foreground">
                                  <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                    {lead.website.replace(/^https?:\/\//, '')}
                                  </a>
                                </div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {lead.country && <div className="font-medium">{lead.country}</div>}
                              {lead.city_province && <div className="text-muted-foreground">{lead.city_province}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-0 h-auto">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm">
                                      <div>${lead.loan_amount.toLocaleString()} requested</div>
                                      <div className="text-muted-foreground">${lead.monthly_revenue.toLocaleString()}/mo revenue</div>
                                    </div>
                                    {expandedLeads[lead.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </div>
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2 p-3 border rounded-md bg-muted/50">
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Credit Score:</span> {getCreditScoreNumber(lead.credit_score)} ({lead.credit_score})
                                  </div>
                                  <div>
                                    <span className="font-medium">Time in Business:</span> {lead.time_in_business}
                                  </div>
                                  <div>
                                    <span className="font-medium">Use of Funds:</span> {lead.use_of_funds}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-center">
                              <Badge variant="outline" className="mb-1">{lead.score}/100</Badge>
                              <span className="text-xs text-muted-foreground">
                                {lead.score >= 85 ? "Excellent" : 
                                 lead.score >= 70 ? "Great" : 
                                 lead.score >= 55 ? "Good" : "Fair"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(lead.status)}>
                              <div className="flex items-center gap-1">
                                {lead.status === 'new' && <UserCheck className="h-3 w-3" />}
                                {lead.status === 'contacted' && <Phone className="h-3 w-3" />}
                                {lead.status === 'qualified' && <Check className="h-3 w-3" />}
                                {lead.status === 'closed' && <DollarSign className="h-3 w-3" />}
                                {lead.status.toUpperCase()}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lead.has_usa_application || lead.has_canadian_application ? (
                              <div className="space-y-1">
                                {lead.has_usa_application && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      <FileText className="h-3 w-3 mr-1" />
                                      USA App
                                    </Badge>
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {lead.usa_application_reference}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => downloadApplicationPDF(lead)}
                                      className="h-6 w-6 p-0"
                                      title="Download Application"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                                {lead.has_canadian_application && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                      <FileText className="h-3 w-3 mr-1" />
                                      CAN App
                                    </Badge>
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {lead.canadian_application_reference}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => downloadApplicationPDF(lead)}
                                      className="h-6 w-6 p-0"
                                      title="Download Application"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                No Application
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Switch 
                                  key={`follow-up-${lead.email}-${emailEnrollments[lead.email]?.[EMAIL_SEQUENCES.FOLLOW_UP] || false}`}
                                  checked={emailEnrollments[lead.email]?.[EMAIL_SEQUENCES.FOLLOW_UP] || false} 
                                  onCheckedChange={checked => toggleEmailSequence(lead.email, lead.name, EMAIL_SEQUENCES.FOLLOW_UP, checked)} 
                                />
                                <span className="text-sm text-muted-foreground">Follow-up</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch 
                                  key={`pre-call-${lead.email}-${emailEnrollments[lead.email]?.[EMAIL_SEQUENCES.PRE_CALL] || false}`}
                                  checked={emailEnrollments[lead.email]?.[EMAIL_SEQUENCES.PRE_CALL] || false} 
                                  onCheckedChange={checked => toggleEmailSequence(lead.email, lead.name, EMAIL_SEQUENCES.PRE_CALL, checked)} 
                                />
                                <span className="text-sm text-muted-foreground">Pre-Call</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => handleCallNow(lead.phone)} disabled={!lead.phone} className="bg-green-600 hover:bg-green-700 text-white">
                              <Phone className="w-4 h-4 mr-2" />
                              Call Now
                            </Button>
                          </TableCell>
                          {isSuperAdmin && <TableCell>
                              {approvedPartners.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Select disabled={sendingEmails[lead.id]} value={selectedRecipients[lead.id] || ""} onValueChange={value => setSelectedRecipients(prev => ({
                              ...prev,
                              [lead.id]: value
                            }))}>
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder={sendingEmails[lead.id] ? "Sending..." : "Select partner"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {approvedPartners.map(partner => <SelectItem key={partner.id} value={partner.id}>
                                          <div className="flex items-center gap-2">
                                            <Send className="w-4 h-4" />
                                            {partner.name}
                                          </div>
                                        </SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  {selectedRecipients[lead.id] && <Button size="sm" onClick={() => {
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
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  No approved partners
                                </div>
                              )}
                            </TableCell>}
                          {isSuperAdmin && <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="email1@example.com, email2@example.com"
                                  value={customEmails[lead.id] || ""}
                                  onChange={(e) => setCustomEmails(prev => ({
                                    ...prev,
                                    [lead.id]: e.target.value
                                  }))}
                                  disabled={sendingCustomEmails[lead.id]}
                                  className="w-64"
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => sendCustomLeadEmail(lead.id, customEmails[lead.id] || "")}
                                  disabled={sendingCustomEmails[lead.id] || !customEmails[lead.id]?.trim()}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                  {sendingCustomEmails[lead.id] ? (
                                    <>
                                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      Sending
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Send Lead
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select value={lead.status} onValueChange={value => updateLeadStatus(lead.id, value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="contacted">Contacted</SelectItem>
                                  <SelectItem value="qualified">Qualified</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                              {isSuperAdmin && <Button variant="destructive" size="sm" onClick={() => openDeleteModal(lead.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>}
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {filteredLeads.length === 0 && <div className="text-center py-8 text-muted-foreground">
                No leads found matching your criteria.
              </div>}
          </div>;
      case 'applications':
        return <ApplicationsManagement onCountUpdate={fetchApplicationsCount} />;
      case 'usa-applications':
        return <USAApplicationsManagement onCountUpdate={fetchUsaApplicationsCount} />;
      case 'canadian-applications':
        return <CanadianApplicationsManagement onCountUpdate={fetchCanadianApplicationsCount} />;
      case 'email-sequence':
        return <EmailSequenceManagement />;
      case 'blog-creator':
        return <BlogPostCreator onBlogCreated={() => setActiveTab('blog')} />;
      case 'blog':
        return <BlogManagement />;
      case 'social-proof':
        return <SocialProofManagement />;
      case 'settings':
        return <SettingsManagement />;
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
                  {menuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.value;
                  return <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton asChild isActive={isActive} onClick={() => handleMenuItemClick(item.value)}>
                          <button className="flex items-center gap-2 w-full">
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.count !== undefined && <div className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-blue-900 bg-green-500 rounded">
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
