import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Check, X, Edit } from 'lucide-react';
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

export default function EditableAdSpendTable({ adSpends, onDataUpdate }: EditableAdSpendTableProps) {
  const [editingCell, setEditingCell] = useState<{ recordId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [uniqueCampaigns, setUniqueCampaigns] = useState<string[]>([]);
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

  const updateDate = async (recordId: string, date: Date) => {
    try {
      const { error } = await supabase
        .from('ad_spend_records')
        .update({ date: format(date, 'yyyy-MM-dd') })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Date updated successfully"
      });

      onDataUpdate();
    } catch (error) {
      console.error('Error updating date:', error);
      toast({
        title: "Error",
        description: "Failed to update date",
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
      const { error } = await supabase
        .from('ad_spend_records')
        .insert({
          date: format(newRecord.date, 'yyyy-MM-dd'),
          channel: newRecord.channel,
          amount: Math.round(parseFloat(newRecord.amount) * 100), // Convert to cents
          campaign_name: newRecord.campaign_name,
          clicks: parseInt(newRecord.clicks) || 0,
          ctr: parseFloat(newRecord.ctr) || 0,
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
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start text-left font-normal hover:bg-muted/50"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {new Date(date).toLocaleDateString()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={new Date(date)}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                updateDate(recordId, selectedDate);
              }
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
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
            <TableHead>Date</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>Cost per Click</TableHead>
            <TableHead>CTR (%)</TableHead>
            <TableHead>Conversions</TableHead>
            <TableHead>Cost per Conversion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* New Record Row */}
          {isAddingNew && (
            <TableRow className="bg-muted/50">
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
                <Select value={newRecord.campaign_name} onValueChange={(value) => setNewRecord({ ...newRecord, campaign_name: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCampaigns.map((campaign) => (
                      <SelectItem key={campaign} value={campaign}>
                        {campaign}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <TableCell>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRecord.conversions}
                  onChange={(e) => setNewRecord({ ...newRecord, conversions: e.target.value })}
                />
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
          {adSpends.map((spend) => {
            const amount = spend.amount / 100; // Convert from cents
            const clicks = spend.clicks || 0;
            const conversions = spend.conversions || 0;
            const costPerClick = clicks > 0 ? amount / clicks : 0;
            const costPerConversion = conversions > 0 ? amount / conversions : 0;
            
            return (
              <TableRow key={spend.id}>
                <TableCell>
                  <DateCell recordId={spend.id} date={spend.date} />
                </TableCell>
                <TableCell>
                  <ChannelCell recordId={spend.id} value={spend.channel} />
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
                  <CampaignCell recordId={spend.id} value={spend.campaign_name} />
                </TableCell>
                <TableCell>
                  <EditableCell 
                    recordId={spend.id} 
                    field="clicks" 
                    value={clicks} 
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  {costPerClick > 0 ? `$${costPerClick.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  <EditableCell 
                    recordId={spend.id} 
                    field="ctr" 
                    value={spend.ctr ? `${spend.ctr}%` : '0%'} 
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
