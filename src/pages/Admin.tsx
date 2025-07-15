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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Download, Search, Filter, LogOut, Users, FileText, PenTool, Mail, Clock, Trash2, Phone, ChevronDown, ChevronRight, MessageCircle, CheckSquare, Square, UserCheck } from 'lucide-react';
import Header from '@/components/Header';
import BlogManagement from '@/components/admin/BlogManagement';
import BlogPostCreator from '@/components/admin/BlogPostCreator';
import EmailSequenceManagement from '@/components/admin/EmailSequenceManagement';
import AvailableTimesManagement from '@/components/admin/AvailableTimesManagement';
import { ChatWidgetManagement } from '@/components/admin/ChatWidgetManagement';
import { ApplicationsManagement } from '@/components/admin/ApplicationsManagement';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('leads');
  const [expandedLeads, setExpandedLeads] = useState<{ [key: string]: boolean }>({});
  const [emailEnrollments, setEmailEnrollments] = useState<{ [key: string]: { [key: string]: boolean } }>({});
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const { user, isAdmin, isSuperAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    }
  }, [user, isAdmin]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { data: enrollments, error } = await supabase
        .from('email_enrollments')
        .select('user_email, sequence_id, status')
        .in('user_email', leadsData.map(lead => lead.email))
        .eq('status', 'active');

      if (error) throw error;

      // Initialize enrollment map for all leads first
      const enrollmentMap: { [key: string]: { [key: string]: boolean } } = {};
      
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

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quiz_responses')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.filter(lead => lead.id !== leadId));
      
      toast({
        title: "Success",
        description: "Lead deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive"
      });
    }
  };

  const toggleEmailSequence = async (leadEmail: string, leadName: string, sequenceId: string, isEnabled: boolean) => {
    try {
      if (isEnabled) {
        // Enroll in sequence
        const { error } = await supabase
          .from('email_enrollments')
          .insert({
            user_email: leadEmail,
            user_name: leadName,
            sequence_id: sequenceId,
            status: 'active'
          });

        if (error) throw error;
      } else {
        // Unenroll from sequence
        const { error } = await supabase
          .from('email_enrollments')
          .update({ status: 'cancelled' })
          .eq('user_email', leadEmail)
          .eq('sequence_id', sequenceId);

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
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
    
    // Clear selected leads that are no longer in filtered results
    setSelectedLeads(prev => prev.filter(id => filtered.some(lead => lead.id === id)));
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const exportSelectedToCSV = () => {
    const leadsToExport = selectedLeads.length > 0 
      ? leads.filter(lead => selectedLeads.includes(lead.id))
      : filteredLeads;

    const headers = ['Name', 'Email', 'Phone', 'Monthly Revenue', 'Loan Amount', 'Credit Score', 'Time in Business', 'Use of Funds', 'Score', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...leadsToExport.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        lead.monthly_revenue,
        lead.loan_amount,
        lead.credit_score,
        lead.time_in_business,
        lead.use_of_funds,
        lead.score,
        lead.status,
        format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${selectedLeads.length > 0 ? 'selected' : 'filtered'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

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
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        lead.monthly_revenue,
        lead.loan_amount,
        lead.credit_score,
        lead.time_in_business,
        lead.use_of_funds,
        lead.score,
        lead.status,
        format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage leads and content</p>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-6' : 'grid-cols-3'}`}>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="available-times" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Available Times
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Applications
            </TabsTrigger>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="email-sequence" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Sequence
                </TabsTrigger>
                <TabsTrigger value="chat-widget" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat Widget
                </TabsTrigger>
                <TabsTrigger value="blog" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Blog Management
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
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
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
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
                      <Button onClick={exportSelectedToCSV} className="bg-green-600 hover:bg-green-700 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Export Selected ({selectedLeads.length})
                      </Button>
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
                          <Checkbox
                            checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all leads"
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Loan Details</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Email Sequences</TableHead>
                        <TableHead>Call Now</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={() => toggleSelectLead(lead.id)}
                              aria-label={`Select ${lead.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{lead.email}</div>
                              <div className="text-muted-foreground">{lead.phone}</div>
                              {lead.website && (
                                <div className="text-muted-foreground">
                                  <a 
                                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="hover:underline text-primary"
                                  >
                                    {lead.website.replace(/^https?:\/\//, '')}
                                  </a>
                                </div>
                              )}
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
                                    {expandedLeads[lead.id] ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
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
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  key={`${lead.id}-follow-up`}
                                  checked={emailEnrollments[lead.email]?.[EMAIL_SEQUENCES.FOLLOW_UP] || false}
                                  onCheckedChange={(checked) => 
                                    toggleEmailSequence(lead.email, lead.name, EMAIL_SEQUENCES.FOLLOW_UP, checked)
                                  }
                                />
                                <span className="text-sm text-muted-foreground">Follow-up</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  key={`${lead.id}-pre-call`}
                                  checked={emailEnrollments[lead.email]?.[EMAIL_SEQUENCES.PRE_CALL] || false}
                                  onCheckedChange={(checked) => 
                                    toggleEmailSequence(lead.email, lead.name, EMAIL_SEQUENCES.PRE_CALL, checked)
                                  }
                                />
                                <span className="text-sm text-muted-foreground">Pre-Call</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleCallNow(lead.phone)}
                              disabled={!lead.phone}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Call Now
                            </Button>
                          </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               <Select
                                 value={lead.status}
                                 onValueChange={(value) => updateLeadStatus(lead.id, value)}
                               >
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
                               {isSuperAdmin && (
                                 <Button
                                   variant="destructive"
                                   size="sm"
                                   onClick={() => deleteLead(lead.id)}
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               )}
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No leads found matching your criteria.
              </div>
            )}
          </TabsContent>

          <TabsContent value="available-times">
            <AvailableTimesManagement />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsManagement />
          </TabsContent>

          <TabsContent value="email-sequence">
            <EmailSequenceManagement />
          </TabsContent>

          <TabsContent value="chat-widget">
            <ChatWidgetManagement />
          </TabsContent>

          <TabsContent value="blog-creator">
            <BlogPostCreator onBlogCreated={() => setActiveTab('blog')} />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManagement />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;