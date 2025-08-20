import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, TestTube, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Partner {
  id: string;
  name: string;
  email: string;
  company_name: string;
}

interface GHLIntegration {
  id: string;
  partner_id: string;
  api_key: string;
  location_id: string;
  pipeline_id?: string | null;
  webhook_url?: string | null;
  field_mappings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GHLLog {
  id: string;
  partner_id: string;
  quiz_response_id?: string | null;
  status: string;
  response_data?: any;
  error_message?: string | null;
  created_at: string;
}

export default function GHLIntegrationManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [integrations, setIntegrations] = useState<GHLIntegration[]>([]);
  const [logs, setLogs] = useState<GHLLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [editingIntegration, setEditingIntegration] = useState<Partial<GHLIntegration> | null>(null);

  const defaultFieldMappings = {
    name: 'firstName',
    email: 'email',
    phone: 'phone',
    company_name: 'companyName',
    loan_amount: 'loanAmount',
    monthly_revenue: 'monthlyRevenue',
    credit_score: 'creditScore',
    use_of_funds: 'useOfFunds'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('id, name, email, company_name')
        .eq('is_active', true)
        .order('name');
      
      if (partnersError) throw partnersError;
      setPartners(partnersData || []);

      // Fetch integrations
      const { data: integrationsData, error: integrationsError } = await supabase
        .from('ghl_integrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (integrationsError) throw integrationsError;
      setIntegrations(integrationsData || []);

      // Fetch recent logs
      const { data: logsData, error: logsError } = await supabase
        .from('ghl_integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (logsError) throw logsError;
      setLogs(logsData || []);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load GHL integration data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIntegration = async () => {
    if (!editingIntegration?.partner_id || !editingIntegration?.api_key || !editingIntegration?.location_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const integrationData = {
        partner_id: editingIntegration.partner_id!,
        api_key: editingIntegration.api_key!,
        location_id: editingIntegration.location_id!,
        pipeline_id: editingIntegration.pipeline_id || null,
        webhook_url: editingIntegration.webhook_url || null,
        field_mappings: editingIntegration.field_mappings || defaultFieldMappings,
        is_active: editingIntegration.is_active ?? true,
        ...(editingIntegration.id && { id: editingIntegration.id })
      };

      const { error } = await supabase
        .from('ghl_integrations')
        .upsert(integrationData);
      
      if (error) throw error;
      
      toast.success('GHL integration saved successfully');
      setEditingIntegration(null);
      fetchData();
      
    } catch (error: any) {
      console.error('Error saving integration:', error);
      toast.error('Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestIntegration = async (integration: GHLIntegration) => {
    try {
      setTesting(true);
      
      // Test the integration by calling our edge function
      const { data, error } = await supabase.functions.invoke('test-ghl-integration', {
        body: {
          partnerId: integration.partner_id,
          testData: {
            name: 'Test Lead',
            email: 'test@example.com',
            phone: '555-0123',
            company_name: 'Test Company',
            loan_amount: 50000,
            monthly_revenue: 25000,
            credit_score: 'good'
          }
        }
      });

      if (error) throw error;
      
      if (data.success) {
        // Show detailed test results
        const results = data.results;
        const successCount = Object.values(results).filter((r: any) => 
          r.status === 'Valid' || r.status === 'Successful'
        ).length;
        const totalTests = Object.keys(results).length;
        
        toast.success(
          <div className="space-y-2">
            <div className="font-medium">GHL Integration Test Results</div>
            <div className="text-sm">{data.summary}</div>
            <div className="text-xs text-muted-foreground">
              {successCount}/{totalTests} checks passed
            </div>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(`Test failed: ${data.error}`);
      }
      
    } catch (error: any) {
      console.error('Error testing integration:', error);
      toast.error('Failed to test integration');
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this GHL integration?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ghl_integrations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('GHL integration deleted');
      fetchData();
      
    } catch (error: any) {
      console.error('Error deleting integration:', error);
      toast.error('Failed to delete integration');
    }
  };

  const toggleShowApiKey = (integrationId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId]
    }));
  };

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? `${partner.name} (${partner.company_name})` : 'Unknown Partner';
  };

  const formatFieldMappings = (mappings: Record<string, string>) => {
    return Object.entries(mappings).map(([key, value]) => `${key} → ${value}`).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Go High Level Integrations</h2>
          <p className="text-muted-foreground">Manage GHL integrations for automatic lead delivery</p>
        </div>
        <Dialog open={!!editingIntegration} onOpenChange={(open) => { if (!open) setEditingIntegration(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingIntegration({ field_mappings: defaultFieldMappings })}>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIntegration?.id ? 'Edit' : 'Add'} GHL Integration
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="partner">Partner *</Label>
                <Select 
                  value={editingIntegration?.partner_id || ''} 
                  onValueChange={(value) => setEditingIntegration(prev => ({ ...prev, partner_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map(partner => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name} ({partner.company_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="apiKey">GHL API Key (JWT Format) *</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey['edit'] ? 'text' : 'password'}
                    value={editingIntegration?.api_key || ''}
                    onChange={(e) => setEditingIntegration(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className={editingIntegration?.api_key && editingIntegration.api_key.length < 100 ? 'border-yellow-400' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => toggleShowApiKey('edit')}
                  >
                    {showApiKey['edit'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {editingIntegration?.api_key && editingIntegration.api_key.length < 100 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-2">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This doesn't look like a valid GHL API key. GHL v2 API keys are JWT tokens that are typically 200+ characters long and start with "eyJ".
                    </p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p><strong>How to get your GHL API Key:</strong></p>
                  <ol className="list-decimal list-inside ml-2 space-y-0.5">
                    <li>Go to GHL Settings → API Keys</li>
                    <li>Click "Create New API Key"</li>
                    <li>Grant permissions: <strong>Contacts (read/write)</strong> and <strong>Opportunities (read/write)</strong></li>
                    <li>Copy the JWT token (should start with "eyJ" and be very long)</li>
                  </ol>
                </div>
              </div>

              <div>
                <Label htmlFor="locationId">Location ID *</Label>
                <Input
                  id="locationId"
                  value={editingIntegration?.location_id || ''}
                  onChange={(e) => setEditingIntegration(prev => ({ ...prev, location_id: e.target.value }))}
                  placeholder="Enter GHL Location/Sub-account ID"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Found in GHL Settings → Company → Location ID (usually a 20-character alphanumeric string)
                </p>
              </div>

              <div>
                <Label htmlFor="pipelineId">Pipeline ID (Optional)</Label>
                <Input
                  id="pipelineId"
                  value={editingIntegration?.pipeline_id || ''}
                  onChange={(e) => setEditingIntegration(prev => ({ ...prev, pipeline_id: e.target.value }))}
                  placeholder="Enter GHL Pipeline ID for automatic opportunity creation"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If provided, leads will be added as opportunities to this pipeline. Leave empty to only create contacts.
                </p>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  value={editingIntegration?.webhook_url || ''}
                  onChange={(e) => setEditingIntegration(prev => ({ ...prev, webhook_url: e.target.value }))}
                  placeholder="Enter webhook URL for status updates"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={editingIntegration?.is_active ?? true}
                  onCheckedChange={(checked) => setEditingIntegration(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingIntegration(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveIntegration}
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Integration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Required from client:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Go High Level API Key</strong> (with contacts and opportunities permissions)
                <ul className="list-disc list-inside ml-4 mt-1 text-xs text-muted-foreground">
                  <li>Go to GHL Settings → API Keys → Create New API Key</li>
                  <li>Grant permissions: Contacts (read/write), Opportunities (read/write)</li>
                  <li>Should be a long JWT token starting with "eyJ" (200+ characters)</li>
                </ul>
              </li>
              <li><strong>Location ID</strong> (their GHL sub-account/location identifier)
                <ul className="list-disc list-inside ml-4 mt-1 text-xs text-muted-foreground">
                  <li>Found in GHL Settings → Company → Location ID</li>
                  <li>Usually a 20-character alphanumeric string</li>
                </ul>
              </li>
              <li><strong>Pipeline ID</strong> (optional - which sales pipeline to add leads to)</li>
              <li><strong>Webhook URL</strong> (optional - for status updates)</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
              <p className="text-yellow-800 font-medium">⚠️ Common Issues:</p>
              <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                <li>• API keys must have proper permissions for contacts and opportunities</li>
                <li>• Short UUID-format keys (like "31131afb-...") are not valid GHL API keys</li>
                <li>• Test the integration after setup to verify credentials</li>
              </ul>
            </div>
            <p className="text-muted-foreground mt-4">
              When a lead is assigned to a partner with GHL integration enabled, the system will automatically 
              create a contact in their GHL account and optionally add them to a pipeline.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Current Integrations ({integrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No GHL integrations configured</p>
          ) : (
            <div className="space-y-4">
              {integrations.map(integration => (
                <div key={integration.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{getPartnerName(integration.partner_id)}</h4>
                      <p className="text-sm text-muted-foreground">
                        Location: {integration.location_id}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                        {integration.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestIntegration(integration)}
                        disabled={testing}
                      >
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingIntegration(integration)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteIntegration(integration.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">API Key:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">
                          {showApiKey[integration.id] ? integration.api_key : '••••••••••••••••'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleShowApiKey(integration.id)}
                        >
                          {showApiKey[integration.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Pipeline:</span> {integration.pipeline_id || 'None'}
                    </div>
                    {integration.webhook_url && (
                      <div className="col-span-2">
                        <span className="font-medium">Webhook:</span> {integration.webhook_url}
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="font-medium">Field Mappings:</span>
                      <p className="text-muted-foreground">
                        {formatFieldMappings(integration.field_mappings)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activity logs yet</p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <span className="font-medium">{getPartnerName(log.partner_id)}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                      {log.status}
                    </Badge>
                    {log.error_message && (
                      <span className="text-sm text-destructive">{log.error_message}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}