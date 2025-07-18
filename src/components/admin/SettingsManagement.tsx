import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Video, 
  Shield, 
  Mail, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoogleSettings {
  serviceAccountKey: string;
  calendarId: string;
  enableMeetIntegration: boolean;
  autoCreateEvents: boolean;
  defaultMeetingDuration: number;
  reminderSettings: {
    email24h: boolean;
    email1h: boolean;
    popup10m: boolean;
  };
}

const SettingsManagement = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [showServiceAccountKey, setShowServiceAccountKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const [googleSettings, setGoogleSettings] = useState<GoogleSettings>({
    serviceAccountKey: '',
    calendarId: '',
    enableMeetIntegration: true,
    autoCreateEvents: true,
    defaultMeetingDuration: 15,
    reminderSettings: {
      email24h: true,
      email1h: true,
      popup10m: true
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Note: In a real implementation, you would fetch current settings from Supabase
      // For now, we'll load empty defaults
      console.log('Loading settings...');
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveGoogleSettings = async () => {
    setSaving(prev => ({ ...prev, google: true }));
    try {
      // Validate service account key
      if (googleSettings.serviceAccountKey) {
        try {
          JSON.parse(googleSettings.serviceAccountKey);
        } catch (e) {
          throw new Error('Invalid service account key JSON format');
        }
      }

      // Save to Supabase secrets via edge function
      const { error } = await supabase.functions.invoke('update-google-settings', {
        body: {
          serviceAccountKey: googleSettings.serviceAccountKey,
          calendarId: googleSettings.calendarId,
          settings: {
            enableMeetIntegration: googleSettings.enableMeetIntegration,
            autoCreateEvents: googleSettings.autoCreateEvents,
            defaultMeetingDuration: googleSettings.defaultMeetingDuration,
            reminderSettings: googleSettings.reminderSettings
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Google settings saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving Google settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save Google settings",
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, google: false }));
    }
  };

  const testGoogleConnection = async () => {
    if (!googleSettings.serviceAccountKey || !googleSettings.calendarId) {
      toast({
        title: "Missing Configuration",
        description: "Please provide both service account key and calendar ID",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('testing');
    
    try {
      const { data, error } = await supabase.functions.invoke('test-google-connection', {
        body: {
          serviceAccountKey: googleSettings.serviceAccountKey,
          calendarId: googleSettings.calendarId
        }
      });

      if (error) throw error;

      setConnectionStatus('success');
      toast({
        title: "Connection Successful",
        description: "Successfully connected to Google Calendar",
      });
    } catch (error: any) {
      setConnectionStatus('error');
      console.error('Error testing Google connection:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const updateGoogleSetting = (path: string, value: any) => {
    setGoogleSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage your application configuration and integrations</p>
      </div>

      <Tabs defaultValue="google" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Google Integration
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Settings
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Google Calendar & Meet Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure Google Calendar and Meet integration for automatic meeting creation
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  To set up Google integration, you need to create a service account in Google Cloud Console and enable the Calendar API. 
                  <Button variant="link" className="p-0 h-auto text-sm" asChild>
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                      Open Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceAccountKey">Service Account Key (JSON)</Label>
                    <div className="relative">
                      <Textarea
                        id="serviceAccountKey"
                        placeholder="Paste your Google service account JSON key here..."
                        value={googleSettings.serviceAccountKey}
                        onChange={(e) => updateGoogleSetting('serviceAccountKey', e.target.value)}
                        className="min-h-[120px] font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setShowServiceAccountKey(!showServiceAccountKey)}
                      >
                        {showServiceAccountKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Download from Google Cloud Console → Service Accounts → Create Key → JSON
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calendarId">Google Calendar ID</Label>
                    <Input
                      id="calendarId"
                      placeholder="your-calendar@gmail.com or calendar-id"
                      value={googleSettings.calendarId}
                      onChange={(e) => updateGoogleSetting('calendarId', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use "primary" for your main calendar, or specific calendar ID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Connection Status</Label>
                    <div className="flex items-center gap-2">
                      {connectionStatus === 'success' && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {connectionStatus === 'error' && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Connection Failed
                        </Badge>
                      )}
                      {connectionStatus === 'idle' && (
                        <Badge variant="secondary">
                          Not Tested
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testGoogleConnection}
                        disabled={testingConnection}
                      >
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Meeting Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Google Meet Integration</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically create Google Meet links for bookings
                      </p>
                    </div>
                    <Switch
                      checked={googleSettings.enableMeetIntegration}
                      onCheckedChange={(checked) => updateGoogleSetting('enableMeetIntegration', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-create Calendar Events</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically add events to your calendar
                      </p>
                    </div>
                    <Switch
                      checked={googleSettings.autoCreateEvents}
                      onCheckedChange={(checked) => updateGoogleSetting('autoCreateEvents', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Default Meeting Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="120"
                      value={googleSettings.defaultMeetingDuration}
                      onChange={(e) => updateGoogleSetting('defaultMeetingDuration', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Email Reminders</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">24 hours before</span>
                        <Switch
                          checked={googleSettings.reminderSettings.email24h}
                          onCheckedChange={(checked) => updateGoogleSetting('reminderSettings.email24h', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">1 hour before</span>
                        <Switch
                          checked={googleSettings.reminderSettings.email1h}
                          onCheckedChange={(checked) => updateGoogleSetting('reminderSettings.email1h', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">10 minutes popup</span>
                        <Switch
                          checked={googleSettings.reminderSettings.popup10m}
                          onCheckedChange={(checked) => updateGoogleSetting('reminderSettings.popup10m', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveGoogleSettings}
                  disabled={saving.google}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving.google ? 'Saving...' : 'Save Google Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage email settings and templates
              </p>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Email settings are managed through the Email Sequence Management section in the Admin panel.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure security and access controls
              </p>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Security settings are managed through Supabase authentication and RLS policies.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsManagement;