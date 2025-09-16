import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Send, AlertTriangle, Settings, Database } from "lucide-react";

interface MakeSettings {
  enabled: boolean;
  spreadsheet_format: boolean;
  event_toggles: {
    lead_created: boolean;
    partner_assigned: boolean;
    lead_updated: boolean;
    application_submitted: boolean;
    auto_send_on_assignment: boolean;
  };
  field_mappings: {
    lead_fields: Record<string, boolean>;
    partner_fields: Record<string, boolean>;
    application_fields: Record<string, boolean>;
    metadata_fields: Record<string, boolean>;
  };
}

interface MakeLog {
  id: string;
  event_type: string;
  status: string;
  http_status?: number;
  error_message?: string;
  created_at: string;
  lead_id: string;
}

const LEAD_FIELD_LABELS = {
  id: 'Lead ID',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  company_name: 'Company Name',
  loan_amount: 'Loan Amount',
  monthly_revenue: 'Monthly Revenue',
  credit_score: 'Credit Score',
  time_in_business: 'Time in Business',
  use_of_funds: 'Use of Funds',
  country: 'Country',
  city_province: 'City/Province',
  website: 'Website',
  attribution_channel: 'Lead Source',
  attribution_url: 'Source URL',
  bank_account_type: 'Bank Account Type',
  homeowner_status: 'Homeowner Status',
  score: 'Lead Score',
  status: 'Status',
  conversion_status: 'Conversion Status',
  created_at: 'Created Date'
};

const PARTNER_FIELD_LABELS = {
  id: 'Partner ID',
  name: 'Partner Name',
  email: 'Partner Email',
  company_name: 'Partner Company'
};

const APPLICATION_FIELD_LABELS = {
  include_attachments: 'Include Application Attachments',
  usa_reference: 'USA Application Reference',
  canadian_reference: 'Canadian Application Reference',
  bundle_application: 'Bundle Application Data',
  include_bundle_file: 'Include Bundle File',
  bundle_as_json: 'Bundle as JSON Format'
};

const METADATA_FIELD_LABELS = {
  triggered_by_user_id: 'Triggered By User ID',
  triggered_by_email: 'Triggered By Email',
  triggered_at: 'Triggered Date'
};

