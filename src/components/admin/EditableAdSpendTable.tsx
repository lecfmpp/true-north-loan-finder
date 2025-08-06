import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Check, X, Edit, Copy, ChevronUp, ChevronDown, ChevronsUpDown, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

interface EditableAdSpendTableProps {
  adSpends: AdSpendRecord[];
  onDataUpdate: () => void;
}

const CHANNELS = [
  { value: 'google', label: 'Google Ads' },
  { value: 'meta', label: 'Meta Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' }
];

type SortField = 'date' | 'channel' | 'amount' | 'campaign_name' | 'clicks' | 'impressions' | 'ctr' | 'conversions';
type SortDirection = 'asc' | 'desc' | null;

export default function EditableAdSpendTable({ adSpends, onDataUpdate }: EditableAdSpendTableProps) {
  const [editingCell, setEditingCell] = useState<{ recordId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [uniqueCampaigns, setUniqueCampaigns] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkChannelDialog, setBulkChannelDialog] = useState(false);
  const [bulkChannel, setBulkChannel] = useState('');
  const [newRecord, setNewRecord] = useState({
    date: new Date(),
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
    // Extract unique campaign names for the select options
    const campaigns = [...new Set(adSpends.map(spend => spend.campaign_name).filter(Boolean))];
    setUniqueCampaigns(campaigns);
  }, [adSpends]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    if (!sortField || !sortDirection) {
      return adSpends;
    }

    return [...adSpends].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'amount') {
        aValue = a.amount / 100; // Convert from cents
        bValue = b.amount / 100;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  const sortedData = getSortedData();

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );

  const startEdit = (recordId: string, field: string, currentValue: any) => {
    setEditingCell({ recordId, field });
    if (field === 'amount') {
      setEditValue((currentValue / 100).toString());
    } else if (field === 'ctr') {
      setEditValue(currentValue.toString());
    } else {
      setEditValue(currentValue.toString());
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      let finalValue: any = editValue;
      
      if (editingCell.field === 'amount') {
        finalValue = Math.round(parseFloat(editValue) * 100); // Convert to cents
      } else if (editingCell.field === 'ctr') {
        finalValue = Math.min(Math.max(parseFloat(editValue) || 0, 0), 100); // Cap at 100%
      } else if (['clicks', 'impressions', 'conversions'].includes(editingCell.field)) {
        finalValue = parseInt(editValue) || 0;
      }

      const { error } = await supabase
        .from('ad_spend_records')
        .update({ [editingCell.field]: finalValue })
        .eq('id', editingCell.recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record updated successfully"
      });

      setEditingCell(null);
      setEditValue('');
      onDataUpdate();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive"
      });
    }
  };

  const addNewRecord = async () => {
    if (!newRecord.channel || !newRecord.amount) {
      toast({
        title: "Error",
        description: "Please fill in required fields (channel and amount)",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ad_spend_records')
        .insert({
          date: format(newRecord.date, 'yyyy-MM-dd'),
          channel: newRecord.channel,
          amount: Math.round(parseFloat(newRecord.amount) * 100), // Convert to cents
          campaign_name: newRecord.campaign_name,
          clicks: parseInt(newRecord.clicks) || 0,
          impressions: parseInt(newRecord.impressions) || 0,
          ctr: Math.min(Math.max(parseFloat(newRecord.ctr) || 0, 0), 100), // Cap at 100%
          conversions: parseInt(newRecord.conversions) || 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record added successfully"
      });

      setIsAddingNew(false);
      setNewRecord({
        date: new Date(),
        channel: '',
        amount: '',
        campaign_name: '',
        clicks: '',
        impressions: '',
        ctr: '',
        conversions: ''
      });
      onDataUpdate();
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: "Error",
        description: "Failed to add record",
        variant: "destructive"
      });
    }
  };

  const duplicateRecord = (record: AdSpendRecord) => {
    setNewRecord({
      date: new Date(),
      channel: record.channel,
      amount: (record.amount / 100).toString(),
      campaign_name: record.campaign_name,
      clicks: record.clicks.toString(),
      impressions: record.impressions.toString(),
      ctr: record.ctr.toString(),
      conversions: record.conversions.toString()
    });
    setIsAddingNew(true);
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ad_spend_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Record deleted successfully"
      });
      onDataUpdate();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive"
      });
    }
  };

  const handleRowSelection = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(sortedData.map(record => record.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkChannelUpdate = async () => {
    if (!bulkChannel || selectedRows.size === 0) {
      toast({
        title: "Error",
        description: "Please select a channel and at least one row",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ad_spend_records')
        .update({ channel: bulkChannel })
        .in('id', Array.from(selectedRows));

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Updated ${selectedRows.size} records successfully`
      });
      
      setSelectedRows(new Set());
      setBulkChannelDialog(false);
      setBulkChannel('');
      onDataUpdate();
    } catch (error) {
      console.error('Error updating records:', error);
      toast({
        title: "Error",
        description: "Failed to update records",
        variant: "destructive"
      });
    }
  };

  const EditableCell = ({ record, field, value, isMonetary = false }: { 
    record: AdSpendRecord; 
    field: string; 
    value: string;
    isMonetary?: boolean;
  }) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <TableCell>
          <div className="flex items-center gap-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="h-8"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell className="cursor-pointer hover:bg-muted/50" onClick={() => startEdit(record.id, field, field === 'amount' ? record.amount : record[field as keyof AdSpendRecord])}>
        <div className="flex items-center gap-2">
          {isMonetary ? `$${value}` : value}
          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
        </div>
      </TableCell>
    );
  };

  const ChannelCell = ({ record }: { record: AdSpendRecord }) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.field === 'channel';

    if (isEditing) {
      return (
        <TableCell>
          <div className="flex items-center gap-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((channel) => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      );
    }

    const channelLabel = CHANNELS.find(c => c.value === record.channel)?.label || record.channel;
    return (
      <TableCell className="cursor-pointer hover:bg-muted/50" onClick={() => startEdit(record.id, 'channel', record.channel)}>
        <div className="flex items-center gap-2">
          {channelLabel}
          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
        </div>
      </TableCell>
    );
  };

  const CampaignCell = ({ record }: { record: AdSpendRecord }) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.field === 'campaign_name';

    if (isEditing) {
      return (
        <TableCell>
          <div className="flex items-center gap-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <Input
                    placeholder="Enter new campaign name"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-6"
                  />
                </SelectItem>
                {uniqueCampaigns.map((campaign) => (
                  <SelectItem key={campaign} value={campaign}>
                    {campaign}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell className="cursor-pointer hover:bg-muted/50" onClick={() => startEdit(record.id, 'campaign_name', record.campaign_name)}>
        <div className="flex items-center gap-2">
          {record.campaign_name || 'No campaign'}
          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
        </div>
      </TableCell>
    );
  };

  const CTRCell = ({ record }: { record: AdSpendRecord }) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.field === 'ctr';

    if (isEditing) {
      return (
        <TableCell>
          <div className="flex items-center gap-1">
            <Input
              value={editValue}
              onChange={(e) => {
                const value = e.target.value;
                // Allow typing numbers and decimals, but validate on blur
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setEditValue(value);
                }
              }}
              onBlur={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                if (numValue > 100) {
                  setEditValue('100');
                  toast({
                    title: "Warning",
                    description: "CTR cannot exceed 100%",
                    variant: "destructive"
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="h-8"
              autoFocus
              placeholder="0.00"
            />
            <span className="text-sm text-muted-foreground">%</span>
            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell className="cursor-pointer hover:bg-muted/50" onClick={() => startEdit(record.id, 'ctr', record.ctr)}>
        <div className="flex items-center gap-2">
          {record.ctr.toFixed(2)}%
          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
        </div>
      </TableCell>
    );
  };

  const DateCell = ({ record }: { record: AdSpendRecord }) => {
    const isEditing = editingCell?.recordId === record.id && editingCell?.field === 'date';

    if (isEditing) {
      return (
        <TableCell>
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="h-8"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell className="cursor-pointer hover:bg-muted/50" onClick={() => startEdit(record.id, 'date', record.date)}>
        <div className="flex items-center gap-2">
          {new Date(record.date).toLocaleDateString()}
          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
        </div>
      </TableCell>
    );
  };

  // Calculate daily summary for the last 7 days
  const getDailySummary = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentSpends = adSpends.filter(spend => {
      const spendDate = new Date(spend.date);
      return spendDate >= sevenDaysAgo && spendDate <= today;
    });

    const dailyTotals = recentSpends.reduce((acc, spend) => {
      const date = spend.date;
      if (!acc[date]) {
        acc[date] = { amount: 0, clicks: 0, conversions: 0 };
      }
      acc[date].amount += spend.amount / 100;
      acc[date].clicks += spend.clicks;
      acc[date].conversions += spend.conversions;
      return acc;
    }, {} as Record<string, { amount: number; clicks: number; conversions: number }>);

    return Object.entries(dailyTotals)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 7);
  };

  const dailySummary = getDailySummary();

  return (
    <div className="space-y-4">
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedRows.size} rows selected</span>
          <Button
            size="sm"
            onClick={() => setBulkChannelDialog(true)}
            className="ml-auto"
          >
            Change Channel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedRows(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </TableHead>
              <SortableHeader field="date" label="Date" />
              <SortableHeader field="channel" label="Channel" />
              <SortableHeader field="amount" label="Spend" />
              <SortableHeader field="campaign_name" label="Campaign" />
              <SortableHeader field="clicks" label="Clicks" />
              <SortableHeader field="impressions" label="Impressions" />
              <SortableHeader field="ctr" label="CTR" />
              <SortableHeader field="conversions" label="Conversions" />
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((record) => (
              <TableRow key={record.id} className="hover:bg-muted/50">
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(record.id)}
                    onChange={(e) => handleRowSelection(record.id, e.target.checked)}
                    className="rounded"
                  />
                </TableCell>
                <DateCell record={record} />
                <ChannelCell record={record} />
                <EditableCell record={record} field="amount" value={(record.amount / 100).toFixed(2)} isMonetary />
                <CampaignCell record={record} />
                <EditableCell record={record} field="clicks" value={record.clicks.toString()} />
                <EditableCell record={record} field="impressions" value={record.impressions.toString()} />
                <CTRCell record={record} />
                <EditableCell record={record} field="conversions" value={record.conversions.toString()} />
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => duplicateRecord(record)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRecord(record.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {isAddingNew && (
              <TableRow className="bg-muted/30">
                <TableCell>
                  <input type="checkbox" disabled className="rounded opacity-50" />
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newRecord.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newRecord.date}
                        onSelect={(date) => date && setNewRecord({ ...newRecord, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Select value={newRecord.channel} onValueChange={(value) => setNewRecord({ ...newRecord, channel: value })}>
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
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRecord.amount}
                    onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Campaign name"
                    value={newRecord.campaign_name}
                    onChange={(e) => setNewRecord({ ...newRecord, campaign_name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newRecord.clicks}
                    onChange={(e) => setNewRecord({ ...newRecord, clicks: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newRecord.impressions}
                    onChange={(e) => setNewRecord({ ...newRecord, impressions: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newRecord.ctr}
                      onChange={(e) => setNewRecord({ ...newRecord, ctr: e.target.value })}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newRecord.conversions}
                    onChange={(e) => setNewRecord({ ...newRecord, conversions: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={addNewRecord} className="h-8 w-8 p-0">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingNew(false)} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isAddingNew && (
        <Button onClick={() => setIsAddingNew(true)} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add New Record
        </Button>
      )}

      {/* Daily Summary */}
      {dailySummary.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Daily Summary (Last 7 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailySummary.map(([date, data]) => (
              <div key={date} className="border rounded-lg p-4 bg-muted/20">
                <div className="font-medium text-sm mb-2">
                  {new Date(date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spend:</span>
                    <span className="font-medium">${data.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clicks:</span>
                    <span className="font-medium">{data.clicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversions:</span>
                    <span className="font-medium">{data.conversions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Channel Update Dialog */}
      <Dialog open={bulkChannelDialog} onOpenChange={setBulkChannelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Channel for Selected Rows</DialogTitle>
            <DialogDescription>
              Change the channel for {selectedRows.size} selected records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Channel</label>
              <Select onValueChange={setBulkChannel} value={bulkChannel}>
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
            <Button variant="outline" onClick={() => setBulkChannelDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkChannelUpdate} disabled={!bulkChannel}>
              Update {selectedRows.size} Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}