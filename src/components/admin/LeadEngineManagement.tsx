import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import ScoreRulesManagement from './ScoreRulesManagement';
import BiddingTreeManagement from './BiddingTreeManagement';
import BuyerManagement from './BuyerManagement';
import LeadQueueManagement from './LeadQueueManagement';
import EngineAnalytics from './EngineAnalytics';

interface EngineSettings {
  validation_enabled: boolean;
  ping_tree_enabled: boolean;
  ping_post_enabled: boolean;
  default_hold_duration: number;
  max_ping_timeout: number;
  min_bid_amount: number;
}

interface EngineStats {
  total_leads_processed: number;
  leads_validated: number;
  leads_bid_on: number;
  validation_success_rate: number;
  bidding_success_rate: number;
  avg_processing_time: number;
}

const LeadEngineManagement = () => {
  const [settings, setSettings] = useState<EngineSettings>({
    validation_enabled: true,
    ping_tree_enabled: true,
    ping_post_enabled: false,
    default_hold_duration: 24,
    max_ping_timeout: 10,
    min_bid_amount: 50
  });
  const [stats, setStats] = useState<EngineStats>({
    total_leads_processed: 0,
    leads_validated: 0,
    leads_bid_on: 0,
    validation_success_rate: 0,
    bidding_success_rate: 0,
    avg_processing_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEngineSettings();
    fetchEngineStats();
  }, []);

  const fetchEngineSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_engine_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: any = {};
      data?.forEach(setting => {
        const value = setting.setting_value;
        if (setting.setting_key === 'validation_enabled' || 
            setting.setting_key === 'ping_tree_enabled' || 
            setting.setting_key === 'ping_post_enabled') {
          settingsMap[setting.setting_key] = value === 'true' || value === true;
        } else {
          settingsMap[setting.setting_key] = parseInt(value as string) || 0;
        }
      });

      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Error fetching engine settings:', error);
      toast({
        title: "Error",
        description: "Failed to load engine settings",
        variant: "destructive"
      });
    }
  };

  const fetchEngineStats = async () => {
    try {
      // Mock stats for now - would be calculated from actual data
      const mockStats: EngineStats = {
        total_leads_processed: 1247,
        leads_validated: 1198,
        leads_bid_on: 1156,
        validation_success_rate: 96.1,
        bidding_success_rate: 92.8,
        avg_processing_time: 2.3
      };
      
      setStats(mockStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching engine stats:', error);
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof EngineSettings, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lead_engine_settings')
        .upsert({
          setting_key: key,
          setting_value: JSON.stringify(value)
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Settings Updated",
        description: `${key.replace('_', ' ')} has been updated`
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const StatusCard = ({ title, value, subtitle, icon: Icon, status }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    status: 'success' | 'warning' | 'error' | 'info';
  }) => {
    const statusColors = {
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-600'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <Icon className={`h-8 w-8 ${statusColors[status]}`} />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Bidding Engine</h1>
          <p className="text-muted-foreground">
            Ping Tree bidding system - leads go to highest bidders first
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={settings.validation_enabled ? "default" : "secondary"}>
            Validation {settings.validation_enabled ? "ON" : "OFF"}
          </Badge>
          <Badge variant={settings.ping_tree_enabled ? "default" : "secondary"}>
            Ping Tree {settings.ping_tree_enabled ? "ON" : "OFF"}
          </Badge>
        </div>
      </div>

      {/* Engine Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Leads Processed"
          value={stats.total_leads_processed.toLocaleString()}
          subtitle="Total this month"
          icon={Activity}
          status="info"
        />
        <StatusCard
          title="Validation Rate"
          value={`${stats.validation_success_rate}%`}
          subtitle="Success rate"
          icon={CheckCircle}
          status="success"
        />
        <StatusCard
          title="Bidding Rate"
          value={`${stats.bidding_success_rate}%`}
          subtitle="Successfully bid on"
          icon={CheckCircle}
          status="success"
        />
        <StatusCard
          title="Avg Processing"
          value={`${stats.avg_processing_time}s`}
          subtitle="Per lead"
          icon={Clock}
          status="info"
        />
      </div>

      {/* Main Engine Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Engine Settings
          </CardTitle>
          <CardDescription>
            Configure the core automation engine settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Lead Validation</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically validate incoming leads
                  </p>
                </div>
                <Switch
                  checked={settings.validation_enabled}
                  onCheckedChange={(checked) => updateSetting('validation_enabled', checked)}
                  disabled={saving}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Ping Tree Bidding</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable hierarchical bidding system
                  </p>
                </div>
                <Switch
                  checked={settings.ping_tree_enabled}
                  onCheckedChange={(checked) => updateSetting('ping_tree_enabled', checked)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Ping-Post Exchange</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time bidding system
                  </p>
                </div>
                <Switch
                  checked={settings.ping_post_enabled}
                  onCheckedChange={(checked) => updateSetting('ping_post_enabled', checked)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Minimum Bid Amount</h4>
                <p className="text-sm text-muted-foreground">
                  Minimum bid required to participate: ${settings.min_bid_amount}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Payment Hold Duration</h4>
                <p className="text-sm text-muted-foreground">
                  Hours to hold leads for payment: {settings.default_hold_duration}h
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engine Management Tabs */}
      <Tabs defaultValue="scoring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="scoring">Score Rules</TabsTrigger>
          <TabsTrigger value="bidding">Bidding Tree</TabsTrigger>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
          <TabsTrigger value="queue">Queue Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="scoring">
          <ScoreRulesManagement />
        </TabsContent>

        <TabsContent value="bidding">
          <BiddingTreeManagement />
        </TabsContent>

        <TabsContent value="buyers">
          <BuyerManagement />
        </TabsContent>

        <TabsContent value="queue">
          <LeadQueueManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <EngineAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadEngineManagement;