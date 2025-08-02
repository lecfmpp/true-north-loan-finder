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
import NotificationEmailSettings from './NotificationEmailSettings';

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

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <NotificationEmailSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsManagement;