import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Clock, DollarSign, Calendar } from 'lucide-react';

interface LeadBuyer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  buyer_type: 'exclusive' | 'shared';
  is_active: boolean;
  priority_score: number;
  webhook_url: string | null;
  api_key: string | null;
  created_at: string;
}

interface BuyerSchedule {
  id: string;
  buyer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  is_active: boolean;
}

interface BuyerPaymentSettings {
  id: string;
  buyer_id: string;
  payment_per_lead: number;
  requires_prepayment: boolean;
  auto_charge: boolean;
  hold_duration_hours: number;
  stripe_customer_id: string | null;
}

const BuyerManagement = () => {
  const [buyers, setBuyers] = useState<LeadBuyer[]>([]);
  const [schedules, setSchedules] = useState<BuyerSchedule[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<BuyerPaymentSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<LeadBuyer | null>(null);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    buyer_type: 'shared' as 'exclusive' | 'shared',
    priority_score: '100',
    webhook_url: '',
    api_key: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBuyers();
    fetchSchedules();
    fetchPaymentSettings();
  }, []);

  const fetchBuyers = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuyers(data?.map(partner => ({
        ...partner,
        buyer_type: 'shared' as 'exclusive' | 'shared',
        priority_score: 100,
        webhook_url: null,
        api_key: null
      })) || []);
      if (data && data.length > 0) {
        setSelectedBuyerId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
      toast({
        title: "Error",
        description: "Failed to load buyers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('buyer_schedules')
        .select('*')
        .order('day_of_week');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('buyer_payment_settings')
        .select('*');

      if (error) throw error;
      setPaymentSettings(data || []);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const buyerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company_name: formData.company_name || null,
        application_type: 'buyer',
        is_active: formData.is_active
      };

      if (editingBuyer) {
        const { error } = await supabase
          .from('partners')
          .update(buyerData)
          .eq('id', editingBuyer.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Buyer updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('partners')
          .insert([buyerData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Buyer created successfully"
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchBuyers();
    } catch (error) {
      console.error('Error saving buyer:', error);
      toast({
        title: "Error",
        description: "Failed to save buyer",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (buyer: LeadBuyer) => {
    setEditingBuyer(buyer);
    setFormData({
      name: buyer.name,
      email: buyer.email,
      phone: buyer.phone || '',
      company_name: buyer.company_name || '',
      buyer_type: buyer.buyer_type,
      priority_score: buyer.priority_score.toString(),
      webhook_url: buyer.webhook_url || '',
      api_key: buyer.api_key || '',
      is_active: buyer.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this buyer?')) return;

    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Buyer deleted successfully"
      });
      
      fetchBuyers();
    } catch (error) {
      console.error('Error deleting buyer:', error);
      toast({
        title: "Error",
        description: "Failed to delete buyer",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company_name: '',
      buyer_type: 'shared',
      priority_score: '100',
      webhook_url: '',
      api_key: '',
      is_active: true
    });
    setEditingBuyer(null);
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const getSelectedBuyerSchedules = () => {
    return schedules.filter(s => s.buyer_id === selectedBuyerId);
  };

  const getSelectedBuyerPaymentSettings = () => {
    return paymentSettings.find(ps => ps.buyer_id === selectedBuyerId);
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
          <h2 className="text-2xl font-bold">Lead Buyers</h2>
          <p className="text-muted-foreground">
            Manage your lead buyers, schedules, and payment settings
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Buyer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingBuyer ? 'Edit Buyer' : 'Add New Buyer'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Buyer Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyer_type">Buyer Type</Label>
                  <Select value={formData.buyer_type} onValueChange={(value: 'exclusive' | 'shared') => setFormData({...formData, buyer_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive">Exclusive</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority_score">Priority Score</Label>
                  <Input
                    id="priority_score"
                    type="number"
                    value={formData.priority_score}
                    onChange={(e) => setFormData({...formData, priority_score: e.target.value})}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    value={formData.api_key}
                    onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                    placeholder="Optional API key"
                  />
                </div>
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBuyer ? 'Update' : 'Create'} Buyer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="buyers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="buyers">All Buyers</TabsTrigger>
          <TabsTrigger value="schedules">Delivery Schedules</TabsTrigger>
          <TabsTrigger value="payments">Payment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="buyers">
          <Card>
            <CardHeader>
              <CardTitle>Active Buyers</CardTitle>
              <CardDescription>
                Monitor buyer performance and manage configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyers.map((buyer) => (
                    <TableRow key={buyer.id}>
                      <TableCell className="font-medium">
                        {buyer.name}
                      </TableCell>
                      <TableCell>{buyer.company_name || 'N/A'}</TableCell>
                      <TableCell>{buyer.email}</TableCell>
                      <TableCell>
                        <Badge variant={buyer.buyer_type === 'exclusive' ? "default" : "secondary"}>
                          {buyer.buyer_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{buyer.priority_score}</TableCell>
                      <TableCell>
                        <Badge variant={buyer.is_active ? "default" : "secondary"}>
                          {buyer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(buyer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(buyer.id)}
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
        </TabsContent>

        <TabsContent value="schedules">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label>Select Buyer:</Label>
              <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Choose a buyer" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Delivery Schedule
                </CardTitle>
                <CardDescription>
                  Configure when leads should be delivered to this buyer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getSelectedBuyerSchedules().length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Timezone</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSelectedBuyerSchedules().map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{getDayName(schedule.day_of_week)}</TableCell>
                          <TableCell>{schedule.start_time}</TableCell>
                          <TableCell>{schedule.end_time}</TableCell>
                          <TableCell>{schedule.timezone}</TableCell>
                          <TableCell>
                            <Badge variant={schedule.is_active ? "default" : "secondary"}>
                              {schedule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No schedule configured for this buyer</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label>Select Buyer:</Label>
              <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Choose a buyer" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Configuration
                </CardTitle>
                <CardDescription>
                  Configure payment settings for this buyer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const settings = getSelectedBuyerPaymentSettings();
                  return settings ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Payment Per Lead</Label>
                        <p className="text-2xl font-bold">${settings.payment_per_lead}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Hold Duration</Label>
                        <p className="text-2xl font-bold">{settings.hold_duration_hours}h</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Prepayment Required</Label>
                        <Badge variant={settings.requires_prepayment ? "default" : "secondary"}>
                          {settings.requires_prepayment ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Auto Charge</Label>
                        <Badge variant={settings.auto_charge ? "default" : "secondary"}>
                          {settings.auto_charge ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No payment settings configured for this buyer</p>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BuyerManagement;