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
import { useAuth } from "@/hooks/use-auth";

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
  broker_commission_percentage?: number | null;
  platform_commission_percentage?: number | null;
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [newPartner, setNewPartner] = useState<NewPartner>({
    name: '',
    email: '',
    company_name: '',
    phone: '',
    application_type: 'broker',
    password: ''
  });
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const isStrongPassword = (pwd: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pwd);
  const passwordRequirements = "Min 8 chars with uppercase, lowercase, number and symbol.";

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
      
      console.log('Creating partner via edge function...');
      const { data, error } = await supabase.functions.invoke('create-partner-simplified', {
        body: newPartner
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Error creating partner:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

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

  const editPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setEditModalOpen(true);
  };

  const updatePartner = async () => {
    if (!editingPartner) return;

    if (!editingPartner.name || !editingPartner.email || !editingPartner.company_name) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!editingPartner.email.includes('@')) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('partners')
        .update({
          name: editingPartner.name,
          email: editingPartner.email,
          company_name: editingPartner.company_name,
          phone: editingPartner.phone,
          application_type: editingPartner.application_type,
          is_active: editingPartner.is_active,
          ...(isSuperAdmin ? {
            broker_commission_percentage: editingPartner.broker_commission_percentage,
            platform_commission_percentage: editingPartner.platform_commission_percentage,
          } : {})
        })
        .eq('id', editingPartner.id);

      if (error) throw error;

      toast({ title: "Success", description: "Partner updated successfully" });
      setEditModalOpen(false);
      setEditingPartner(null);
      fetchPartners();
    } catch (error: any) {
      console.error('Error updating partner:', error);
      toast({ title: "Error", description: "Failed to update partner", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (partner: Partner) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-password-reset-link', {
        body: { email: partner.email },
      });

      if (error) throw error;

      if (data?.action_link) {
        try {
          await navigator.clipboard.writeText(data.action_link);
          toast({ title: "Success", description: "Reset link generated and copied to clipboard." });
        } catch (_) {
          toast({ title: "Success", description: "Reset link generated." });
        }
      } else {
        toast({ title: "Success", description: "Password reset link generated." });
      }
    } catch (error: any) {
      console.error('Error generating reset link:', error);
      const msg = error?.message || error?.error || 'Failed to generate reset link';
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const changePassword = async () => {
    if (!editingPartner?.user_id) {
      toast({ title: "Error", description: "No user account associated with this partner", variant: "destructive" });
      return;
    }
    if (!isSuperAdmin) {
      toast({ title: "Unauthorized", description: "Only superadmins can change passwords", variant: "destructive" });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      toast({ title: "Error", description: "Password must be at least 8 chars and include uppercase, lowercase, number and symbol", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      setPwLoading(true);
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { user_id: editingPartner.user_id, new_password: newPassword },
      });
      if (error || data?.error) throw (error || new Error(data?.error));
      toast({ title: "Success", description: "Password updated successfully" });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      const msg = error?.message || error?.error || 'Failed to update password';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setPwLoading(false);
    }
  };

  const deletePartner = async (partner: Partner) => {
    if (!confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      return;
    }

    try {
      // First, unassign all leads from this partner
      const { error: unassignError } = await supabase
        .from('quiz_responses')
        .update({ assigned_partner_id: null, assignment_date: null })
        .eq('assigned_partner_id', partner.id);

      if (unassignError) {
        console.error('Error unassigning leads:', unassignError);
        throw unassignError;
      }

      // Delete lead assignments
      const { error: assignmentError } = await supabase
        .from('lead_assignments')
        .delete()
        .eq('partner_id', partner.id);

      if (assignmentError) {
        console.error('Error deleting lead assignments:', assignmentError);
        // Continue even if this fails
      }

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
                  onClick={() => editPartner(partner)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
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
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    let formatted = '';
                    
                    if (value.length > 0) {
                      if (value.length <= 10) {
                        // US format: (xxx) xxx-xxxx
                        if (value.length <= 3) {
                          formatted = value;
                        } else if (value.length <= 6) {
                          formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                        } else {
                          formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                        }
                      } else if (value.length === 11 && value.startsWith('1')) {
                        // US with country code: +1 (xxx) xxx-xxxx
                        const number = value.slice(1);
                        if (number.length <= 3) {
                          formatted = `+1 (${number}`;
                        } else if (number.length <= 6) {
                          formatted = `+1 (${number.slice(0, 3)}) ${number.slice(3)}`;
                        } else {
                          formatted = `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 10)}`;
                        }
                      } else {
                        // Limit to 11 digits max
                        formatted = value.slice(0, 11);
                      }
                    }
                    
                    setNewPartner({ ...newPartner, phone: formatted });
                  }}
                  placeholder="+1 (555) 123-4567"
                  maxLength={17} // +1 (xxx) xxx-xxxx
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

      {/* Edit Partner Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Partner</DialogTitle>
          </DialogHeader>
          {editingPartner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingPartner.name}
                    onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                    placeholder="Partner name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingPartner.email}
                    onChange={(e) => setEditingPartner({ ...editingPartner, email: e.target.value })}
                    placeholder="partner@company.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-company">Company Name *</Label>
                <Input
                  id="edit-company"
                  value={editingPartner.company_name}
                  onChange={(e) => setEditingPartner({ ...editingPartner, company_name: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editingPartner.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      let formatted = '';
                      
                      if (value.length > 0) {
                        if (value.length <= 10) {
                          // US format: (xxx) xxx-xxxx
                          if (value.length <= 3) {
                            formatted = value;
                          } else if (value.length <= 6) {
                            formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                          } else {
                            formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                          }
                        } else if (value.length === 11 && value.startsWith('1')) {
                          // US with country code: +1 (xxx) xxx-xxxx
                          const number = value.slice(1);
                          if (number.length <= 3) {
                            formatted = `+1 (${number}`;
                          } else if (number.length <= 6) {
                            formatted = `+1 (${number.slice(0, 3)}) ${number.slice(3)}`;
                          } else {
                            formatted = `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 10)}`;
                          }
                        } else {
                          // Limit to 11 digits max
                          formatted = value.slice(0, 11);
                        }
                      }
                      
                      setEditingPartner({ ...editingPartner, phone: formatted });
                    }}
                    placeholder="+1 (555) 123-4567"
                    maxLength={17} // +1 (xxx) xxx-xxxx
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Type *</Label>
                  <Select 
                    value={editingPartner.application_type} 
                    onValueChange={(value: 'broker' | 'lender') => 
                      setEditingPartner({ ...editingPartner, application_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="broker">Broker</SelectItem>
                      <SelectItem value="lender">Lender</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editingPartner.is_active ? "active" : "inactive"} 
                  onValueChange={(value) => 
                    setEditingPartner({ ...editingPartner, is_active: value === "active" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isSuperAdmin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-broker-commission">Broker Commission %</Label>
                    <Input
                      id="edit-broker-commission"
                      type="number"
                      step="0.01"
                      value={editingPartner.broker_commission_percentage ?? ''}
                      onChange={(e) => setEditingPartner({ ...editingPartner, broker_commission_percentage: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-platform-commission">Platform Commission %</Label>
                    <Input
                      id="edit-platform-commission"
                      type="number"
                      step="0.01"
                      value={editingPartner.platform_commission_percentage ?? ''}
                      onChange={(e) => setEditingPartner({ ...editingPartner, platform_commission_percentage: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="e.g. 5"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">Applies to funded loan amounts for this partner.</p>
                </div>
              )}

              {isSuperAdmin && editingPartner.user_id && (
                <div className="rounded-md border p-3 space-y-3">
                  <h4 className="font-medium text-sm">Change Password (Superadmin)</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 chars, include upper, lower, number, symbol"
                      />
                      <p className={`mt-1 text-xs ${newPassword && !isStrongPassword(newPassword) ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {passwordRequirements}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={changePassword}
                      disabled={pwLoading || !isStrongPassword(newPassword) || newPassword !== confirmPassword}
                    >
                      {pwLoading ? 'Updating…' : 'Update Password'}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingPartner(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={updatePartner}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Partner'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}