export default function MakeIntegrationManagement() {
  const [settings, setSettings] = useState<MakeSettings>({
    enabled: false,
    spreadsheet_format: false,
    event_toggles: {
      lead_created: false,
      partner_assigned: false,
      lead_updated: false,
      application_submitted: true,
      auto_send_on_assignment: true
    },
    field_mappings: {
      lead_fields: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company_name: true,
        loan_amount: true,
        monthly_revenue: false,
        credit_score: false,
        time_in_business: false,
        use_of_funds: false,
        country: true,
        city_province: false,
        website: false,
        attribution_channel: false,
        attribution_url: false,
        bank_account_type: false,
        homeowner_status: false,
        score: false,
        status: true,
        conversion_status: true,
        created_at: true
      },
      partner_fields: {
        id: false,
        name: true,
        email: true,
        company_name: true
      },
      application_fields: {
        include_attachments: true,
        usa_reference: true,
        canadian_reference: true,
        bundle_application: true,
        include_bundle_file: false,
        bundle_as_json: true
      },
      metadata_fields: {
        triggered_by_user_id: false,
        triggered_by_email: true,
        triggered_at: true
      }
    }
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [recentLogs, setRecentLogs] = useState<MakeLog[]>([]);
  const [queueStats, setQueueStats] = useState<{pending: number, processing: number, failed: number} | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadRecentLogs();
    loadQueueStats();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('make_integration_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading Make settings:', error);
        return;
      }

      if (data) {
        const eventToggles = data.event_toggles as any;
        const fieldMappings = data.field_mappings as any;
        
        setSettings({
          enabled: data.enabled,
          spreadsheet_format: data.spreadsheet_format || false,
          event_toggles: {
            lead_created: eventToggles?.lead_created || false,
            partner_assigned: eventToggles?.partner_assigned || false,
            lead_updated: eventToggles?.lead_updated || false,
            application_submitted: eventToggles?.application_submitted !== false,
            auto_send_on_assignment: eventToggles?.auto_send_on_assignment !== false
          },
          field_mappings: fieldMappings || settings.field_mappings
        });
        
        // Load the webhook URL if it exists
        if (data.webhook_url) {
          setWebhookUrl(data.webhook_url);
        }
      }
    } catch (error) {
      console.error('Error loading Make settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('make_integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading Make logs:', error);
        return;
      }

      setRecentLogs(data || []);
    } catch (error) {
      console.error('Error loading Make logs:', error);
    }
  };

  const loadQueueStats = async () => {
    try {
      const { data, error } = await supabase
        .from('make_integration_queue')
        .select('status')

      if (error) {
        console.error('Error loading queue stats:', error);
        return;
      }

      const stats = data?.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setQueueStats({
        pending: (stats.pending || 0) + (stats.retrying || 0),
        processing: stats.processing || 0,
        failed: stats.failed || 0
      });
    } catch (error) {
      console.error('Error loading queue stats:', error);
    }
  };

  const processQueue = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-make-queue');

      if (error) throw error;

      toast({
        title: "Queue Processing Complete",
        description: `Processed ${data.processed} items${data.failed > 0 ? `, ${data.failed} failed` : ''}`,
      });

      // Refresh stats and logs
      loadQueueStats();
      loadRecentLogs();
    } catch (error) {
      console.error('Error processing queue:', error);
      toast({
        title: "Error",
        description: "Failed to process Make.com queue.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const backfillLeads = async () => {
    setIsBackfilling(true);
    try {
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
      const dateTo = new Date().toISOString().split('T')[0]; // today

      const { data, error } = await supabase.functions.invoke('backfill-make', {
        body: {
          dateFrom,
          dateTo,
          eventTypes: ['lead_created'],
          batchSize: 50,
          dryRun: false
        }
      });

      if (error) throw error;

      toast({
        title: "Backfill Complete",
        description: `Queued ${data.queuedItems} leads from the last 30 days.`,
      });

      // Refresh stats
      loadQueueStats();
    } catch (error) {
      console.error('Error backfilling leads:', error);
      toast({
        title: "Error",
        description: "Failed to backfill leads to Make.com.",
        variant: "destructive",
      });
    } finally {
      setIsBackfilling(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-make-settings', {
        body: {
          enabled: settings.enabled,
          spreadsheetFormat: settings.spreadsheet_format,
          webhookUrl: webhookUrl.trim(),
          eventToggles: settings.event_toggles,
          fieldMappings: settings.field_mappings
        }
      });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Make.com integration settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving Make settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Make.com integration settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      // Get a sample lead to test with
      const { data: sampleLead, error: leadError } = await supabase
        .from('quiz_responses')
        .select('id')
        .limit(1)
        .single();

      if (leadError || !sampleLead) {
        toast({
          title: "Error",
          description: "No leads found to test with. Create a lead first.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-to-make', {
        body: {
          leadId: sampleLead.id,
          eventType: 'manual_send',
          overridePayload: {
            event_type: 'test',
            test_payload: true,
            message: 'This is a test from True North Business Loan Make.com integration'
          }
        }
      });

      if (error) {
        // Parse the error to get more detailed information
        let errorMessage = error.message || 'Unknown error occurred';
        
        // Try to extract details from the error
        if (error.details) {
          errorMessage = error.details;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        toast({
          title: "Test Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        console.error('Make.com test failed:', error);
        return;
      }

      if (data?.success) {
        toast({
          title: "Test Successful",
          description: "Test payload sent to Make.com successfully!",
        });
      } else if (data?.error) {
        toast({
          title: "Test Failed", 
          description: data.error + (data.http_status ? ` (HTTP ${data.http_status})` : ''),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Test Successful",
          description: "Test payload sent to Make.com successfully!",
        });
      }

      // Refresh logs to show the test
      setTimeout(() => loadRecentLogs(), 1000);
    } catch (error) {
      console.error('Error testing Make connection:', error);
      
      let errorMessage = 'Failed to send test payload to Make.com.';
      if (error instanceof Error) {
        errorMessage = `Failed to send test payload: ${error.message}`;
      }
      
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleFieldToggle = (section: keyof MakeSettings['field_mappings'], field: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      field_mappings: {
        ...prev.field_mappings,
        [section]: {
          ...prev.field_mappings[section],
          [field]: enabled
        }
      }
    }));
  };

  const renderFieldSection = (
    title: string,
    section: keyof MakeSettings['field_mappings'],
    labels: Record<string, string>
  ) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(settings.field_mappings[section]).map(([field, enabled]) => (
            <div key={field} className="flex items-center justify-between space-x-2">
              <Label 
                htmlFor={`${section}-${field}`} 
                className="text-sm font-normal flex-1"
              >
                {labels[field] || field}
              </Label>
              <Switch
                id={`${section}-${field}`}
                checked={enabled}
                onCheckedChange={(checked) => handleFieldToggle(section, field, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Make.com Integration
          </CardTitle>
          <CardDescription>
            Configure Make.com integration to automatically send lead data to your scenarios. 
            You can customize which fields are sent and when triggers are activated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Field Selection
              </TabsTrigger>
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              {queueStats && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-base">Queue Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{queueStats.pending}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{queueStats.processing}</div>
                        <div className="text-sm text-muted-foreground">Processing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={processQueue} 
                        disabled={isProcessing}
                        size="sm"
                        variant="outline"
                      >
                        {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Process Queue
                      </Button>
                      <Button 
                        onClick={backfillLeads} 
                        disabled={isBackfilling}
                        size="sm"
                        variant="outline"
                      >
                        {isBackfilling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Backfill Last 30 Days
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="make-enabled">Enable Integration</Label>
                    <Switch
                      id="make-enabled"
                      checked={settings.enabled}
                      onCheckedChange={(enabled) => 
                        setSettings(prev => ({ ...prev, enabled }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://hook.make.com/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Create a webhook in your Make.com scenario and paste the URL here.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="spreadsheet-format">Spreadsheet Format</Label>
                      <p className="text-sm text-muted-foreground">
                        Send data in flat spreadsheet format instead of nested JSON
                      </p>
                    </div>
                    <Switch
                      id="spreadsheet-format"
                      checked={settings.spreadsheet_format}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, spreadsheet_format: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Event Triggers</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="trigger-lead-created" className="font-normal">
                        New lead created
                      </Label>
                      <Switch
                        id="trigger-lead-created"
                        checked={settings.event_toggles.lead_created}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            event_toggles: { ...prev.event_toggles, lead_created: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="trigger-partner-assigned" className="font-normal">
                        Partner assigned to lead
                      </Label>
                      <Switch
                        id="trigger-partner-assigned"
                        checked={settings.event_toggles.partner_assigned}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            event_toggles: { ...prev.event_toggles, partner_assigned: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="trigger-lead-updated" className="font-normal">
                        Lead status updated
                      </Label>
                      <Switch
                        id="trigger-lead-updated"
                        checked={settings.event_toggles.lead_updated}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            event_toggles: { ...prev.event_toggles, lead_updated: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="trigger-application-submitted" className="font-normal">
                        Application submitted
                      </Label>
                      <Switch
                        id="trigger-application-submitted"
                        checked={settings.event_toggles.application_submitted}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            event_toggles: { ...prev.event_toggles, application_submitted: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="trigger-auto-send" className="font-normal">
                        Auto-send on partner assignment
                      </Label>
                      <Switch
                        id="trigger-auto-send"
                        checked={settings.event_toggles.auto_send_on_assignment}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            event_toggles: { ...prev.event_toggles, auto_send_on_assignment: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button 
                  onClick={saveSettings} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Save Settings
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={testConnection} 
                  disabled={isTesting || !webhookUrl.trim()}
                  className="flex items-center gap-2"
                >
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  Test Connection
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4 mt-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {settings.spreadsheet_format 
                    ? "Spreadsheet format is enabled. Data will be sent as flat columns matching standard spreadsheet headers."
                    : "Select which fields to include in the payload sent to Make.com. Only selected fields will be visible to your clients."
                  }
                </AlertDescription>
              </Alert>

              {settings.spreadsheet_format ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Spreadsheet Format Fields</CardTitle>
                    <CardDescription>
                      When spreadsheet format is enabled, the following fields will be sent:
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">Basic Information</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• First Name</li>
                          <li>• Last Name</li>
                          <li>• Company</li>
                          <li>• Email</li>
                          <li>• Mobile (10 digits only)</li>
                          <li>• Phone (10 digits only)</li>
                          <li>• Date of Birth (DD/MM/YYYY)</li>
                          <li>• Language</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Business & Location</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Requested Amount (Currency)</li>
                          <li>• Annual Revenue (Currency)</li>
                          <li>• Monthly Sales (Currency)</li>
                          <li>• Street, City, Province, Country</li>
                          <li>• Postal Code</li>
                          <li>• Years in Business (Integer)</li>
                          <li>• Entity Type, Industry</li>
                          <li>• Use of Funds</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (

                <>
                  {renderFieldSection("Lead Information", "lead_fields", LEAD_FIELD_LABELS)}
                  {renderFieldSection("Partner Information", "partner_fields", PARTNER_FIELD_LABELS)}
                  {renderFieldSection("Application Data", "application_fields", APPLICATION_FIELD_LABELS)}
                  {renderFieldSection("System Metadata", "metadata_fields", METADATA_FIELD_LABELS)}
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={saveSettings} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Save Field Settings
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="outline" size="sm" onClick={loadRecentLogs}>
                  Refresh
                </Button>
              </div>

              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No Make.com integration attempts found.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(log.status)}>
                            {log.status}
                          </Badge>
                          <span className="font-medium">{log.event_type}</span>
                          {log.http_status && (
                            <span className="text-sm text-muted-foreground">
                              HTTP {log.http_status}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        Lead ID: {log.lead_id.substring(0, 8)}...
                      </div>
                      
                      {log.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          ⚠️ {log.error_message}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
        <p className="font-medium mb-2">Setup Instructions:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Create a webhook in your Make.com scenario and paste the URL above</li>
          <li>Configure which fields you want to send in the "Field Selection" tab</li>
          <li>Enable the integration and select which events should trigger the webhook</li>
          <li>Test the connection to verify everything is working</li>
          <li>The webhook will receive JSON payloads with lead data, partner information, and application details</li>
        </ol>
      </div>
    </div>
  );
}