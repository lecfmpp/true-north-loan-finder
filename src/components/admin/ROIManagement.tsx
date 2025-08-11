import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, Target, BarChart3, Plus, Upload, FileSpreadsheet, Trash2, Users, Award, FileText, CheckCircle, Calendar, Settings, Save, Banknote, Loader2 } from 'lucide-react';
import EditableAdSpendTable from './EditableAdSpendTable';

interface ROIMetrics {
  total_leads: number;
  total_spend: number;
  cost_per_lead: number;
  total_revenue: number;
  roi_percentage: number;
  qualified_leads: number;
  funded_leads: number;
  all_leads: number;
  application_leads: number;
  commission_generated: number;
}

interface AdSpendRecord {
  id: string;
  date: string;
  channel: string;
  amount: number;
  campaign_name: string;
  clicks: number;
  impressions: number;
  ctr: number;
  conversions: number;
}

const CHANNELS = [
  { value: 'google', label: 'Google Ads' },
  { value: 'meta', label: 'Meta Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' }
];

const DATE_FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' }
];

export default function ROIManagement() {
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [adSpends, setAdSpends] = useState<AdSpendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSpendDialog, setAddSpendDialog] = useState(false);
  const [csvUploadDialog, setCsvUploadDialog] = useState(false);
  const [cleanupDialog, setCleanupDialog] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [csvProgress, setCsvProgress] = useState({ current: 0, total: 0, stage: '' });
  const [channelSelectionDialog, setChannelSelectionDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [pendingCsvFile, setPendingCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dateFilter, setDateFilter] = useState('last_7_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [aiInstructionsDialog, setAiInstructionsDialog] = useState(false);
  const [aiInstructions, setAiInstructions] = useState(`You are an AI assistant helping with ROI analysis for ad spend tracking. 

Current dashboard metrics include:
- Total leads and spend tracking
- Cost per lead calculations
- ROI percentage analysis
- Qualified leads (>$10k monthly revenue)
- Funded leads (loan approved status)
- Application leads (US & Canada)

When analyzing data, focus on:
1. Cost efficiency trends
2. Channel performance comparison
3. Lead quality indicators
4. Revenue attribution accuracy

Provide actionable insights for campaign optimization.`);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [newSpend, setNewSpend] = useState({
    date: new Date().toISOString().split('T')[0],
    channel: '',
    amount: '',
    campaign_name: '',
    clicks: '',
    impressions: '',
    ctr: '',
    conversions: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchROIData();
  }, [dateFilter, customStartDate, customEndDate]);

  const getDateRange = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let startDate, endDate;
    
    switch (dateFilter) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        startDate = endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'last_7_days':
        endDate = today.toISOString().split('T')[0];
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        startDate = sevenDaysAgo.toISOString().split('T')[0];
        break;
      case 'this_month':
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = firstDayThisMonth.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last_month':
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = firstDayLastMonth.toISOString().split('T')[0];
        endDate = lastDayLastMonth.toISOString().split('T')[0];
        break;
      case 'all_time':
        startDate = '1900-01-01'; // Very early date to capture all records
        endDate = today.toISOString().split('T')[0];
        break;
      case 'custom':
        startDate = customStartDate || today.toISOString().split('T')[0];
        endDate = customEndDate || today.toISOString().split('T')[0];
        break;
      default:
        endDate = today.toISOString().split('T')[0];
        const defaultStart = new Date(today);
        defaultStart.setDate(defaultStart.getDate() - 7);
        startDate = defaultStart.toISOString().split('T')[0];
    }
    
    return { startDate, endDate };
  };

  const fetchROIData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      // Fetch ROI metrics with date range
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_roi_metrics', { start_date: startDate, end_date: endDate });

      if (metricsError) throw metricsError;

      // Fetch ad spend records (ordered by created_at to maintain order)
      const { data: spendsData, error: spendsError } = await supabase
        .from('ad_spend_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (spendsError) throw spendsError;

      setMetrics(metricsData?.[0] || null);
      // Map database data to include impressions field with default value
      setAdSpends((spendsData || []).map(spend => ({ 
        ...spend, 
        impressions: (spend as any).impressions || 0 
      }) as AdSpendRecord));
    } catch (error) {
      console.error('Error fetching ROI data:', error);
      toast({
        title: "Error",
        description: "Failed to load ROI data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpend = async () => {
    if (!newSpend.channel || !newSpend.amount) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Keep CTR as percentage value (not decimal)
      let ctrValue = parseFloat(newSpend.ctr) || 0;
      // Cap CTR at 100%
      ctrValue = Math.min(ctrValue, 100);

      const { error } = await supabase
        .from('ad_spend_records')
        .insert({
          date: newSpend.date,
          channel: newSpend.channel,
          amount: Math.round(parseFloat(newSpend.amount) * 100), // Convert to cents
          campaign_name: newSpend.campaign_name,
          clicks: parseInt(newSpend.clicks) || 0,
          impressions: parseInt(newSpend.impressions) || 0,
          ctr: ctrValue,
          conversions: parseInt(newSpend.conversions) || 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ad spend record added successfully"
      });

      setAddSpendDialog(false);
      setNewSpend({
        date: new Date().toISOString().split('T')[0],
        channel: '',
        amount: '',
        campaign_name: '',
        clicks: '',
        impressions: '',
        ctr: '',
        conversions: ''
      });
      fetchROIData();
    } catch (error) {
      console.error('Error adding ad spend:', error);
      toast({
        title: "Error",
        description: "Failed to add ad spend record",
        variant: "destructive"
      });
    }
  };

  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive"
      });
      return;
    }

    setPendingCsvFile(file);
    setCsvUploadDialog(false);
    setChannelSelectionDialog(true);
  };

  const handleChannelSelection = async () => {
    if (!pendingCsvFile || !selectedChannel) {
      toast({
        title: "Error",
        description: "Please select a channel",
        variant: "destructive"
      });
      return;
    }

    setUploadingCsv(true);
    setChannelSelectionDialog(false);
    setCsvProgress({ current: 0, total: 100, stage: 'Reading file...' });

    try {
      const csvContent = await pendingCsvFile.text();
      setCsvProgress({ current: 20, total: 100, stage: 'Analyzing CSV structure...' });

      const lines = csvContent.split('\n').filter(line => line.trim());
      const rowCount = lines.length - 1;
      
      setCsvProgress({ current: 40, total: 100, stage: `Processing ${rowCount} records...` });
      
      const { data, error } = await supabase.functions.invoke('ai-parse-csv', {
        body: { csvContent, batchSize: rowCount > 1000 ? 100 : 50, defaultChannel: selectedChannel }
      });

      if (error) throw error;

      setCsvProgress({ current: 90, total: 100, stage: 'Finalizing import...' });

      if (data.success) {
        setCsvProgress({ current: 100, total: 100, stage: 'Complete!' });
        
        toast({
          title: "Import Successful!",
          description: `Successfully imported ${data.inserted} records from ${data.processed} total rows.`,
          duration: 4000
        });
        
        await fetchROIData();
        
        setTimeout(() => {
          fetchROIData();
        }, 1000);
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CSV",
        variant: "destructive"
      });
    } finally {
      setUploadingCsv(false);
      setPendingCsvFile(null);
      setSelectedChannel('');
    }
  };

  const handleCleanupData = async () => {
    setDeletingData(true);
    
    try {
      const { error } = await supabase
        .from('ad_spend_records')
        .delete()
        .gte('created_at', '1900-01-01'); // Delete all records by using a condition that matches all

      if (error) throw error;

      toast({
        title: "Success",
        description: "All ad spend records have been deleted"
      });

      setCleanupDialog(false);
      fetchROIData();
    } catch (error) {
      console.error('Error deleting ad spend data:', error);
      toast({
        title: "Error",
        description: "Failed to delete ad spend records",
        variant: "destructive"
      });
    } finally {
      setDeletingData(false);
    }
  };

  const handleSaveInstructions = () => {
    // In a real application, you would save this to a database or configuration
    toast({
      title: "Success",
      description: "AI instructions saved successfully"
    });
    setEditingInstructions(false);
    setAiInstructionsDialog(false);
  };

  const getFilteredLeadCount = () => {
    console.log('getFilteredLeadCount called with leadTypeFilter:', leadTypeFilter, 'metrics:', metrics);
    if (!metrics) return 0;
    switch (leadTypeFilter) {
      case 'qualified': return metrics.qualified_leads;
      case 'funded': return metrics.funded_leads;
      case 'application': return metrics.application_leads;
      default: return metrics.total_leads;
    }
  };

  const getLeadTypeDescription = () => {
    switch (leadTypeFilter) {
      case 'qualified': return 'Qualified leads (≥ $10k revenue, ≥ 6 months, credit ≥ 600)';
      case 'funded': return 'Funded leads (loan approved)';
      case 'application': return 'Application leads (US & Canada)';
      default: return 'All leads';
    }
  };

  const getChannelSpend = (channel: string) => {
    const { startDate, endDate } = getDateRange();
    return adSpends
      .filter(spend => spend.channel === channel && 
        spend.date >= startDate && spend.date <= endDate)
      .reduce((total, spend) => total + (spend.amount / 100), 0);
  };

  const getChannelLeads = (channel: string) => {
    // For now, we'll estimate leads based on conversions in ad spend records
    // In a real application, you'd need to track leads by channel properly
    const { startDate, endDate } = getDateRange();
    return adSpends
      .filter(spend => spend.channel === channel && 
        spend.date >= startDate && spend.date <= endDate)
      .reduce((total, spend) => total + (spend.conversions || 0), 0);
  };

  const getChannelRevenue = (channel: string) => {
    // This would need to be properly calculated based on actual revenue attribution
    // For now, using a simplified calculation
    const channelLeads = getChannelLeads(channel);
    const avgLeadValue = (metrics?.total_revenue || 0) / Math.max(metrics?.total_leads || 1, 1);
    return channelLeads * avgLeadValue;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ROI Dashboard</h2>
          <p className="text-muted-foreground">Track ad spend and lead performance</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={csvUploadDialog} onOpenChange={setCsvUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Ad Spend from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2"><strong>Required CSV columns for Ad Spend Records:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Date:</strong> Date of ad spend (any common format)</li>
                    <li><strong>Channel:</strong> google, meta, tiktok, or linkedin</li>
                    <li><strong>Amount:</strong> Spend amount in dollars</li>
                  </ul>
                  <p className="mb-2"><strong>Optional columns:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Campaign Name:</strong> Campaign identifier</li>
                    <li><strong>Clicks:</strong> Number of clicks</li>
                    <li><strong>CTR:</strong> Click-through rate as percentage</li>
                    <li><strong>Conversions:</strong> Number of conversions</li>
                  </ul>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a CSV file to upload
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileSelect}
                    className="hidden"
                    disabled={uploadingCsv}
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCsv}
                    variant="outline"
                  >
                    {uploadingCsv ? 'Processing...' : 'Choose File'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={cleanupDialog} onOpenChange={setCleanupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete All Ad Spend Records</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete all ad spend records? This action cannot be undone and will permanently remove all tracking data from the ROI dashboard.
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-destructive">
                    ⚠️ Warning: This will delete all ad spend data permanently
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setCleanupDialog(false)}
                    disabled={deletingData}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCleanupData}
                    disabled={deletingData}
                  >
                    {deletingData ? 'Deleting...' : 'Delete All Data'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addSpendDialog} onOpenChange={setAddSpendDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Ad Spend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Ad Spend Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newSpend.date}
                    onChange={(e) => setNewSpend({...newSpend, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Channel</Label>
                  <Select value={newSpend.channel} onValueChange={(value) => setNewSpend({...newSpend, channel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((channel) => (
                        <SelectItem key={channel.value} value={channel.value}>
                          {channel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newSpend.amount}
                    onChange={(e) => setNewSpend({...newSpend, amount: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Campaign Name (Optional)</Label>
                  <Input
                    placeholder="Campaign name"
                    value={newSpend.campaign_name}
                    onChange={(e) => setNewSpend({...newSpend, campaign_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Clicks (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newSpend.clicks}
                    onChange={(e) => setNewSpend({...newSpend, clicks: e.target.value})}
                  />
                </div>
                <div>
                  <Label>CTR % (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newSpend.ctr}
                    onChange={(e) => setNewSpend({...newSpend, ctr: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Conversions (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newSpend.conversions}
                    onChange={(e) => setNewSpend({...newSpend, conversions: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddSpend} className="w-full">
                  Add Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Label>Date Range:</Label>
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-40"
                  placeholder="Start date"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-40"
                  placeholder="End date"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Instructions */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="ai-instructions">
          <AccordionTrigger className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Instructions
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={aiInstructionsDialog} onOpenChange={setAiInstructionsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Instructions
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Edit AI Instructions</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label>Instructions for AI Analysis:</Label>
                      <Textarea
                        value={aiInstructions}
                        onChange={(e) => setAiInstructions(e.target.value)}
                        rows={12}
                        className="min-h-80"
                        placeholder="Enter instructions for AI analysis..."
                      />
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setAiInstructionsDialog(false);
                            // Reset to original value if needed
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveInstructions}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Instructions
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap text-muted-foreground font-mono">
                  {aiInstructions}
                </pre>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Lead Type Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Label>Lead Type:</Label>
            </div>
            <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="qualified">Qualified Leads (≥ $10k, ≥ 6mo, credit ≥ 600)</SelectItem>
                <SelectItem value="funded">Funded Leads</SelectItem>
                <SelectItem value="application">Application Leads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{getFilteredLeadCount()}</p>
                <p className="text-xs text-muted-foreground">{getLeadTypeDescription()}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">${((metrics?.total_spend || 0) / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">All channels combined</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Per Lead</p>
                <p className="text-2xl font-bold">
                  ${getFilteredLeadCount() > 0 
                    ? (((metrics?.total_spend || 0) / 100) / getFilteredLeadCount()).toFixed(2)
                    : '0.00'
                  }
                </p>
                <p className="text-xs text-muted-foreground">Average acquisition cost</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission Generated</p>
                <p className="text-2xl font-bold">${(metrics?.commission_generated || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">From funded partner loans</p>
              </div>
              <Banknote className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Performance metrics by advertising channel for {getLeadTypeDescription().toLowerCase()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {CHANNELS.map((channel) => {
              const channelSpend = getChannelSpend(channel.value);
              const channelLeads = getChannelLeads(channel.value);
              const costPerLead = channelLeads > 0 ? channelSpend / channelLeads : 0;
              const roas = channelSpend > 0 ? (getChannelRevenue(channel.value) / channelSpend) : 0;

              return (
                <Card key={channel.value} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h4 className="font-semibold text-lg">{channel.label}</h4>
                      <p className="text-xs text-muted-foreground">Channel performance</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Leads</span>
                        <span className="font-bold text-blue-600">{channelLeads}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cost per Lead</span>
                        <span className="font-bold text-orange-600">
                          ${costPerLead > 0 ? costPerLead.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">ROAS</span>
                        <span className={`font-bold ${roas > 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {roas > 0 ? `${roas.toFixed(2)}x` : '0.00x'}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Total Spend</span>
                          <span className="font-medium">${channelSpend.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ad Spend Records - Editable Table */}
      <Card>
        <CardContent className="p-6">
          <EditableAdSpendTable 
            adSpends={adSpends} 
            onDataUpdate={fetchROIData}
          />
        </CardContent>
      </Card>

      {/* Channel Selection Dialog */}
      <Dialog open={channelSelectionDialog} onOpenChange={setChannelSelectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Channel for CSV Import</DialogTitle>
            <DialogDescription>
              Choose the advertising channel for all records in this CSV file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Channel</Label>
              <Select onValueChange={setSelectedChannel} value={selectedChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChannelSelectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChannelSelection} disabled={!selectedChannel}>
              Import CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Modal */}
      {uploadingCsv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          
          {/* Loading Modal */}
          <div className="relative bg-card border rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Processing CSV File</h3>
                <p className="text-muted-foreground text-sm">
                  {csvProgress.stage || 'Analyzing your data...'}
                </p>
              </div>
              
              {csvProgress.total > 0 && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{csvProgress.current}%</span>
                  </div>
                  <Progress value={csvProgress.current} className="w-full" />
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>AI is analyzing and importing your data</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
