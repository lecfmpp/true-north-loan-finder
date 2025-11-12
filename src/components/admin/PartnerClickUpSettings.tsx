import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PartnerClickUpSettingsProps {
  partnerId: string;
  currentSettings?: {
    clickup_api_key?: string;
    clickup_list_id?: string;
    clickup_enabled?: boolean;
    auto_send_to_clickup?: boolean;
  };
  onUpdate?: () => void;
}

export default function PartnerClickUpSettings({ 
  partnerId, 
  currentSettings,
  onUpdate 
}: PartnerClickUpSettingsProps) {
  const [apiKey, setApiKey] = useState(currentSettings?.clickup_api_key || '');
  const [listId, setListId] = useState(currentSettings?.clickup_list_id || '');
  const [enabled, setEnabled] = useState(currentSettings?.clickup_enabled || false);
  const [autoSend, setAutoSend] = useState(currentSettings?.auto_send_to_clickup || false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('partners')
        .update({
          clickup_api_key: apiKey,
          clickup_list_id: listId,
          clickup_enabled: enabled,
          auto_send_to_clickup: autoSend,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "ClickUp integration settings updated successfully."
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);

      // Create a test task in ClickUp
      const response = await fetch(
        `https://api.clickup.com/api/v2/list/${listId}/task`,
        {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Test Task - Integration Check',
            description: 'This is a test task created to verify the ClickUp integration is working correctly.',
            tags: ['test']
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.err || 'Failed to connect to ClickUp');
      }

      toast({
        title: "Connection Successful!",
        description: "Test task created in ClickUp. Check your list.",
        duration: 5000
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to ClickUp. Check your API key and List ID.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ClickUp Integration</CardTitle>
        <CardDescription>
          Configure automatic lead delivery to ClickUp when leads are assigned to this partner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Get your ClickUp API key from Settings → Apps → API Token</li>
              <li>Find your List ID from the list URL (last number in the URL)</li>
              <li>Enter both below and test the connection</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clickup_api_key">ClickUp API Key</Label>
            <Input
              id="clickup_api_key"
              type="password"
              placeholder="pk_xxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Get this from ClickUp Settings → Apps → API Token
              <a 
                href="https://app.clickup.com/settings/apps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center text-primary hover:underline"
              >
                Open ClickUp Settings <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clickup_list_id">ClickUp List ID</Label>
            <Input
              id="clickup_list_id"
              type="text"
              placeholder="123456789"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Find this in your list's URL: clickup.com/12345/v/li/<strong>123456789</strong>
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="clickup_enabled">Enable ClickUp Integration</Label>
              <p className="text-sm text-muted-foreground">
                Allow sending leads to ClickUp for this partner
              </p>
            </div>
            <Switch
              id="clickup_enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="auto_send">Auto-Send on Assignment</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create ClickUp tasks when leads are assigned
              </p>
            </div>
            <Switch
              id="auto_send"
              checked={autoSend}
              onCheckedChange={setAutoSend}
              disabled={!enabled}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleTest}
            disabled={!apiKey || !listId || testing}
            variant="outline"
            className="flex-1"
          >
            {testing ? "Testing..." : "Test Connection"}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {enabled && autoSend && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              ✓ Auto-send is <strong>enabled</strong>. Leads will automatically appear in ClickUp when assigned to this partner.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
