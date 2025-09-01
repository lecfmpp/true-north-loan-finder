import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Video, ExternalLink, Monitor, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoSettings {
  id?: string;
  page_identifier: string;
  video_url?: string;
  embed_code?: string;
  video_title: string;
  is_active: boolean;
}

const AVAILABLE_PAGES = [
  { value: 'broker-lp-video', label: 'Broker Landing Page (Video)' },
  { value: 'broker-signup', label: 'Broker Signup Page' },
  { value: 'home', label: 'Home Page' },
  { value: 'how-it-works', label: 'How It Works Page' },
] as const;

const VideoManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allVideoSettings, setAllVideoSettings] = useState<VideoSettings[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('broker-lp-video');
  const [currentVideo, setCurrentVideo] = useState<VideoSettings>({
    page_identifier: 'broker-lp-video',
    video_title: 'Partnership Overview Video',
    video_url: '',
    embed_code: '',
    is_active: true
  });

  useEffect(() => {
    loadAllVideoSettings();
  }, []);

  useEffect(() => {
    // Load video for selected page
    const pageVideo = allVideoSettings.find(v => v.page_identifier === selectedPage && v.is_active);
    if (pageVideo) {
      setCurrentVideo(pageVideo);
    } else {
      setCurrentVideo({
        page_identifier: selectedPage,
        video_title: getDefaultTitleForPage(selectedPage),
        video_url: '',
        embed_code: '',
        is_active: true
      });
    }
  }, [selectedPage, allVideoSettings]);

  const getDefaultTitleForPage = (pageId: string): string => {
    const page = AVAILABLE_PAGES.find(p => p.value === pageId);
    return page ? `${page.label} Video` : 'Video';
  };

  const loadAllVideoSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_settings')
        .select('*')
        .order('page_identifier', { ascending: true });

      if (error) throw error;
      setAllVideoSettings(data || []);
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
      // First disable any existing active video for this page
      if (currentVideo.is_active) {
        await supabase
          .from('video_settings')
          .update({ is_active: false })
          .eq('page_identifier', currentVideo.page_identifier)
          .eq('is_active', true);
      }

      // Then upsert the current video
      const { data, error } = await supabase
        .from('video_settings')
        .upsert({
          ...currentVideo,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Reload all settings
      await loadAllVideoSettings();
      
      toast({
        title: "Success",
        description: `Video settings saved for ${AVAILABLE_PAGES.find(p => p.value === selectedPage)?.label}`,
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

  const deleteVideoSettings = async () => {
    if (!currentVideo.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('video_settings')
        .delete()
        .eq('id', currentVideo.id);

      if (error) throw error;

      await loadAllVideoSettings();
      
      toast({
        title: "Success",
        description: `Video settings deleted for ${AVAILABLE_PAGES.find(p => p.value === selectedPage)?.label}`,
      });
    } catch (error: any) {
      console.error('Error deleting video settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete video settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: keyof VideoSettings, value: string | boolean) => {
    setCurrentVideo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPageStatus = (pageId: string) => {
    const hasVideo = allVideoSettings.some(v => v.page_identifier === pageId && v.is_active);
    return hasVideo ? 'configured' : 'empty';
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
          Manage videos for different pages across your site
        </p>
      </div>

      {/* Page Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Page Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AVAILABLE_PAGES.map((page) => (
              <div 
                key={page.value}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPage === page.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setSelectedPage(page.value)}
              >
                <div className="flex flex-col gap-2">
                  <p className="font-medium text-sm">{page.label}</p>
                  <Badge 
                    variant={getPageStatus(page.value) === 'configured' ? 'default' : 'outline'}
                    className="text-xs w-fit"
                  >
                    {getPageStatus(page.value) === 'configured' ? 'Has Video' : 'No Video'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Video Configuration for {AVAILABLE_PAGES.find(p => p.value === selectedPage)?.label}</span>
            {currentVideo.id && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deleteVideoSettings}
                disabled={saving}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="video_title">Video Title</Label>
            <Input
              id="video_title"
              value={currentVideo.video_title}
              onChange={(e) => updateSetting('video_title', e.target.value)}
              placeholder="Enter video title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL</Label>
            <Input
              id="video_url"
              value={currentVideo.video_url || ''}
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
              value={currentVideo.embed_code || ''}
              onChange={(e) => updateSetting('embed_code', e.target.value)}
              placeholder="<iframe src=&quot;...&quot; width=&quot;560&quot; height=&quot;315&quot;></iframe>"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Paste custom embed code (iframe) - this will override the video URL if both are provided
            </p>
          </div>

          {(currentVideo.video_url || currentVideo.embed_code) && (
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                Preview will be shown on the {AVAILABLE_PAGES.find(p => p.value === selectedPage)?.label.toLowerCase()}. The video will be displayed in a responsive container.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={saveVideoSettings} 
              disabled={saving || (!currentVideo.video_url && !currentVideo.embed_code)}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : currentVideo.id ? 'Update Video Settings' : 'Create Video Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManagement;