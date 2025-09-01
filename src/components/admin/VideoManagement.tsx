import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Video, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoSettings {
  id?: string;
  video_url?: string;
  embed_code?: string;
  video_title: string;
}

const VideoManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    video_title: 'Partnership Overview Video',
    video_url: '',
    embed_code: ''
  });

  useEffect(() => {
    loadVideoSettings();
  }, []);

  const loadVideoSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setVideoSettings(data);
      }
    } catch (error) {
      console.error('Error loading video settings:', error);
      toast({
        title: "Error",
        description: "Failed to load video settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveVideoSettings = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('video_settings')
        .upsert({
          ...videoSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setVideoSettings(data);
      toast({
        title: "Success",
        description: "Video settings saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving video settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save video settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: keyof VideoSettings, value: string) => {
    setVideoSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading video settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Video className="h-6 w-6" />
          Video Settings
        </h2>
        <p className="text-muted-foreground">
          Manage the video displayed on the broker signup page
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="video_title">Video Title</Label>
            <Input
              id="video_title"
              value={videoSettings.video_title}
              onChange={(e) => updateSetting('video_title', e.target.value)}
              placeholder="Enter video title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL</Label>
            <Input
              id="video_url"
              value={videoSettings.video_url || ''}
              onChange={(e) => updateSetting('video_url', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
            />
            <p className="text-sm text-muted-foreground">
              Enter a YouTube, Vimeo, or direct video URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="embed_code">Custom Embed Code</Label>
            <Textarea
              id="embed_code"
              value={videoSettings.embed_code || ''}
              onChange={(e) => updateSetting('embed_code', e.target.value)}
              placeholder="<iframe src=&quot;...&quot; width=&quot;560&quot; height=&quot;315&quot;></iframe>"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Paste custom embed code (iframe) - this will override the video URL if both are provided
            </p>
          </div>

          {(videoSettings.video_url || videoSettings.embed_code) && (
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                Preview will be shown on the broker signup page. The video will be displayed in a responsive container.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={saveVideoSettings} 
            disabled={saving}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Video Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManagement;