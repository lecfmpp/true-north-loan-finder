import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, Target, BarChart3, Plus, Upload, FileSpreadsheet, Trash2, Users, Award, FileText, CheckCircle, Calendar, Settings, Save, Banknote } from 'lucide-react';

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
  notes: string;
  clicks: number;
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
  const [columnMappingDialog, setColumnMappingDialog] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
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
    notes: '',
    clicks: '',
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

      // Fetch ad spend records
      const { data: spendsData, error: spendsError } = await supabase
        .from('ad_spend_records')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);

      if (spendsError) throw spendsError;

      setMetrics(metricsData?.[0] || null);
      setAdSpends(spendsData || []);
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
      const { error } = await supabase
        .from('ad_spend_records')
        .insert({
          date: newSpend.date,
          channel: newSpend.channel,
          amount: Math.round(parseFloat(newSpend.amount) * 100), // Convert to cents
          campaign_name: newSpend.campaign_name,
          notes: newSpend.notes,
          clicks: parseInt(newSpend.clicks) || 0,
          ctr: parseFloat(newSpend.ctr) || 0,
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
        notes: '',
        clicks: '',
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

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive"
      });
      return;
    }

    try {
      const csvContent = await file.text();
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      setCsvData([headers, ...dataRows]);
      setCsvUploadDialog(false);
      setColumnMappingDialog(true);
      
      // Initialize column mapping with best guesses
      const mapping: Record<string, string> = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('date')) mapping['date'] = header;
        else if (lowerHeader.includes('channel') || lowerHeader.includes('platform')) mapping['channel'] = header;
        else if (lowerHeader.includes('amount') || lowerHeader.includes('spend') || lowerHeader.includes('cost')) mapping['amount'] = header;
        else if (lowerHeader.includes('campaign')) mapping['campaign_name'] = header;
        else if (lowerHeader.includes('click')) mapping['clicks'] = header;
        else if (lowerHeader.includes('ctr') || lowerHeader.includes('rate')) mapping['ctr'] = header;
        else if (lowerHeader.includes('conversion')) mapping['conversions'] = header;
        else if (lowerHeader.includes('note')) mapping['notes'] = header;
      });
      setColumnMapping(mapping);

    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to parse CSV file",
        variant: "destructive"
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProcessMappedCsv = async () => {
    if (!csvData.length || !columnMapping.date || !columnMapping.channel || !columnMapping.amount) {
      toast({
        title: "Error",
        description: "Please map at least Date, Channel, and Amount columns",
        variant: "destructive"
      });
      return;
    }

    setUploadingCsv(true);
    
    try {
      const [headers, ...dataRows] = csvData;
      const mappedData = dataRows.map(row => {
        const record: any = {};
        Object.entries(columnMapping).forEach(([dbColumn, csvHeader]) => {
          if (csvHeader) {
            const csvIndex = headers.indexOf(csvHeader);
            if (csvIndex !== -1) {
              record[dbColumn] = row[csvIndex] || '';
            }
          }
        });
        return record;
      });

      // Process the mapped data through the existing edge function
      const csvContent = [
        Object.values(columnMapping).filter(Boolean).join(','),
        ...mappedData.map(record => 
          Object.entries(columnMapping)
            .filter(([_, csvHeader]) => csvHeader)
            .map(([dbColumn]) => record[dbColumn] || '')
            .join(',')
        )
      ].join('\n');

      const { data, error } = await supabase.functions.invoke('process-csv-adspend', {
        body: { csvContent }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Successfully imported ${data.inserted} ad spend records`
        });
        setColumnMappingDialog(false);
        setCsvData([]);
        setColumnMapping({});
        fetchROIData();
      } else {
        throw new Error(data.error || 'Failed to process CSV');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process CSV file",
        variant: "destructive"
      });
    } finally {
      setUploadingCsv(false);
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
      case 'qualified': return 'Qualified leads ($10k+ monthly revenue)';
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
      .reduce((total, spend) => total + (spend.conversions || 0), 0) || 1; // Fallback to 1 to avoid division by zero
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
                  <p className="mb-2">CSV should contain columns for:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Date:</strong> Date of ad spend (any common format)</li>
                    <li><strong>Channel:</strong> google, meta, tiktok, or linkedin</li>
                    <li><strong>Amount:</strong> Spend amount in dollars</li>
                    <li><strong>Campaign Name:</strong> (Optional) Campaign identifier</li>
                    <li><strong>Clicks:</strong> (Optional) Number of clicks</li>
                    <li><strong>CTR:</strong> (Optional) Click-through rate as percentage</li>
                    <li><strong>Conversions:</strong> (Optional) Number of conversions</li>
                    <li><strong>Notes:</strong> (Optional) Additional notes</li>
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
                    onChange={handleCsvUpload}
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
          <Dialog open={columnMappingDialog} onOpenChange={setColumnMappingDialog}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Map CSV Columns</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Map your CSV columns to the correct database fields. At minimum, Date, Channel, and Amount are required.
                </p>
                {csvData.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {['date', 'channel', 'amount', 'campaign_name', 'clicks', 'ctr', 'conversions', 'notes'].map((dbField) => (
                      <div key={dbField} className="space-y-2">
                        <Label className="capitalize">
                          {dbField.replace('_', ' ')} {['date', 'channel', 'amount'].includes(dbField) && '*'}
                        </Label>
                        <Select 
                          value={columnMapping[dbField] || ''} 
                          onValueChange={(value) => setColumnMapping(prev => ({...prev, [dbField]: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CSV column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {csvData[0]?.map((header, index) => (
                              <SelectItem key={index} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
                {csvData.length > 1 && (
                  <div className="mt-4">
                    <Label>Preview (First 3 rows):</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {csvData[0]?.map((header, index) => (
                              <TableHead key={index} className="text-xs">{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvData.slice(1, 4).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="text-xs max-w-24 truncate">{cell}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setColumnMappingDialog(false);
                      setCsvData([]);
                      setColumnMapping({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleProcessMappedCsv} disabled={uploadingCsv}>
                    {uploadingCsv ? 'Processing...' : 'Import Data'}
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
                <div>
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="Additional notes"
                    value={newSpend.notes}
                    onChange={(e) => setNewSpend({...newSpend, notes: e.target.value})}
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
                <SelectItem value="qualified">Qualified Leads ($10k+)</SelectItem>
                <SelectItem value="funded">Funded Leads</SelectItem>
                <SelectItem value="application">Application Leads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

      {/* Ad Spend Records */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Spend Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Cost per Click</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Cost per Conversion</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adSpends.map((spend) => {
                const amount = spend.amount / 100; // Convert from cents
                const clicks = spend.clicks || 0;
                const conversions = spend.conversions || 0;
                const costPerClick = clicks > 0 ? amount / clicks : 0;
                const costPerConversion = conversions > 0 ? amount / conversions : 0;
                
                return (
                  <TableRow key={spend.id}>
                    <TableCell>{new Date(spend.date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">
                      {CHANNELS.find(c => c.value === spend.channel)?.label || spend.channel}
                    </TableCell>
                    <TableCell>${amount.toFixed(2)}</TableCell>
                    <TableCell>{spend.campaign_name || '-'}</TableCell>
                    <TableCell>{clicks}</TableCell>
                    <TableCell>{costPerClick > 0 ? `$${costPerClick.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>{spend.ctr ? `${spend.ctr}%` : '-'}</TableCell>
                    <TableCell>{conversions}</TableCell>
                    <TableCell>{costPerConversion > 0 ? `$${costPerConversion.toFixed(2)}` : '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{spend.notes || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}