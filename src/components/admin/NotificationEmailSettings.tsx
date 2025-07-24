import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Save, 
  AlertCircle,
  Bell,
  BellOff
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationSettings {
  id?: string;
  quiz_notification_email: string;
  application_notification_email: string;
  is_quiz_notifications_enabled: boolean;
  is_application_notifications_enabled: boolean;
}

const NotificationEmailSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    quiz_notification_email: '',
    application_notification_email: '',
    is_quiz_notifications_enabled: true,
    is_application_notifications_enabled: true,
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      // Validate email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(settings.quiz_notification_email)) {
        throw new Error('Please enter a valid quiz notification email address');
      }
      
      if (!emailRegex.test(settings.application_notification_email)) {
        throw new Error('Please enter a valid application notification email address');
      }

      const { error } = await supabase
        .from('admin_notification_settings')
        .upsert({
          ...settings,
          id: settings.id || undefined,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification settings saved successfully",
      });

      // Reload settings to get the ID if it was a new record
      await loadNotificationSettings();
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading notification settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Notification Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure where to send notifications when forms are submitted
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These email addresses will receive notifications when users submit quiz responses or complete applications.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quiz Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {settings.is_quiz_notifications_enabled ? (
                      <Bell className="h-4 w-4 text-green-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                    Quiz Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable notifications for quiz submissions
                  </p>
                </div>
                <Switch
                  checked={settings.is_quiz_notifications_enabled}
                  onCheckedChange={(checked) => updateSetting('is_quiz_notifications_enabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quizEmail">Quiz Notification Email</Label>
                <Input
                  id="quizEmail"
                  type="email"
                  placeholder="admin@company.com"
                  value={settings.quiz_notification_email}
                  onChange={(e) => updateSetting('quiz_notification_email', e.target.value)}
                  disabled={!settings.is_quiz_notifications_enabled}
                />
                <p className="text-xs text-muted-foreground">
                  This email will receive notifications when someone completes the funding quiz
                </p>
              </div>
            </div>

            {/* Application Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {settings.is_application_notifications_enabled ? (
                      <Bell className="h-4 w-4 text-green-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                    Application Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable notifications for application submissions
                  </p>
                </div>
                <Switch
                  checked={settings.is_application_notifications_enabled}
                  onCheckedChange={(checked) => updateSetting('is_application_notifications_enabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationEmail">Application Notification Email</Label>
                <Input
                  id="applicationEmail"
                  type="email"
                  placeholder="applications@company.com"
                  value={settings.application_notification_email}
                  onChange={(e) => updateSetting('application_notification_email', e.target.value)}
                  disabled={!settings.is_application_notifications_enabled}
                />
                <p className="text-xs text-muted-foreground">
                  This email will receive notifications when someone submits a complete application
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">Notification Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium text-blue-600">🎯 Quiz Submissions</div>
                <p className="text-muted-foreground">
                  Instant notifications when prospects complete the funding quiz with their basic information and requirements.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-green-600">📄 USA Applications</div>
                <p className="text-muted-foreground">
                  Complete business loan applications for US-based businesses with full documentation.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-red-600">🍁 Canadian Applications</div>
                <p className="text-muted-foreground">
                  Complete business applications for Canadian businesses with all required information.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={saveNotificationSettings}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationEmailSettings;