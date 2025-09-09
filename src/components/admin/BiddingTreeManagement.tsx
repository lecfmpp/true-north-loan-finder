import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Target, DollarSign, Filter, TrendingUp, AlertCircle } from 'lucide-react';

interface BiddingCampaign {
  id: string;
  name: string;
  buyer_id: string;
  buyer_name?: string;
  bid_amount: number;
  priority: number;
  is_active: boolean;
  criteria: {
    min_loan_amount?: number;
    max_loan_amount?: number;
    min_credit_score?: number;
    industries?: string[];
    states?: string[];
    min_monthly_revenue?: number;
    time_in_business?: string[];
  };
  caps: {
    daily_cap?: number;
    weekly_cap?: number;
    monthly_cap?: number;
  };
  performance: {
    leads_won: number;
    total_spent: number;
    conversion_rate: number;
  };
  created_at: string;
  updated_at: string;
}

const BiddingTreeManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<BiddingCampaign[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<BiddingCampaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    buyer_id: '',
    bid_amount: '',
    min_loan_amount: '',
    max_loan_amount: '',
    min_credit_score: '',
    industries: [] as string[],
    states: [] as string[],
    min_monthly_revenue: '',
    time_in_business: [] as string[],
    daily_cap: '',
    weekly_cap: '',
    monthly_cap: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
    fetchBuyers();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Mock data - in real implementation, fetch from database
      const mockCampaigns: BiddingCampaign[] = [
        {
          id: '1',
          name: 'Premium Construction Loans',
          buyer_id: 'buyer-1',
          buyer_name: 'Premium Capital',
          bid_amount: 450,
          priority: 1,
          is_active: true,
          criteria: {
            min_loan_amount: 100000,
            max_loan_amount: 1000000,
            min_credit_score: 700,
            industries: ['Construction'],
            min_monthly_revenue: 50000,
            time_in_business: ['2-5', '+5']
          },
          caps: {
            daily_cap: 5,
            weekly_cap: 25,
            monthly_cap: 100
          },
          performance: {
            leads_won: 23,
            total_spent: 10350,
            conversion_rate: 78.5
          },
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-09T15:30:00Z'
        },
        {
          id: '2',
          name: 'Restaurant Quick Funding',
          buyer_id: 'buyer-2',
          buyer_name: 'Fast Funding LLC',
          bid_amount: 320,
          priority: 2,
          is_active: true,
          criteria: {
            min_loan_amount: 25000,
            max_loan_amount: 300000,
            min_credit_score: 650,
            industries: ['Restaurant'],
            min_monthly_revenue: 20000,
            time_in_business: ['1-2', '2-5', '+5']
          },
          caps: {
            daily_cap: 10,
            weekly_cap: 50,
            monthly_cap: 200
          },
          performance: {
            leads_won: 45,
            total_spent: 14400,
            conversion_rate: 65.2
          },
          created_at: '2024-01-02T09:00:00Z',
          updated_at: '2024-01-09T12:15:00Z'
        },
        {
          id: '3',
          name: 'General Business Loans',
          buyer_id: 'buyer-3',
          buyer_name: 'Universal Lending',
          bid_amount: 180,
          priority: 3,
          is_active: true,
          criteria: {
            min_loan_amount: 10000,
            max_loan_amount: 500000,
            min_credit_score: 600,
            min_monthly_revenue: 10000,
            time_in_business: ['6-12', '1-2', '2-5', '+5']
          },
          caps: {
            daily_cap: 20,
            weekly_cap: 100,
            monthly_cap: 400
          },
          performance: {
            leads_won: 89,
            total_spent: 16020,
            conversion_rate: 52.8
          },
          created_at: '2024-01-03T08:00:00Z',
          updated_at: '2024-01-09T10:45:00Z'
        }
      ];
      
      setCampaigns(mockCampaigns.sort((a, b) => a.priority - b.priority));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bidding campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      // Mock buyers data
      const mockBuyers = [
        { id: 'buyer-1', name: 'Premium Capital', email: 'contact@premiumcapital.com' },
        { id: 'buyer-2', name: 'Fast Funding LLC', email: 'leads@fastfunding.com' },
        { id: 'buyer-3', name: 'Universal Lending', email: 'acquisitions@universallending.com' }
      ];
      setBuyers(mockBuyers);
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const campaignData = {
        name: formData.name,
        buyer_id: formData.buyer_id,
        bid_amount: parseFloat(formData.bid_amount),
        criteria: {
          min_loan_amount: formData.min_loan_amount ? parseInt(formData.min_loan_amount) : undefined,
          max_loan_amount: formData.max_loan_amount ? parseInt(formData.max_loan_amount) : undefined,
          min_credit_score: formData.min_credit_score ? parseInt(formData.min_credit_score) : undefined,
          industries: formData.industries,
          states: formData.states,
          min_monthly_revenue: formData.min_monthly_revenue ? parseInt(formData.min_monthly_revenue) : undefined,
          time_in_business: formData.time_in_business
        },
        caps: {
          daily_cap: formData.daily_cap ? parseInt(formData.daily_cap) : undefined,
          weekly_cap: formData.weekly_cap ? parseInt(formData.weekly_cap) : undefined,
          monthly_cap: formData.monthly_cap ? parseInt(formData.monthly_cap) : undefined
        }
      };

      // In real implementation, save to database
      console.log('Saving campaign:', campaignData);
      
      toast({
        title: editingCampaign ? "Campaign Updated" : "Campaign Created",
        description: `Bidding campaign has been ${editingCampaign ? 'updated' : 'created'} successfully`
      });

      setDialogOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (campaign: BiddingCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      buyer_id: campaign.buyer_id,
      bid_amount: campaign.bid_amount.toString(),
      min_loan_amount: campaign.criteria.min_loan_amount?.toString() || '',
      max_loan_amount: campaign.criteria.max_loan_amount?.toString() || '',
      min_credit_score: campaign.criteria.min_credit_score?.toString() || '',
      industries: campaign.criteria.industries || [],
      states: campaign.criteria.states || [],
      min_monthly_revenue: campaign.criteria.min_monthly_revenue?.toString() || '',
      time_in_business: campaign.criteria.time_in_business || [],
      daily_cap: campaign.caps.daily_cap?.toString() || '',
      weekly_cap: campaign.caps.weekly_cap?.toString() || '',
      monthly_cap: campaign.caps.monthly_cap?.toString() || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      // In real implementation, delete from database
      toast({
        title: "Campaign Deleted",
        description: "Bidding campaign has been removed"
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };

  const movePriority = async (id: string, direction: 'up' | 'down') => {
    // In real implementation, update database priorities
    toast({
      title: "Priority Updated",
      description: `Campaign moved ${direction} in the bidding tree`
    });
    fetchCampaigns();
  };

  const toggleActive = async (id: string, active: boolean) => {
    // In real implementation, update database
    toast({
      title: "Campaign Status Updated",
      description: `Campaign ${active ? 'activated' : 'paused'}`
    });
    fetchCampaigns();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      buyer_id: '',
      bid_amount: '',
      min_loan_amount: '',
      max_loan_amount: '',
      min_credit_score: '',
      industries: [],
      states: [],
      min_monthly_revenue: '',
      time_in_business: [],
      daily_cap: '',
      weekly_cap: '',
      monthly_cap: ''
    });
    setEditingCampaign(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const getStatusBadge = (campaign: BiddingCampaign) => {
    if (!campaign.is_active) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    
    const dailyUsage = (campaign.performance.leads_won / 30) * 100; // Rough calculation
    if (dailyUsage > 90) {
      return <Badge variant="destructive">Near Cap</Badge>;
    }
    if (dailyUsage > 70) {
      return <Badge className="bg-yellow-600">High Usage</Badge>;
    }
    return <Badge className="bg-green-600">Active</Badge>;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ping Tree Management</h2>
          <p className="text-muted-foreground">
            Hierarchical bidding campaigns ordered by bid amount. Higher bids get leads first.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Edit' : 'Create'} Bidding Campaign
              </DialogTitle>
              <DialogDescription>
                Set up bidding criteria and bid amount. Higher bids get priority in the ping tree.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Premium Construction Loans"
                  />
                </div>
                <div>
                  <Label htmlFor="buyer">Buyer</Label>
                  <Select value={formData.buyer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, buyer_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select buyer" />
                    </SelectTrigger>
                    <SelectContent>
                      {buyers.map(buyer => (
                        <SelectItem key={buyer.id} value={buyer.id}>{buyer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bid Amount */}
              <div>
                <Label htmlFor="bid_amount">Bid Amount ($)</Label>
                <Input
                  id="bid_amount"
                  type="number"
                  value={formData.bid_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, bid_amount: e.target.value }))}
                  placeholder="450"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher bids get priority in the ping tree
                </p>
              </div>

              {/* Lead Criteria */}
              <div className="space-y-4">
                <h4 className="font-medium">Lead Criteria</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_loan">Min Loan Amount</Label>
                    <Input
                      id="min_loan"
                      type="number"
                      value={formData.min_loan_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_loan_amount: e.target.value }))}
                      placeholder="25000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_loan">Max Loan Amount</Label>
                    <Input
                      id="max_loan"
                      type="number"
                      value={formData.max_loan_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_loan_amount: e.target.value }))}
                      placeholder="500000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_credit">Min Credit Score</Label>
                    <Input
                      id="min_credit"
                      type="number"
                      value={formData.min_credit_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_credit_score: e.target.value }))}
                      placeholder="650"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_revenue">Min Monthly Revenue</Label>
                    <Input
                      id="min_revenue"
                      type="number"
                      value={formData.min_monthly_revenue}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_monthly_revenue: e.target.value }))}
                      placeholder="10000"
                    />
                  </div>
                </div>
              </div>

              {/* Caps */}
              <div className="space-y-4">
                <h4 className="font-medium">Daily Caps</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="daily_cap">Daily Cap</Label>
                    <Input
                      id="daily_cap"
                      type="number"
                      value={formData.daily_cap}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_cap: e.target.value }))}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekly_cap">Weekly Cap</Label>
                    <Input
                      id="weekly_cap"
                      type="number"
                      value={formData.weekly_cap}
                      onChange={(e) => setFormData(prev => ({ ...prev, weekly_cap: e.target.value }))}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthly_cap">Monthly Cap</Label>
                    <Input
                      id="monthly_cap"
                      type="number"
                      value={formData.monthly_cap}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_cap: e.target.value }))}
                      placeholder="200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingCampaign ? 'Update' : 'Create'} Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Active Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Avg Bid</p>
                <p className="text-2xl font-bold">${Math.round(campaigns.reduce((acc, c) => acc + c.bid_amount, 0) / campaigns.length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Leads Won</p>
                <p className="text-2xl font-bold">{campaigns.reduce((acc, c) => acc + c.performance.leads_won, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold">${campaigns.reduce((acc, c) => acc + c.performance.total_spent, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bidding Tree (Ordered by Priority)</CardTitle>
          <CardDescription>
            Campaigns are sorted by bid amount. Higher bids get leads first in the ping tree.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Bid Amount</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign, index) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{campaign.priority}</Badge>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => movePriority(campaign.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => movePriority(campaign.id, 'down')}
                          disabled={index === campaigns.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Caps: {campaign.caps.daily_cap || '∞'}/day
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{campaign.buyer_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-green-600">${campaign.bid_amount}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {campaign.criteria.min_loan_amount && (
                        <div>Min: ${campaign.criteria.min_loan_amount.toLocaleString()}</div>
                      )}
                      {campaign.criteria.min_credit_score && (
                        <div>Credit: {campaign.criteria.min_credit_score}+</div>
                      )}
                      {campaign.criteria.industries && campaign.criteria.industries.length > 0 && (
                        <div>Industry: {campaign.criteria.industries.join(', ')}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>Won: {campaign.performance.leads_won}</div>
                      <div>Spent: ${campaign.performance.total_spent.toLocaleString()}</div>
                      <div>CVR: {campaign.performance.conversion_rate}%</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(campaign)}
                      <Switch
                        checked={campaign.is_active}
                        onCheckedChange={(checked) => toggleActive(campaign.id, checked)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(campaign)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(campaign.id)}
                        className="text-red-600"
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

export default BiddingTreeManagement;