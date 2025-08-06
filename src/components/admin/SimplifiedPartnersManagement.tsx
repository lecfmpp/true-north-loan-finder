import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Building2, Edit3, Trash2, Key, Users, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  application_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  total_leads_assigned: number;
  leads_contacted: number;
  leads_spoken: number;
  deals_closed: number;
}

interface NewPartner {
  name: string;
  email: string;
  company_name: string;
  phone: string;
  application_type: 'broker' | 'lender';
  password: string;
}

export default function SimplifiedPartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState<NewPartner>({
    name: '',
    email: '',
    company_name: '',
    phone: '',
    application_type: 'broker',
    password: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error: any) {
      console.error('Error fetching partners:', error);
      toast({ title: "Error", description: "Failed to fetch partners", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createPartner = async () => {
    if (!newPartner.name || !newPartner.email || !newPartner.company_name || !newPartner.password) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!newPartner.email.includes('@')) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    if (newPartner.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      
      // Check if email already exists
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      
      const existingUser = existingUsers.users.find((u: any) => u.email === newPartner.email);
      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Create user account
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: newPartner.email,
        password: newPartner.password,
        email_confirm: true,
        user_metadata: {
          display_name: newPartner.name,
          company_name: newPartner.company_name,
          phone: newPartner.phone
        }
      });

      if (createUserError || !newUser.user) {
        throw new Error(createUserError?.message || 'Failed to create user account');
      }

      // Create partner record
      const { error: partnerError } = await supabase
        .from('partners')
        .insert([{
          user_id: newUser.user.id,
          name: newPartner.name,
          email: newPartner.email,
          company_name: newPartner.company_name,
          phone: newPartner.phone,
          application_type: newPartner.application_type,
          is_active: true
        }]);

      if (partnerError) throw partnerError;

      // Assign user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: newUser.user.id,
          role: newPartner.application_type
        }]);

      if (roleError) throw roleError;

      toast({ title: "Success", description: "Partner created successfully" });
      setCreateModalOpen(false);
      setNewPartner({
        name: '',
        email: '',
        company_name: '',
        phone: '',
        application_type: 'broker',
        password: ''
      });
      
      fetchPartners();
    } catch (error: any) {
      console.error('Error creating partner:', error);
      toast({ title: "Error", description: error.message || 'Failed to create partner', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (partner: Partner) => {
    if (!partner.user_id) {
      toast({ title: "Error", description: "No user account associated with this partner", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: partner.email,
      });

      if (error) throw error;
      toast({ title: "Success", description: "Password reset email sent successfully" });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({ title: "Error", description: "Failed to send password reset email", variant: "destructive" });
    }
  };

  const deletePartner = async (partner: Partner) => {
    if (!confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete partner record
      const { error: partnerError } = await supabase
        .from('partners')
        .delete()
        .eq('id', partner.id);

      if (partnerError) throw partnerError;

      // Delete user if exists
      if (partner.user_id) {
        const { error: userError } = await supabase.auth.admin.deleteUser(partner.user_id);
        if (userError) {
          console.error('Error deleting user:', userError);
          // Don't fail the whole operation if user deletion fails
        }
      }

      toast({ title: "Success", description: "Partner deleted successfully" });
      fetchPartners();
    } catch (error: any) {
      console.error('Error deleting partner:', error);
      toast({ title: "Error", description: "Failed to delete partner", variant: "destructive" });
    }
  };

  const getStatusBadge = (partner: Partner) => {
    if (!partner.user_id) {
      return <Badge variant="secondary">No Account</Badge>;
    }
    if (partner.is_active) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'broker' ? 'default' : 'secondary'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (loading && partners.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Partners Management</h2>
          <p className="text-muted-foreground">Manage broker and lender partner accounts</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Partner
        </Button>
      </div>

      <div className="grid gap-4">
        {partners.map((partner) => (
          <Card key={partner.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{partner.company_name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(partner)}
                  {getTypeBadge(partner.application_type)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{partner.email}</span>
                  </div>
                  {partner.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4" />
                    <span>{partner.company_name}</span>
                  </div>
                </div>
                
                {partner.user_id && (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Leads Assigned:</span> {partner.total_leads_assigned}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Contacted:</span> {partner.leads_contacted}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Deals Closed:</span> {partner.deals_closed}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => resetPassword(partner)}
                  disabled={!partner.user_id}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => deletePartner(partner)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Partner Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  placeholder="Partner name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                  placeholder="partner@company.com"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={newPartner.company_name}
                onChange={(e) => setNewPartner({ ...newPartner, company_name: e.target.value })}
                placeholder="Company name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={newPartner.application_type} 
                  onValueChange={(value: 'broker' | 'lender') => 
                    setNewPartner({ ...newPartner, application_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="lender">Lender</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newPartner.password}
                onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={createPartner}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Partner'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}