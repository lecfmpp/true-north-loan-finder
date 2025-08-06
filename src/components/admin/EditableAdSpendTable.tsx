import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Check, X, Edit, Copy, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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

type SortField = 'date' | 'channel' | 'amount' | 'campaign_name' | 'clicks' | 'ctr' | 'conversions';
type SortDirection = 'asc' | 'desc' | null;

export default function EditableAdSpendTable({ adSpends, onDataUpdate }: EditableAdSpendTableProps) {
  const [editingCell, setEditingCell] = useState<{ recordId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [uniqueCampaigns, setUniqueCampaigns] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [newRecord, setNewRecord] = useState({
    date: new Date(),
    channel: '',
    amount: '',
    campaign_name: '',
    clicks: '',
    ctr: '',
    conversions: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Extract unique campaign names for dropdown
    const campaigns = [...new Set(adSpends.map(spend => spend.campaign_name).filter(Boolean))];
    setUniqueCampaigns(campaigns);
  }, [adSpends]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    if (!sortField || !sortDirection) return adSpends;

    return [...adSpends].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle special cases
      if (sortField === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'amount') {
        aValue = a.amount || 0;
        bValue = b.amount || 0;
      } else if (sortField === 'clicks' || sortField === 'conversions') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (sortField === 'ctr') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else {
        // String fields
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    const direction = isActive ? sortDirection : null;

    return (
      <TableHead 
        className="cursor-pointer select-none hover:bg-muted/50"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2">
          {children}
          <div className="flex flex-col">
            {direction === null && <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />}
            {direction === 'asc' && <ChevronUp className="h-3 w-3 text-primary" />}
            {direction === 'desc' && <ChevronDown className="h-3 w-3 text-primary" />}
          </div>
        </div>
      </TableHead>
    );
  };

  const startEdit = (recordId: string, field: string, currentValue: any) => {
    setEditingCell({ recordId, field });
    setEditValue(String(currentValue || ''));
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      const { recordId, field } = editingCell;
      let value: any = editValue;

      // Convert value based on field type
      if (field === 'amount') {
        value = Math.round(parseFloat(editValue) * 100); // Convert to cents
      } else if (field === 'clicks' || field === 'conversions') {
        value = parseInt(editValue) || 0;
      } else if (field === 'ctr') {
        value = parseFloat(editValue) || 0;
        // Convert CTR from percentage to decimal if needed (e.g., 5.5% -> 0.055)
        if (value > 1) {
          value = value / 100;
        }
        // Cap at 9.9999 to prevent overflow
        value = Math.min(value, 9.9999);
      }

      const { error } = await supabase
        .from('ad_spend_records')
        .update({ [field]: value })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record updated successfully"
      });

      cancelEdit();
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
        description: "Please fill in required fields (Channel and Amount)",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert CTR from percentage to decimal (e.g., 5.5% -> 0.055)
      let ctrValue = parseFloat(newRecord.ctr) || 0;
      if (ctrValue > 1) {
        ctrValue = ctrValue / 100; // Convert percentage to decimal
      }
      // Cap at 9.9999 to prevent overflow
      ctrValue = Math.min(ctrValue, 9.9999);

      const { error } = await supabase
        .from('ad_spend_records')
        .insert({
          date: format(newRecord.date, 'yyyy-MM-dd'),
          channel: newRecord.channel,
          amount: Math.round(parseFloat(newRecord.amount) * 100), // Convert to cents
          campaign_name: newRecord.campaign_name,
          clicks: parseInt(newRecord.clicks) || 0,
          ctr: ctrValue,
          conversions: parseInt(newRecord.conversions) || 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New record added successfully"
      });

      setIsAddingNew(false);
      setNewRecord({
        date: new Date(),
        channel: '',
        amount: '',
        campaign_name: '',
        clicks: '',
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
    setIsAddingNew(true);
    setNewRecord({
      date: new Date(),
      channel: record.channel,
      amount: (record.amount / 100).toString(), // Convert from cents to dollars
      campaign_name: record.campaign_name,
      clicks: record.clicks.toString(),
      ctr: record.ctr ? record.ctr.toString() : '', // Use raw CTR value
      conversions: record.conversions.toString()
    });
  };

  const EditableCell = ({ recordId, field, value, type = 'text' }: { 
    recordId: string; 
    field: string; 
    value: any; 
    type?: string; 
  }) => {
    const isEditing = editingCell?.recordId === recordId && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <Button size="sm" variant="ghost" onClick={saveEdit}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 rounded group flex items-center gap-2"
        onClick={() => startEdit(recordId, field, value)}
      >
        <span>{value}</span>
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  const ChannelCell = ({ recordId, value }: { recordId: string; value: string }) => {
    const isEditing = editingCell?.recordId === recordId && editingCell?.field === 'channel';
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
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
          <Button size="sm" variant="ghost" onClick={saveEdit}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 rounded group flex items-center gap-2"
        onClick={() => startEdit(recordId, 'channel', value)}
      >
        <span className="capitalize">
          {CHANNELS.find(c => c.value === value)?.label || value}
        </span>
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  const CampaignCell = ({ recordId, value }: { recordId: string; value: string }) => {
    const isEditing = editingCell?.recordId === recordId && editingCell?.field === 'campaign_name';
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Campaign name"
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <Button size="sm" variant="ghost" onClick={saveEdit}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 rounded group flex items-center gap-2"
        onClick={() => startEdit(recordId, 'campaign_name', value)}
      >
        <span>{value || '-'}</span>
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  const DateCell = ({ recordId, date }: { recordId: string; date: string }) => {
    const isEditing = editingCell?.recordId === recordId && editingCell?.field === 'date';
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editValue || new Date(date).toLocaleDateString()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={editValue ? new Date(editValue) : new Date(date)}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    setEditValue(format(selectedDate, 'yyyy-MM-dd'));
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="ghost" onClick={saveEdit}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 rounded group flex items-center gap-2"
        onClick={() => startEdit(recordId, 'date', date)}
      >
        <CalendarIcon className="h-4 w-4" />
        <span>{new Date(date).toLocaleDateString()}</span>
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Ad Spend Records</h3>
        <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="campaign_name">Campaign</SortableHeader>
            <SortableHeader field="date">Day</SortableHeader>
            <SortableHeader field="clicks">Clicks</SortableHeader>
            <TableHead>Impr.</TableHead>
            <SortableHeader field="ctr">CTR</SortableHeader>
            <TableHead>Currency code</TableHead>
            <TableHead>Avg. CPC</TableHead>
            <SortableHeader field="amount">Cost</SortableHeader>
            <SortableHeader field="conversions">Conversions</SortableHeader>
            <TableHead>Cost / conv.</TableHead>
            <TableHead>Conv. rate</TableHead>
            <SortableHeader field="channel">Channel</SortableHeader>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* New Record Row */}
          {isAddingNew && (
            <TableRow className="bg-muted/50">
              <TableCell>
                <Input
                  placeholder="Campaign name"
                  value={newRecord.campaign_name}
                  onChange={(e) => setNewRecord({ ...newRecord, campaign_name: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newRecord.date, 'MM/dd/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newRecord.date}
                      onSelect={(date) => {
                        if (date) {
                          setNewRecord({ ...newRecord, date });
                        }
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRecord.clicks}
                  onChange={(e) => setNewRecord({ ...newRecord, clicks: e.target.value })}
                />
              </TableCell>
              <TableCell>-</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newRecord.ctr}
                  onChange={(e) => setNewRecord({ ...newRecord, ctr: e.target.value })}
                />
              </TableCell>
              <TableCell>CAD</TableCell>
              <TableCell>-</TableCell>
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
                  type="number"
                  placeholder="0"
                  value={newRecord.conversions}
                  onChange={(e) => setNewRecord({ ...newRecord, conversions: e.target.value })}
                />
              </TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
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
                <div className="flex gap-2">
                  <Button size="sm" onClick={addNewRecord}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAddingNew(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Existing Records */}
          {getSortedData().map((spend) => {
            const amount = spend.amount / 100; // Convert from cents
            const clicks = spend.clicks || 0;
            const conversions = spend.conversions || 0;
            const costPerClick = clicks > 0 ? amount / clicks : 0;
            const costPerConversion = conversions > 0 ? amount / conversions : 0;
            
            return (
              <TableRow key={spend.id}>
                <TableCell>
                  <CampaignCell recordId={spend.id} value={spend.campaign_name} />
                </TableCell>
                <TableCell>
                  <DateCell recordId={spend.id} date={spend.date} />
                </TableCell>
                <TableCell>
                  <EditableCell 
                    recordId={spend.id} 
                    field="clicks" 
                    value={clicks} 
                    type="number"
                  />
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <EditableCell 
                    recordId={spend.id} 
                    field="ctr" 
                    value={spend.ctr || 0} 
                    type="number"
                  />
                </TableCell>
                <TableCell>CAD</TableCell>
                <TableCell>
                  {costPerClick > 0 ? `$${costPerClick.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  <EditableCell 
                    recordId={spend.id} 
                    field="amount" 
                    value={`$${amount.toFixed(2)}`} 
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell 
                    recordId={spend.id} 
                    field="conversions" 
                    value={conversions} 
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  {costPerConversion > 0 ? `$${costPerConversion.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  {conversions > 0 && clicks > 0 ? `${((conversions / clicks) * 100).toFixed(2)}%` : '0%'}
                </TableCell>
                <TableCell>
                  <ChannelCell recordId={spend.id} value={spend.channel} />
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => duplicateRecord(spend)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
