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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Target, DollarSign, TrendingUp } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  quiz_form_id: string;
  description?: string;
  is_active: boolean;
}

interface Partner {
  id: string;
  name: string;
  company_name?: string;
  email: string;
  is_active: boolean;
}

interface BiddingCampaign {
  id: string;
  campaign_id: string;
  campaign_name: string;
  partner_id: string;
  partner_name: string;
  partner_company: string;
  bid_amount: number; // in cents
  priority: number;
  is_active: boolean;
  lead_criteria: {
    min_loan_amount?: number;
    max_loan_amount?: number;
    min_credit_score?: number;
    min_monthly_revenue?: number;
    min_time_in_business?: string;
  };
  caps: {
    daily_cap?: number;
    weekly_cap?: number;
    monthly_cap?: number;
  };
  performance: {
    leads_won: number;
    total_spent: number;
    current_daily_count: number;
    current_weekly_count: number;
    current_monthly_count: number;
  };
  created_at: string;
  updated_at: string;
}

const BiddingTreeManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<BiddingCampaign[]>([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [baseCostPerLead, setBaseCostPerLead] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<BiddingCampaign | null>(null);
  const [formData, setFormData] = useState({
    campaign_id: '',
    partner_id: '',
    bid_amount: '',
    min_loan_amount: '',
    max_loan_amount: '',
    min_credit_score: '',
    min_monthly_revenue: '',
    min_time_in_business: '',
    daily_cap: '',
    weekly_cap: '',
    monthly_cap: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBiddingCampaigns(),
        fetchCampaigns(),
        fetchPartners(),
        fetchBaseCost()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBiddingCampaigns = async () => {
    const { data, error } = await supabase
      .from('bidding_campaigns')
      .select(`
        *,
        campaigns!inner(name, quiz_form_id),
        partners!inner(name, company_name, email)
      `)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching bidding campaigns:', error);
      return;
    }

    const formattedCampaigns: BiddingCampaign[] = data?.map(item => ({
      id: item.id,
      campaign_id: item.campaign_id,
      campaign_name: item.campaigns.name,
      partner_id: item.partner_id,
      partner_name: item.partners.name,
      partner_company: item.partners.company_name || item.partners.name,
      bid_amount: item.bid_amount,
      priority: item.priority,
      is_active: item.is_active,
      lead_criteria: (item.lead_criteria as any) || {},
      caps: {
        daily_cap: item.daily_cap,
        weekly_cap: item.weekly_cap,
        monthly_cap: item.monthly_cap
      },
      performance: {
        leads_won: item.leads_won,
        total_spent: item.total_spent,
        current_daily_count: item.current_daily_count,
        current_weekly_count: item.current_weekly_count,
        current_monthly_count: item.current_monthly_count
      },
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];

    setCampaigns(formattedCampaigns);
  };

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching campaigns:', error);
      return;
    }

    setAvailableCampaigns(data || []);
  };

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching partners:', error);
      return;
    }

    setPartners(data || []);
  };

  const fetchBaseCost = async () => {
    const { data, error } = await supabase
      .from('lead_pricing')
      .select('price_per_lead')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching base cost:', error);
      setBaseCostPerLead(5000); // Default fallback: $50
      return;
    }

    setBaseCostPerLead(data.price_per_lead);
  };

  const getMinimumBidAmount = () => {
    return Math.ceil(baseCostPerLead * 1.3); // 30% margin
  };

  const handleSubmit = async () => {
    try {
      const bidAmountCents = Math.round(parseFloat(formData.bid_amount) * 100);
      const minBidCents = getMinimumBidAmount();

      if (bidAmountCents < minBidCents) {
        toast({
          title: "Invalid Bid Amount",
          description: `Minimum bid amount is $${(minBidCents / 100).toFixed(2)} (30% margin over cost per lead)`,
          variant: "destructive"
        });
        return;
      }

      const leadCriteria = {
        min_loan_amount: formData.min_loan_amount ? parseInt(formData.min_loan_amount) : undefined,
        max_loan_amount: formData.max_loan_amount ? parseInt(formData.max_loan_amount) : undefined,
        min_credit_score: formData.min_credit_score ? parseInt(formData.min_credit_score) : undefined,
        min_monthly_revenue: formData.min_monthly_revenue ? parseInt(formData.min_monthly_revenue) : undefined,
        min_time_in_business: formData.min_time_in_business || undefined
      };

      const campaignData = {
        campaign_id: formData.campaign_id,
        partner_id: formData.partner_id,
        bid_amount: bidAmountCents,
        lead_criteria: leadCriteria,
        daily_cap: formData.daily_cap ? parseInt(formData.daily_cap) : null,
        weekly_cap: formData.weekly_cap ? parseInt(formData.weekly_cap) : null,
        monthly_cap: formData.monthly_cap ? parseInt(formData.monthly_cap) : null
      };

      let result;
      if (editingCampaign) {
        result = await supabase
          .from('bidding_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);
      } else {
        // Get next priority number
        const nextPriority = campaigns.length > 0 ? Math.max(...campaigns.map(c => c.priority)) + 1 : 1;
        result = await supabase
          .from('bidding_campaigns')
          .insert({ ...campaignData, priority: nextPriority });
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: editingCampaign ? "Campaign Updated" : "Campaign Created",
        description: `Bidding campaign has been ${editingCampaign ? 'updated' : 'created'} successfully`
      });

      setDialogOpen(false);
      resetForm();
      fetchBiddingCampaigns();
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
      campaign_id: campaign.campaign_id,
      partner_id: campaign.partner_id,
      bid_amount: (campaign.bid_amount / 100).toFixed(2),
      min_loan_amount: campaign.lead_criteria.min_loan_amount?.toString() || '',
      max_loan_amount: campaign.lead_criteria.max_loan_amount?.toString() || '',
      min_credit_score: campaign.lead_criteria.min_credit_score?.toString() || '',
      min_monthly_revenue: campaign.lead_criteria.min_monthly_revenue?.toString() || '',
      min_time_in_business: campaign.lead_criteria.min_time_in_business || '',
      daily_cap: campaign.caps.daily_cap?.toString() || '',
      weekly_cap: campaign.caps.weekly_cap?.toString() || '',
      monthly_cap: campaign.caps.monthly_cap?.toString() || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      const { error } = await supabase
        .from('bidding_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Campaign Deleted",
        description: "Bidding campaign has been removed"
      });
      fetchBiddingCampaigns();
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
    try {
      const currentCampaign = campaigns.find(c => c.id === id);
      if (!currentCampaign) return;

      const currentIndex = campaigns.findIndex(c => c.id === id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= campaigns.length) return;

      const targetCampaign = campaigns[targetIndex];
      
      // Swap priorities
      await supabase
        .from('bidding_campaigns')
        .update({ priority: targetCampaign.priority })
        .eq('id', currentCampaign.id);

      await supabase
        .from('bidding_campaigns')
        .update({ priority: currentCampaign.priority })
        .eq('id', targetCampaign.id);

      toast({
        title: "Priority Updated",
        description: `Campaign moved ${direction} in the bidding tree`
      });
      fetchBiddingCampaigns();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('bidding_campaigns')
        .update({ is_active: active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Campaign Status Updated",
        description: `Campaign ${active ? 'activated' : 'paused'}`
      });
      fetchBiddingCampaigns();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      campaign_id: '',
      partner_id: '',
      bid_amount: '',
      min_loan_amount: '',
      max_loan_amount: '',
      min_credit_score: '',
      min_monthly_revenue: '',
      min_time_in_business: '',
      daily_cap: '',
      weekly_cap: '',
      monthly_cap: ''
    });
    setEditingCampaign(null);
  };

  const getStatusBadge = (campaign: BiddingCampaign) => {
    if (!campaign.is_active) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    
    // Check if approaching daily cap
    if (campaign.caps.daily_cap) {
      const dailyUsage = (campaign.performance.current_daily_count / campaign.caps.daily_cap) * 100;
      if (dailyUsage >= 90) {
        return <Badge variant="destructive">Near Cap</Badge>;
      }
      if (dailyUsage >= 70) {
        return <Badge className="bg-yellow-600">High Usage</Badge>;
      }
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
            Hierarchical bidding campaigns ordered by priority. Higher bids get leads first.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Minimum bid: ${(getMinimumBidAmount() / 100).toFixed(2)} (30% margin over ${(baseCostPerLead / 100).toFixed(2)} cost per lead)
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
                Minimum bid amount: ${(getMinimumBidAmount() / 100).toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign">Campaign</Label>
                  <Select value={formData.campaign_id} onValueChange={(value) => setFormData(prev => ({ ...prev, campaign_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCampaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name} ({campaign.quiz_form_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="partner">Partner</Label>
                  <Select value={formData.partner_id} onValueChange={(value) => setFormData(prev => ({ ...prev, partner_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select partner" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map(partner => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.company_name || partner.name} - {partner.email}
                        </SelectItem>
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
                  step="0.01"
                  min={(getMinimumBidAmount() / 100).toFixed(2)}
                  value={formData.bid_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, bid_amount: e.target.value }))}
                  placeholder={(getMinimumBidAmount() / 100).toFixed(2)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher bids get priority in the ping tree. Must be at least ${(getMinimumBidAmount() / 100).toFixed(2)}
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

                <div>
                  <Label htmlFor="time_in_business">Min Time in Business</Label>
                  <Select value={formData.min_time_in_business} onValueChange={(value) => setFormData(prev => ({ ...prev, min_time_in_business: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum time in business" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6-12">6-12 months</SelectItem>
                      <SelectItem value="1-2">1-2 years</SelectItem>
                      <SelectItem value="2-5">2-5 years</SelectItem>
                      <SelectItem value="+5">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Caps */}
              <div className="space-y-4">
                <h4 className="font-medium">Lead Caps</h4>
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
                <p className="text-2xl font-bold">
                  ${campaigns.length > 0 ? Math.round(campaigns.reduce((acc, c) => acc + c.bid_amount, 0) / campaigns.length / 100) : 0}
                </p>
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
            Campaigns are sorted by priority. Higher priority campaigns get leads first in the ping tree.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Partner</TableHead>
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
                      <div className="font-medium">{campaign.campaign_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Caps: {campaign.caps.daily_cap || '∞'}/day
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.partner_company}</div>
                      <div className="text-sm text-muted-foreground">{campaign.partner_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-green-600">${(campaign.bid_amount / 100).toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {campaign.lead_criteria.min_loan_amount && (
                        <div>Min: ${campaign.lead_criteria.min_loan_amount.toLocaleString()}</div>
                      )}
                      {campaign.lead_criteria.min_credit_score && (
                        <div>Credit: {campaign.lead_criteria.min_credit_score}+</div>
                      )}
                      {campaign.lead_criteria.min_monthly_revenue && (
                        <div>Revenue: ${campaign.lead_criteria.min_monthly_revenue.toLocaleString()}+</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>Won: {campaign.performance.leads_won}</div>
                      <div>Spent: ${campaign.performance.total_spent.toLocaleString()}</div>
                      <div>Daily: {campaign.performance.current_daily_count}/{campaign.caps.daily_cap || '∞'}</div>
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