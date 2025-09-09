import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';

interface LeadSupplier {
  id: string;
  name: string;
  contact_email: string;
  daily_cap: number | null;
  weekly_cap: number | null;
  monthly_cap: number | null;
  current_daily_count: number;
  current_weekly_count: number;
  current_monthly_count: number;
  is_active: boolean;
  cost_per_lead: number | null;
  api_endpoint: string | null;
  api_key_hash: string | null;
  created_at: string;
}

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<LeadSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<LeadSupplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    daily_cap: '',
    weekly_cap: '',
    monthly_cap: '',
    cost_per_lead: '',
    api_endpoint: '',
    api_key: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data?.map(item => ({
        id: item.id,
        name: item.source_name,
        contact_email: 'contact@supplier.com',
        daily_cap: null,
        weekly_cap: null,
        monthly_cap: null,
        current_daily_count: 0,
        current_weekly_count: 0, 
        current_monthly_count: 0,
        cost_per_lead: item.cost_per_lead || null,
        api_endpoint: null,
        api_key_hash: null,
        is_active: item.is_active,
        created_at: item.created_at
      })) || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supplierData = {
        source_name: formData.name,
        source_category: 'supplier',
        source_type: 'api',
        cost_per_lead: formData.cost_per_lead ? parseFloat(formData.cost_per_lead) : null,
        is_active: formData.is_active
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from('lead_sources')
          .update(supplierData)
          .eq('id', editingSupplier.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Supplier updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('lead_sources')
          .insert([supplierData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Supplier created successfully"
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Error",
        description: "Failed to save supplier",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (supplier: LeadSupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_email: supplier.contact_email,
      daily_cap: supplier.daily_cap?.toString() || '',
      weekly_cap: supplier.weekly_cap?.toString() || '',
      monthly_cap: supplier.monthly_cap?.toString() || '',
      cost_per_lead: supplier.cost_per_lead?.toString() || '',
      api_endpoint: supplier.api_endpoint || '',
      api_key: supplier.api_key_hash || '',
      is_active: supplier.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const { error } = await supabase
        .from('lead_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier deleted successfully"
      });
      
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_email: '',
      daily_cap: '',
      weekly_cap: '',
      monthly_cap: '',
      cost_per_lead: '',
      api_endpoint: '',
      api_key: '',
      is_active: true
    });
    setEditingSupplier(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Suppliers</h2>
          <p className="text-muted-foreground">
            Manage your lead suppliers and their delivery caps
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Supplier Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_cap">Daily Cap</Label>
                  <Input
                    id="daily_cap"
                    type="number"
                    value={formData.daily_cap}
                    onChange={(e) => setFormData({...formData, daily_cap: e.target.value})}
                    placeholder="No limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekly_cap">Weekly Cap</Label>
                  <Input
                    id="weekly_cap"
                    type="number"
                    value={formData.weekly_cap}
                    onChange={(e) => setFormData({...formData, weekly_cap: e.target.value})}
                    placeholder="No limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_cap">Monthly Cap</Label>
                  <Input
                    id="monthly_cap"
                    type="number"
                    value={formData.monthly_cap}
                    onChange={(e) => setFormData({...formData, monthly_cap: e.target.value})}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_per_lead">Cost Per Lead ($)</Label>
                  <Input
                    id="cost_per_lead"
                    type="number"
                    step="0.01"
                    value={formData.cost_per_lead}
                    onChange={(e) => setFormData({...formData, cost_per_lead: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_endpoint">API Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    type="url"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({...formData, api_endpoint: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  value={formData.api_key}
                  onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                  placeholder="Optional API key for webhook authentication"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSupplier ? 'Update' : 'Create'} Supplier
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Suppliers</CardTitle>
          <CardDescription>
            Monitor your supplier performance and manage caps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Daily Usage</TableHead>
                <TableHead>Weekly Usage</TableHead>
                <TableHead>Monthly Usage</TableHead>
                <TableHead>Cost/Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    {supplier.name}
                  </TableCell>
                  <TableCell>{supplier.contact_email}</TableCell>
                  <TableCell>
                    {supplier.current_daily_count}
                    {supplier.daily_cap && ` / ${supplier.daily_cap}`}
                  </TableCell>
                  <TableCell>
                    {supplier.current_weekly_count}
                    {supplier.weekly_cap && ` / ${supplier.weekly_cap}`}
                  </TableCell>
                  <TableCell>
                    {supplier.current_monthly_count}
                    {supplier.monthly_cap && ` / ${supplier.monthly_cap}`}
                  </TableCell>
                  <TableCell>
                    {supplier.cost_per_lead ? `$${supplier.cost_per_lead}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.is_active ? "default" : "secondary"}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierManagement;