import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit, Trash2, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  lead_source: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  admin_notes: string;
}

const ClientsManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    admin_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Custom email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailingClient, setEmailingClient] = useState<Client | null>(null);
  const [customEmailData, setCustomEmailData] = useState({
    subject: '',
    message: '',
    emailType: 'custom'
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && isSuperAdmin) {
      fetchClients();
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch clients',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.company_name && client.company_name.toLowerCase().includes(term)) ||
        (client.phone && client.phone.includes(term))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company_name: '',
      admin_notes: ''
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      company_name: client.company_name || '',
      admin_notes: client.admin_notes || ''
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingClient(null);
    resetForm();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive'
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleCreateClient = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        company_name: formData.company_name.trim() || null,
        lead_source: 'manual_entry',
        status: 'new',
        admin_notes: formData.admin_notes.trim() || null
      };

      const { error } = await supabase
        .from('clients')
        .insert(clientData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client created successfully',
      });

      closeModals();
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to create client',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!validateForm() || !editingClient) return;

    try {
      setSubmitting(true);

      const updates = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        company_name: formData.company_name.trim() || null,
        admin_notes: formData.admin_notes.trim() || null,
      };

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });

      closeModals();
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      });

      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client',
        variant: 'destructive'
      });
    }
  };

  const openEmailModal = (client: Client) => {
    setEmailingClient(client);
    setCustomEmailData({
      subject: '',
      message: '',
      emailType: 'custom'
    });
    setIsEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailingClient(null);
    setCustomEmailData({
      subject: '',
      message: '',
      emailType: 'custom'
    });
  };

  const handleSendCustomEmail = async () => {
    if (!emailingClient || !customEmailData.subject.trim() || !customEmailData.message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in both subject and message',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSendingEmail(true);

      const { error } = await supabase.functions.invoke('send-custom-client-email', {
        body: {
          to: [emailingClient.email],
          subject: customEmailData.subject,
          message: customEmailData.message,
          clientName: emailingClient.name,
          companyName: emailingClient.company_name || '',
          emailType: customEmailData.emailType
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Email sent successfully',
      });

      closeEmailModal();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'new':
        return 'secondary';
      case 'inactive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        You don't have permission to access this section.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients Management</h2>
          <p className="text-muted-foreground">Manage lead simulation and client contacts</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredClients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredClients.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredClients.filter(c => c.status === 'new').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredClients.filter(c => c.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? 'No clients match your filters' : 'No clients found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Info</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Lead Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                          {client.phone && (
                            <div className="text-sm text-muted-foreground">{client.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{client.company_name || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.lead_source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(client.status)}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(client.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEmailModal(client)}
                            title="Send Custom Email"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(client)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={closeModals}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isCreateModalOpen ? 'Add New Client' : 'Edit Client'}
            </DialogTitle>
            <DialogDescription>
              {isCreateModalOpen 
                ? 'Create a new client contact.' 
                : 'Update client information.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Company Inc."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                placeholder="Internal notes about this client..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModals} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={isCreateModalOpen ? handleCreateClient : handleUpdateClient}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (isCreateModalOpen ? 'Create Client' : 'Update Client')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Email Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={closeEmailModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Custom Email</DialogTitle>
            <DialogDescription>
              Send a custom email to {emailingClient?.name} ({emailingClient?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Type</label>
              <select
                value={customEmailData.emailType}
                onChange={(e) => setCustomEmailData(prev => ({ ...prev, emailType: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="custom">Custom Email</option>
                <option value="follow_up">Follow Up</option>
                <option value="welcome">Welcome Email</option>
                <option value="notification">Notification</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={customEmailData.subject}
                onChange={(e) => setCustomEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject line"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message *</label>
              <Textarea
                value={customEmailData.message}
                onChange={(e) => setCustomEmailData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Email message content..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEmailModal} disabled={sendingEmail}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendCustomEmail}
              disabled={sendingEmail}
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsManagement;