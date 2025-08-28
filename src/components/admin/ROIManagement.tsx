import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, Target, BarChart3, Plus, Upload, FileSpreadsheet, Trash2, Users, Award, FileText, CheckCircle, Calendar, Banknote, Loader2, Image as ImageIcon } from 'lucide-react';
import EditableAdSpendTable from './EditableAdSpendTable';
import { createWorker } from 'tesseract.js';

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
  const [quizResponses, setQuizResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSpendDialog, setAddSpendDialog] = useState(false);
  const [csvUploadDialog, setCsvUploadDialog] = useState(false);
  const [imageUploadDialog, setImageUploadDialog] = useState(false);
  const [cleanupDialog, setCleanupDialog] = useState(false);
  const [dateRangeCleanupDialog, setDateRangeCleanupDialog] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [cleanupStartDate, setCleanupStartDate] = useState('2025-08-20');
  const [cleanupEndDate, setCleanupEndDate] = useState('2025-08-27');
  const [csvProgress, setCsvProgress] = useState({ current: 0, total: 0, stage: '' });
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0, stage: '' });
  const [channelSelectionDialog, setChannelSelectionDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [pendingCsvFile, setPendingCsvFile] = useState<File | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dateFilter, setDateFilter] = useState('last_7_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
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
  // Backward-compat: removed Lead Type filter; define fallback to avoid stale references
  const leadTypeFilter = 'all';

  useEffect(() => {
    fetchROIData();
  }, [dateFilter, customStartDate, customEndDate, channelFilter]);

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
      let query = supabase
        .from('ad_spend_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      // Apply channel filter if not 'all'
      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const { data: spendsData, error: spendsError } = await query
        .order('date', { ascending: false });

      if (spendsError) throw spendsError;

      // Fetch quiz responses (leads) with date range
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_responses')
        .select('id, created_at, attribution_channel')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (quizError) throw quizError;

      setMetrics(metricsData?.[0] || null);
      setQuizResponses(quizData || []);
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

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || (!file.type.startsWith('image/') && file.type !== 'application/pdf')) {
      toast({
        title: "Error",
        description: "Please select a valid PNG, JPG, or PDF file",
        variant: "destructive"
      });
      return;
    }

    setPendingImageFile(file);
    setImageUploadDialog(false);
    setChannelSelectionDialog(true);
  };

  const processImageWithOCR = async (file: File): Promise<string> => {
    console.log('Starting OCR process for file:', file.name, file.type);
    
    try {
      // Use hosted worker/core files to satisfy CSP (no blob/data URLs)
      console.log('Creating worker with custom paths...');
      const worker = await (createWorker as any)('eng', {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core.wasm.js',
      });
      
      console.log('Worker created successfully, starting recognition...');
      const ret = await worker.recognize(file);
      console.log('OCR completed, text length:', ret.data.text.length);
      console.log('OCR text preview:', ret.data.text.substring(0, 200));
      
      await worker.terminate();
      return ret.data.text;
    } catch (error) {
      console.error('OCR Error details:', error);
      throw error;
    }
  };

  const parseOCRTextToCSV = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Look for tabular data patterns
    const csvLines: string[] = [];
    let foundHeader = false;
    
    for (const line of lines) {
      // Skip obvious non-data lines
      if (line.includes('Campaign performance by Day') || 
          line.includes('Show rows') || 
          line.length < 10) {
        continue;
      }
      
      // Look for lines with multiple data fields separated by spaces/tabs
      const fields = line.trim().split(/\s{2,}|\t/);
      if (fields.length >= 4) {
        if (!foundHeader) {
          // Create a header row
          csvLines.push('Campaign,Status,Date,Cost,Clicks,Impressions,CTR,Conversions');
          foundHeader = true;
        }
        
        // Try to parse the data row
        const campaign = fields[0] || '';
        const status = fields[1] || '';
        const date = fields[2] || '';
        const cost = fields[3] || '0';
        const clicks = fields[4] || '0';
        const impressions = fields[5] || '0';
        const ctr = fields[6] || '0';
        const conversions = fields[7] || '0';
        
        csvLines.push(`"${campaign}","${status}","${date}","${cost}","${clicks}","${impressions}","${ctr}","${conversions}"`);
      }
    }
    
    return csvLines.join('\n');
  };

  const handleImageChannelSelection = async () => {
    console.log('handleImageChannelSelection called with:', { 
      pendingImageFile: pendingImageFile?.name, 
      selectedChannel 
    });
    
    if (!pendingImageFile || !selectedChannel) {
      console.error('Missing required data:', { pendingImageFile: !!pendingImageFile, selectedChannel });
      toast({
        title: "Error",
        description: "Please select a channel",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    setChannelSelectionDialog(false);
    setImageProgress({ current: 0, total: 100, stage: 'Reading image...' });

    try {
      setImageProgress({ current: 20, total: 100, stage: 'Extracting text with OCR...' });
      
      console.log('Starting OCR process...');
      const ocrText = await processImageWithOCR(pendingImageFile);
      console.log('OCR completed, parsing data...');
      
      setImageProgress({ current: 60, total: 100, stage: 'Parsing tabular data...' });
      
      const csvContent = parseOCRTextToCSV(ocrText);
      console.log('CSV parsing completed, lines:', csvContent.split('\n').length);
      
      if (!csvContent || csvContent.split('\n').length < 2) {
        throw new Error('No tabular data found in image. Please ensure the image contains a clear data table.');
      }
      
      setImageProgress({ current: 80, total: 100, stage: 'Processing data...' });
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      const rowCount = lines.length - 1;
      
      console.log('Calling AI parse function with', rowCount, 'rows');
      const { data, error } = await supabase.functions.invoke('ai-parse-csv', {
        body: { csvContent, batchSize: rowCount > 1000 ? 100 : 50, defaultChannel: selectedChannel }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      setImageProgress({ current: 90, total: 100, stage: 'Finalizing import...' });

      if (data.success) {
        setImageProgress({ current: 100, total: 100, stage: 'Complete!' });
        
        toast({
          title: "Import Successful!",
          description: `Successfully imported ${data.inserted} records from ${data.processed} total rows extracted from image.`,
          duration: 4000
        });
        
        await fetchROIData();
        
        setTimeout(() => {
          fetchROIData();
        }, 1000);
      } else {
        console.error('Import failed:', data);
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing image:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import image data",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      setPendingImageFile(null);
      setSelectedChannel('');
    }
  };

  const handleChannelSelection = async () => {
    if (pendingCsvFile) {
      return handleCsvChannelSelection();
    } else if (pendingImageFile) {
      return handleImageChannelSelection();
    }
  };

  const handleCsvChannelSelection = async () => {
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

  const handleDateRangeCleanup = async () => {
    if (!cleanupStartDate || !cleanupEndDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }

    // Ensure start <= end
    if (cleanupStartDate > cleanupEndDate) {
      toast({
        title: "Invalid range",
        description: "Start date must be before or equal to end date",
        variant: "destructive"
      });
      return;
    }

    setDeletingData(true);
    
    try {
      // Build inclusive list of date strings (yyyy-MM-dd) in the selected range
      const start = new Date(`${cleanupStartDate}T00:00:00`);
      const end = new Date(`${cleanupEndDate}T00:00:00`);
      const dates: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().slice(0, 10));
      }

      // Also include +1 day for each date to account for prior CSV timezone shift
      const shifted = dates.map(ds => {
        const d = new Date(`${ds}T00:00:00`);
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
      });

      const targets = Array.from(new Set([...dates, ...shifted]));

      const { error, count } = await supabase
        .from('ad_spend_records')
        .delete({ count: 'exact' })
        .in('date', targets);

      if (error) throw error;

      const rangeLabel = cleanupStartDate === cleanupEndDate
        ? cleanupStartDate
        : `${cleanupStartDate} to ${cleanupEndDate}`;

      if (!count || count === 0) {
        toast({
          title: "No records found",
          description: `No ad spend records matched ${rangeLabel}. If these are visible as that local date, they may be stored one day ahead due to timezone; try selecting the adjacent day.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Deleted",
          description: `Removed ${count} ad spend record(s) for ${rangeLabel}`
        });
      }

      setDateRangeCleanupDialog(false);
      await fetchROIData();
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

  const getFilteredMetrics = () => {
    if (!metrics) return {
      totalLeads: 0,
      totalSpend: 0,
      costPerLead: 0,
      costPerQualifiedLead: 0,
      totalClicks: 0,
      totalConversions: 0,
      avgCtr: 0,
      costPerClick: 0
    };

    let filteredSpends = adSpends;
    if (channelFilter !== 'all') {
      filteredSpends = adSpends.filter(spend => spend.channel === channelFilter);
    }

    const totalSpend = filteredSpends.reduce((sum, spend) => sum + (spend.amount / 100), 0);
    const totalClicks = filteredSpends.reduce((sum, spend) => sum + (spend.clicks || 0), 0);
    const totalConversions = filteredSpends.reduce((sum, spend) => sum + (spend.conversions || 0), 0);
    const totalImpressions = filteredSpends.reduce((sum, spend) => sum + (spend.impressions || 0), 0);
    
    const avgCtr = filteredSpends.length > 0 
      ? filteredSpends.reduce((sum, spend) => sum + (spend.ctr || 0), 0) / filteredSpends.length 
      : 0;
    const costPerClick = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const costPerLead = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const costPerQualifiedLead = metrics.qualified_leads > 0 ? totalSpend / metrics.qualified_leads : 0;

    return {
      totalLeads: totalConversions, // Show total conversions from ad spend records
      totalSpend,
      costPerLead,
      costPerQualifiedLead,
      totalClicks,
      totalConversions,
      avgCtr,
      costPerClick
    };
  };

  const getChannelSpend = (channel: string) => {
    const { startDate, endDate } = getDateRange();
    return adSpends
      .filter(spend => spend.channel === channel && 
        spend.date >= startDate && spend.date <= endDate)
      .reduce((total, spend) => total + (spend.amount / 100), 0);
  };

  const getChannelLeads = (channel: string) => {
    // Count total conversions from ad spend records for this channel
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
          <h2 className="text-2xl font-bold">Ads Performance</h2>
          <p className="text-muted-foreground">Track advertising performance and metrics</p>
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
          <Dialog open={imageUploadDialog} onOpenChange={setImageUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ImageIcon className="h-4 w-4 mr-2" />
                Import Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Ad Spend from Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2"><strong>Supported formats:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mb-4">
                    <li><strong>PNG:</strong> Campaign performance tables</li>
                    <li><strong>JPG/JPEG:</strong> Screenshots of ad dashboards</li>
                    <li><strong>PDF:</strong> Campaign reports with tabular data</li>
                  </ul>
                  <p className="mb-2"><strong>Best results with:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Clear, high-resolution images</li>
                    <li>Tables with distinct rows and columns</li>
                    <li>Good contrast between text and background</li>
                    <li>Horizontal text (not rotated)</li>
                  </ul>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Select an image or PDF file with campaign data
                  </p>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleImageFileSelect}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <Button 
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    variant="outline"
                  >
                    {uploadingImage ? 'Processing...' : 'Choose File'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={cleanupDialog} onOpenChange={setCleanupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="h-4 w-4 mr-2" />
                Clean All Data
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
          <Dialog open={dateRangeCleanupDialog} onOpenChange={setDateRangeCleanupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                <Calendar className="h-4 w-4 mr-2" />
                Clean Date Range
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Ad Spend Records by Date Range</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Delete ad spend records within a specific date range. This action cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cleanup-start-date">Start Date</Label>
                    <Input
                      id="cleanup-start-date"
                      type="date"
                      value={cleanupStartDate}
                      onChange={(e) => setCleanupStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cleanup-end-date">End Date</Label>
                    <Input
                      id="cleanup-end-date"
                      type="date"
                      value={cleanupEndDate}
                      onChange={(e) => setCleanupEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-700">
                    📅 This will delete records from {cleanupStartDate} to {cleanupEndDate}
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setDateRangeCleanupDialog(false)}
                    disabled={deletingData}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDateRangeCleanup}
                    disabled={deletingData}
                  >
                    {deletingData ? 'Deleting...' : 'Delete Date Range'}
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Channel Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <Label>Channel:</Label>
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{getFilteredMetrics().totalLeads}</p>
                <p className="text-xs text-muted-foreground">All qualified leads</p>
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
                <p className="text-2xl font-bold">${getFilteredMetrics().totalSpend.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{channelFilter === 'all' ? 'All channels' : CHANNELS.find(c => c.value === channelFilter)?.label}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost per Lead</p>
                <p className="text-2xl font-bold">${getFilteredMetrics().costPerLead.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground">Cost per Qualified Lead</p>
                <p className="text-2xl font-bold">${getFilteredMetrics().costPerQualifiedLead.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Qualified lead cost</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clicks</p>
                <p className="text-2xl font-bold">{getFilteredMetrics().totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total ad clicks</p>
              </div>
              <Target className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CTR</p>
                <p className="text-2xl font-bold">{getFilteredMetrics().avgCtr.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">Click-through rate</p>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{getFilteredMetrics().totalConversions}</p>
                <p className="text-xs text-muted-foreground">Total conversions</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost per Click</p>
                <p className="text-2xl font-bold">${getFilteredMetrics().costPerClick.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Average CPC</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Performance metrics by advertising channel
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

      {/* Image Processing Loading Modal */}
      {uploadingImage && (
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
                <h3 className="text-lg font-semibold">Processing Image</h3>
                <p className="text-muted-foreground text-sm">
                  {imageProgress.stage || 'Reading your image...'}
                </p>
              </div>
              
              {imageProgress.total > 0 && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{imageProgress.current}%</span>
                  </div>
                  <Progress value={imageProgress.current} className="w-full" />
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>Using OCR to extract tabular data</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
