import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Send, AlertTriangle } from "lucide-react";

interface MakeSettings {
  enabled: boolean;
  event_toggles: {
    lead_created: boolean;
    partner_assigned: boolean;
    application_submitted: boolean;
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

export default function MakeIntegrationManagement() {
  const [settings, setSettings] = useState<MakeSettings>({
    enabled: false,
    event_toggles: {
      lead_created: false,
      partner_assigned: false,
      application_submitted: false
    }
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [recentLogs, setRecentLogs] = useState<MakeLog[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadRecentLogs();
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
        setSettings({
          enabled: data.enabled,
          event_toggles: {
            lead_created: eventToggles?.lead_created || false,
            partner_assigned: eventToggles?.partner_assigned || false,
            application_submitted: eventToggles?.application_submitted || false
          }
        });
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
        .limit(5);

      if (error) {
        console.error('Error loading Make logs:', error);
        return;
      }

      setRecentLogs(data || []);
    } catch (error) {
      console.error('Error loading Make logs:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-make-settings', {
        body: {
          enabled: settings.enabled,
          webhookUrl: webhookUrl.trim() || undefined,
          eventToggles: settings.event_toggles
        }
      });

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Make.com integration settings have been updated successfully.",
      });

      // Refresh logs after saving
      loadRecentLogs();
    } catch (error) {
      console.error('Error saving Make settings:', error);
      toast({
        title: "Error",
        description: "Failed to update Make.com integration settings.",
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

      const { error } = await supabase.functions.invoke('send-to-make', {
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

      if (error) throw error;

      toast({
        title: "Test Successful",
        description: "Test payload sent to Make.com successfully!",
      });

      // Refresh logs to show the test
      setTimeout(() => loadRecentLogs(), 1000);
    } catch (error) {
      console.error('Error testing Make connection:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test payload to Make.com.",
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
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const maskWebhookUrl = (url: string) => {
    if (!url) return '';
    if (url.length <= 20) return '*'.repeat(url.length);
    return url.substring(0, 10) + '*'.repeat(url.length - 20) + url.substring(url.length - 10);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Make.com Integration</h2>
        <p className="text-muted-foreground">
          Configure Make.com webhook integration to automatically send lead data to your Make scenarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration Settings</CardTitle>
          <CardDescription>
            Configure when and how lead data is sent to Make.com
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Integration */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable Integration</Label>
              <p className="text-sm text-muted-foreground">
                Turn on Make.com integration
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          <Separator />

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://hook.make.com/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your Make.com webhook URL. This will be stored securely.
            </p>
          </div>

          <Separator />

          {/* Event Toggles */}
          <div className="space-y-4">
            <div>
              <Label>Automatic Events</Label>
              <p className="text-sm text-muted-foreground">
                Choose which events automatically trigger webhooks to Make.com
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lead-created">Lead Created</Label>
                  <p className="text-sm text-muted-foreground">
                    Send webhook when a new lead submits the quiz
                  </p>
                </div>
                <Switch
                  id="lead-created"
                  checked={settings.event_toggles.lead_created}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      event_toggles: { ...settings.event_toggles, lead_created: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="partner-assigned">Partner Assigned</Label>
                  <p className="text-sm text-muted-foreground">
                    Send webhook when a lead is assigned to a partner
                  </p>
                </div>
                <Switch
                  id="partner-assigned"
                  checked={settings.event_toggles.partner_assigned}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      event_toggles: { ...settings.event_toggles, partner_assigned: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="application-submitted">Application Submitted</Label>
                  <p className="text-sm text-muted-foreground">
                    Send webhook when a lead submits a loan application
                  </p>
                </div>
                <Switch
                  id="application-submitted"
                  checked={settings.event_toggles.application_submitted}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      event_toggles: { ...settings.event_toggles, application_submitted: checked }
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={isTesting || !webhookUrl.trim()}>
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent Activity
            <Badge variant="outline">{recentLogs.length}</Badge>
          </CardTitle>
          <CardDescription>
            Recent Make.com integration attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recent activity. Try sending a test or enable automatic events.
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
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
                    <p className="text-sm text-muted-foreground">
                      {formatDate(log.created_at)} • Lead ID: {log.lead_id.substring(0, 8)}...
                    </p>
                    {log.error_message && (
                      <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {log.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          To set up the integration, create a webhook in your Make.com scenario and paste the URL above. 
          The webhook will receive JSON payloads with lead data, partner information, and application details.
        </AlertDescription>
      </Alert>
    </div>
  );
}