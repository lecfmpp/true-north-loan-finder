import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, Target, BarChart3, Plus, Upload, FileSpreadsheet } from 'lucide-react';

interface ROIMetrics {
  total_leads: number;
  total_spend: number;
  cost_per_lead: number;
  total_revenue: number;
  roi_percentage: number;
}

interface AdSpendRecord {
  id: string;
  date: string;
  channel: string;
  amount: number;
  campaign_name: string;
  notes: string;
}

const CHANNELS = [
  { value: 'google', label: 'Google Ads' },
  { value: 'meta', label: 'Meta Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' }
];

export default function ROIManagement() {
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [adSpends, setAdSpends] = useState<AdSpendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSpendDialog, setAddSpendDialog] = useState(false);
  const [csvUploadDialog, setCsvUploadDialog] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSpend, setNewSpend] = useState({
    date: new Date().toISOString().split('T')[0],
    channel: '',
    amount: '',
    campaign_name: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchROIData();
  }, []);

  const fetchROIData = async () => {
    try {
      setLoading(true);

      // Fetch ROI metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_roi_metrics');

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
          notes: newSpend.notes
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
        notes: ''
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

    setUploadingCsv(true);
    
    try {
      const csvContent = await file.text();
      
      const { data, error } = await supabase.functions.invoke('process-csv-adspend', {
        body: { csvContent }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Successfully imported ${data.inserted} ad spend records`
        });
        setCsvUploadDialog(false);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
                <Button onClick={handleAddSpend} className="w-full">
                  Add Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ROI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{metrics?.total_leads || 0}</p>
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
                <p className="text-2xl font-bold">${(metrics?.cost_per_lead || 0).toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-2xl font-bold">{(metrics?.roi_percentage || 0).toFixed(1)}%</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${(metrics?.roi_percentage || 0) > 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

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
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adSpends.map((spend) => (
                <TableRow key={spend.id}>
                  <TableCell>{new Date(spend.date).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">
                    {CHANNELS.find(c => c.value === spend.channel)?.label || spend.channel}
                  </TableCell>
                  <TableCell>${(spend.amount / 100).toFixed(2)}</TableCell>
                  <TableCell>{spend.campaign_name || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{spend.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}