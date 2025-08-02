import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface Partner {
  id: string;
  name: string;
  email: string;
  company_name: string;
  phone: string | null;
  application_type: string;
  status: string;
  total_leads_assigned: number;
  leads_contacted: number;
  leads_spoken: number;
  deals_closed: number;
  created_at: string;
}

interface PartnerFormData {
  name: string;
  email: string;
  company_name: string;
  phone?: string;
  application_type: string;
  status: string;
}

export function PartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PartnerFormData>({
    defaultValues: {
      status: 'active'
    }
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: "Error",
        description: "Failed to fetch partners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PartnerFormData) => {
    try {
      if (editingPartner) {
        // Update existing partner
        const { error } = await supabase
          .from('partners')
          .update(data)
          .eq('id', editingPartner.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Partner updated successfully",
        });
      } else {
        // Create new partner with user account and role
        
        // 1. First create a user account in auth.users via admin API
        const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
          email: data.email,
          email_confirm: true,
          user_metadata: {
            display_name: data.name,
            company_name: data.company_name,
            phone: data.phone
          }
        });

        if (userError) throw userError;
        if (!newUser.user) throw new Error('Failed to create user account');

        // 2. Create partner record linked to user
        const { error: partnerError } = await supabase
          .from('partners')
          .insert([{
            user_id: newUser.user.id,
            name: data.name,
            email: data.email,
            company_name: data.company_name,
            phone: data.phone,
            application_type: data.application_type,
            status: data.status
          }]);

        if (partnerError) throw partnerError;

        // 3. Assign user role based on application type
        const roleToAssign = data.application_type === 'broker' ? 'broker' : 'lender';
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: newUser.user.id,
            role: roleToAssign,
            assigned_by: (await supabase.auth.getUser()).data.user?.id
          }]);

        if (roleError) {
          console.error('Role assignment error:', roleError);
          // Don't fail the whole operation if role assignment fails
          toast({
            title: "Warning",
            description: "Partner created but role assignment failed. Please assign role manually.",
            variant: "destructive",
          });
        }
        
        toast({
          title: "Success", 
          description: `Partner created successfully with ${roleToAssign} role`,
        });
      }
      
      fetchPartners();
      setIsAddDialogOpen(false);
      setEditingPartner(null);
      reset();
    } catch (error: any) {
      console.error('Error saving partner:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save partner",
        variant: "destructive",
      });
    }
  };

  const deletePartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', partnerId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Partner deleted successfully",
      });
      
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: "Error",
        description: "Failed to delete partner",
        variant: "destructive",
      });
    }
  };

  const startEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setValue('name', partner.name);
    setValue('email', partner.email);
    setValue('company_name', partner.company_name);
    setValue('phone', partner.phone || '');
    setValue('application_type', partner.application_type);
    setValue('status', partner.status);
    setIsAddDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateConversionRate = (partner: Partner) => {
    if (partner.total_leads_assigned === 0) return 0;
    return Math.round((partner.deals_closed / partner.total_leads_assigned) * 100);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading partners...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Partners Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPartner(null);
              reset();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? 'Edit Partner' : 'Add New Partner'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Full Name"
                  />
                  {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    placeholder="email@example.com"
                  />
                  {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    {...register('company_name', { required: 'Company name is required' })}
                    placeholder="Company Name"
                  />
                  {errors.company_name && <span className="text-red-500 text-sm">{errors.company_name.message}</span>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    {...register('phone')}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="application_type">Type</Label>
                  <Select onValueChange={(value) => setValue('application_type', value)} defaultValue={editingPartner?.application_type}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lender">Lender</SelectItem>
                      <SelectItem value="broker">Broker</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.application_type && <span className="text-red-500 text-sm">Application type is required</span>}
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value) => setValue('status', value)} defaultValue={editingPartner?.status || 'active'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <span className="text-red-500 text-sm">Status is required</span>}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingPartner(null);
                  reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPartner ? 'Update' : 'Add'} Partner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {partners.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No partners found</h3>
              <p className="text-muted-foreground mb-4">Add your first partner to start managing lead assignments.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Partner
              </Button>
            </CardContent>
          </Card>
        ) : (
          partners.map((partner) => (
            <Card key={partner.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{partner.company_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(partner.status)}
                  <Badge variant="outline">{partner.application_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{partner.total_leads_assigned}</div>
                    <div className="text-xs text-muted-foreground">Total Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{partner.leads_contacted}</div>
                    <div className="text-xs text-muted-foreground">Contacted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{partner.leads_spoken}</div>
                    <div className="text-xs text-muted-foreground">Spoken With</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{partner.deals_closed}</div>
                    <div className="text-xs text-muted-foreground">Deals Closed</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Conversion Rate: {calculateConversionRate(partner)}%</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(partner)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Partner</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {partner.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePartner(partner.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-muted-foreground">
                  <div>Email: {partner.email}</div>
                  {partner.phone && <div>Phone: {partner.phone}</div>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}