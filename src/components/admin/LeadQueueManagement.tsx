import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Filter, RefreshCw, AlertCircle, CheckCircle, XCircle, Pause } from 'lucide-react';

interface QueueItem {
  id: string;
  lead_id: string;
  queue_type: string;
  status: string;
  scheduled_delivery?: string;
  buyer_id?: string;
  payment_status?: string;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  // Joined data
  lead_name?: string;
  lead_email?: string;
  buyer_name?: string;
}

const QUEUE_TYPES = [
  { value: 'validation', label: 'Validation', description: 'Leads awaiting validation' },
  { value: 'routing', label: 'Routing', description: 'Leads awaiting routing decision' },
  { value: 'payment_hold', label: 'Payment Hold', description: 'Leads held for payment verification' },
  { value: 'scheduled_delivery', label: 'Scheduled Delivery', description: 'Leads scheduled for future delivery' }
];

const STATUS_COLORS = {
  pending: 'default',
  processing: 'secondary',
  completed: 'default',
  failed: 'destructive',
  cancelled: 'outline'
} as const;

const STATUS_ICONS = {
  pending: Clock,
  processing: RefreshCw,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: Pause
};

const LeadQueueManagement = () => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [queueTypeFilter, setQueueTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQueueItems();
    const interval = setInterval(fetchQueueItems, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueueItems = async () => {
    try {
      setRefreshing(true);
      
      const { data, error } = await supabase
        .from('lead_queue')
        .select(`
          *,
          quiz_responses!lead_id(name, email),
          partners!buyer_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const enrichedItems = (data || []).map(item => ({
        ...item,
        lead_name: item.quiz_responses?.name,
        lead_email: item.quiz_responses?.email,
        buyer_name: item.partners?.name
      }));

      setQueueItems(enrichedItems);
    } catch (error) {
      console.error('Error fetching queue items:', error);
      toast({
        title: "Error",
        description: "Failed to load queue items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const retryQueueItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('lead_queue')
        .update({ 
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Retry Queued",
        description: "Queue item has been marked for retry"
      });
      
      fetchQueueItems();
    } catch (error) {
      console.error('Error retrying queue item:', error);
      toast({
        title: "Error",
        description: "Failed to retry queue item",
        variant: "destructive"
      });
    }
  };

  const cancelQueueItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to cancel this queue item?')) return;

    try {
      const { error } = await supabase
        .from('lead_queue')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item Cancelled",
        description: "Queue item has been cancelled"
      });
      
      fetchQueueItems();
    } catch (error) {
      console.error('Error cancelling queue item:', error);
      toast({
        title: "Error",
        description: "Failed to cancel queue item",
        variant: "destructive"
      });
    }
  };

  const clearCompletedItems = async () => {
    if (!confirm('Are you sure you want to clear all completed items?')) return;

    try {
      const { error } = await supabase
        .from('lead_queue')
        .delete()
        .eq('status', 'completed');

      if (error) throw error;

      toast({
        title: "Completed Items Cleared",
        description: "All completed queue items have been removed"
      });
      
      fetchQueueItems();
    } catch (error) {
      console.error('Error clearing completed items:', error);
      toast({
        title: "Error",
        description: "Failed to clear completed items",
        variant: "destructive"
      });
    }
  };

  const filteredItems = queueItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lead_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesQueueType = queueTypeFilter === 'all' || item.queue_type === queueTypeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesQueueType && matchesStatus;
  });

  const getQueueTypeInfo = (type: string) => {
    return QUEUE_TYPES.find(qt => qt.value === type) || { label: type, description: '' };
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const queueStats = {
    total: queueItems.length,
    pending: queueItems.filter(item => item.status === 'pending').length,
    processing: queueItems.filter(item => item.status === 'processing').length,
    failed: queueItems.filter(item => item.status === 'failed').length,
    completed: queueItems.filter(item => item.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Queue Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage leads in the processing pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchQueueItems} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={clearCompletedItems}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Clear Completed
          </Button>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{queueStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{queueStats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{queueStats.processing}</div>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by lead name, email, or buyer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={queueTypeFilter} onValueChange={setQueueTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by queue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Queue Types</SelectItem>
                  {QUEUE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Queue Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Queue Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const typeInfo = getQueueTypeInfo(item.queue_type);
                const StatusIcon = STATUS_ICONS[item.status];
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.lead_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{item.lead_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{typeInfo.label}</div>
                        <div className="text-xs text-muted-foreground">{typeInfo.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={STATUS_COLORS[item.status]}>
                          {item.status}
                        </Badge>
                      </div>
                      {item.error_message && (
                        <div className="text-xs text-red-600 mt-1">
                          {item.error_message}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.buyer_name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.attempts} / {item.max_attempts}
                      </div>
                      {item.payment_status && (
                        <Badge variant="outline" className="text-xs">
                          {item.payment_status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getTimeSince(item.created_at)}</div>
                      {item.scheduled_delivery && (
                        <div className="text-xs text-muted-foreground">
                          Scheduled: {new Date(item.scheduled_delivery).toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryQueueItem(item.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {(item.status === 'pending' || item.status === 'processing') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelQueueItem(item.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No queue items found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadQueueManagement;