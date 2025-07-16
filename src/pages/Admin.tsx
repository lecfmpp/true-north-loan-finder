import { useState, useEffect } from 'react';
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
import { Download, Search, Filter, LogOut, Users, FileText, PenTool, Mail, Clock, Trash2, Phone, ChevronDown, ChevronRight, MessageCircle, CheckSquare, Square, UserCheck, Megaphone, Send, Check, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import BlogManagement from '@/components/admin/BlogManagement';
import BlogPostCreator from '@/components/admin/BlogPostCreator';
import EmailSequenceManagement from '@/components/admin/EmailSequenceManagement';
import AvailableTimesManagement from '@/components/admin/AvailableTimesManagement';
import { ChatWidgetManagement } from '@/components/admin/ChatWidgetManagement';
import { ApplicationsManagement } from '@/components/admin/ApplicationsManagement';
import SocialProofManagement from '@/components/admin/SocialProofManagement';
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
  const [bookingsCount, setBookingsCount] = useState(0);
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
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
      fetchBookingsCount();
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
      setLeads(data || []);

      // Fetch email enrollments for all leads
      await fetchEmailEnrollments(data || []);
    } catch (error) {
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
      const {
        data: enrollments,
        error
      } = await supabase.from('email_enrollments').select('user_email, sequence_id, status').in('user_email', leadsData.map(lead => lead.email)).eq('status', 'active');
      if (error) throw error;

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

      // Then update with actual enrollments
      enrollments?.forEach(enrollment => {
        if (enrollmentMap[enrollment.user_email]) {
          enrollmentMap[enrollment.user_email][enrollment.sequence_id] = true;
        }
      });
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
  const fetchBookingsCount = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from('call_bookings').select('*', {
        count: 'exact',
        head: true
      }).neq('booking_status', 'cancelled');
      if (error) throw error;
      setBookingsCount(count || 0);
    } catch (error) {
      console.error('Error fetching bookings count:', error);
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
    // Check if lead has associated call bookings
    try {
      const {
        data: bookings,
        error
      } = await supabase.from('call_bookings').select('id, booking_status').eq('quiz_response_id', leadId);
      if (error) {
        console.error('Error checking bookings:', error);
      }
      setLeadToDelete(leadId);
      setDeleteModalOpen(true);
      setDeleteConfirmText('');

      // Store booking info for the modal
      setLeadBookings(bookings || []);
    } catch (error) {
      console.error('Error checking lead bookings:', error);
      setLeadToDelete(leadId);
      setDeleteModalOpen(true);
      setDeleteConfirmText('');
      setLeadBookings([]);
    }
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setLeadToDelete(null);
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
  };
  const toggleEmailSequence = async (leadEmail: string, leadName: string, sequenceId: string, isEnabled: boolean) => {
    try {
      if (isEnabled) {
        // Enroll in sequence
        const {
          error
        } = await supabase.from('email_enrollments').insert({
          user_email: leadEmail,
          user_name: leadName,
          sequence_id: sequenceId,
          status: 'active'
        });
        if (error) throw error;
      } else {
        // Unenroll from sequence
        const {
          error
        } = await supabase.from('email_enrollments').update({
          status: 'cancelled'
        }).eq('user_email', leadEmail).eq('sequence_id', sequenceId);
        if (error) throw error;
      }

      // Update local state
      setEmailEnrollments(prev => ({
        ...prev,
        [leadEmail]: {
          ...prev[leadEmail],
          [sequenceId]: isEnabled
        }
      }));
      const sequenceName = sequenceId === EMAIL_SEQUENCES.FOLLOW_UP ? 'Follow-up' : 'Pre-Call';
      toast({
        title: "Success",
        description: `${sequenceName} sequence ${isEnabled ? 'enabled' : 'disabled'} for ${leadName}`
      });
    } catch (error) {
      console.error('Error in toggleEmailSequence:', error);
      toast({
        title: "Error",
        description: "Failed to update email sequence",
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
    const headers = ['Name', 'Email', 'Phone', 'Monthly Revenue', 'Loan Amount', 'Credit Score', 'Time in Business', 'Use of Funds', 'Score', 'Status', 'Created At'];
    const csvContent = [headers.join(','), ...leadsToExport.map(lead => [lead.name, lead.email, lead.phone, lead.monthly_revenue, lead.loan_amount, lead.credit_score, lead.time_in_business, lead.use_of_funds, lead.score, lead.status, format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm:ss')].join(','))].join('\n');
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
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive"
      });
    }
  };
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Monthly Revenue', 'Loan Amount', 'Credit Score', 'Time in Business', 'Use of Funds', 'Score', 'Status', 'Created At'];
    const csvContent = [headers.join(','), ...filteredLeads.map(lead => [lead.name, lead.email, lead.phone, lead.monthly_revenue, lead.loan_amount, lead.credit_score, lead.time_in_business, lead.use_of_funds, lead.score, lead.status, format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm:ss')].join(','))].join('\n');
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
    title: "Bookings",
    value: "available-times",
    icon: Clock,
    count: bookingsCount
  }, {
    title: "Applications",
    value: "applications",
    icon: UserCheck,
    count: applicationsCount
  }, ...(isSuperAdmin ? [{
    title: "Email Sequence",
    value: "email-sequence",
    icon: Mail
  }, {
    title: "Chat Widget",
    value: "chat-widget",
    icon: MessageCircle
  }, {
    title: "Blog Management",
    value: "blog",
    icon: FileText
  }, {
    title: "Social Proof",
    value: "social-proof",
    icon: Megaphone
  }] : [])];
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
                    {selectedLeads.length > 0 && <Button onClick={exportSelectedToCSV} className="bg-green-600 hover:bg-green-700 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Export Selected ({selectedLeads.length})
                      </Button>}
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
                        <TableHead>Loan Details</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Email Sequences</TableHead>
                        <TableHead>Call Now</TableHead>
                        {isSuperAdmin && approvedPartners.length > 0 && <TableHead>Send Lead To</TableHead>}
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
                                    <span className="font-medium">Credit Score:</span> {lead.credit_score}
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
                            <Badge variant="outline">{lead.score}/100</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(lead.status)}>
                              <div className="flex items-center gap-1">
                                {lead.status === 'new' && <Clock className="h-3 w-3" />}
                                {lead.status === 'contacted' && <Phone className="h-3 w-3" />}
                                {lead.status === 'qualified' && <Check className="h-3 w-3" />}
                                {lead.status === 'closed' && <DollarSign className="h-3 w-3" />}
                                {lead.status.toUpperCase()}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Switch key={`${lead.id}-follow-up`} checked={emailEnrollments[lead.email]?.[EMAIL_SEQUENCES.FOLLOW_UP] || false} onCheckedChange={checked => toggleEmailSequence(lead.email, lead.name, EMAIL_SEQUENCES.FOLLOW_UP, checked)} />
                                <span className="text-sm text-muted-foreground">Follow-up</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch key={`${lead.id}-pre-call`} checked={emailEnrollments[lead.email]?.[EMAIL_SEQUENCES.PRE_CALL] || false} onCheckedChange={checked => toggleEmailSequence(lead.email, lead.name, EMAIL_SEQUENCES.PRE_CALL, checked)} />
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
                          {isSuperAdmin && approvedPartners.length > 0 && <TableCell>
                              <div className="flex items-center gap-2">
                                <Select disabled={sendingEmails[lead.id]} value={selectedRecipients[lead.id] || ""} onValueChange={value => setSelectedRecipients(prev => ({
                            ...prev,
                            [lead.id]: value
                          }))}>
                                  <SelectTrigger className="w-48">
                                    <SelectValue placeholder={sendingEmails[lead.id] ? "Sending..." : "Select recipient"} />
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
      case 'available-times':
        return <AvailableTimesManagement />;
      case 'applications':
        return <ApplicationsManagement />;
      case 'email-sequence':
        return <EmailSequenceManagement />;
      case 'chat-widget':
        return <ChatWidgetManagement />;
      case 'blog-creator':
        return <BlogPostCreator onBlogCreated={() => setActiveTab('blog')} />;
      case 'blog':
        return <BlogManagement />;
      case 'social-proof':
        return <SocialProofManagement />;
      default:
        return <div>Select a menu item</div>;
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen bg-background w-full">
        <Header />
        
        {/* Header with sidebar trigger and sign out */}
        <div className="border-b h-16 flex items-center px-4">
          <SidebarTrigger className="mr-4" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="flex w-full">
          <Sidebar collapsible="icon" className="border-r">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.value;
                    return <SidebarMenuItem key={item.value}>
                          <SidebarMenuButton asChild isActive={isActive} onClick={() => setActiveTab(item.value)}>
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

          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
        <Footer />

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Lead</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the lead and all associated data.
                {leadBookings.length > 0 && <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Clock className="h-4 w-4" />
                      <strong>Warning:</strong>
                    </div>
                    <p className="text-yellow-700 mt-1">
                      This lead has {leadBookings.length} associated call booking(s) that will also be cancelled and removed permanently.
                    </p>
                  </div>}
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
                Delete Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>;
};
export default Admin;