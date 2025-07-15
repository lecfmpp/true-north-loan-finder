import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Copy, Check, Code, MessageCircle, Settings, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from '@/components/admin/ImageUpload';

interface ChatConfig {
  id: string;
  is_enabled: boolean;
  support_person_name: string;
  support_person_avatar_url: string | null;
  ai_instructions: string;
  widget_position: string;
  primary_color: string;
}

interface ChatQA {
  id: string;
  question: string;
  answer: string;
  related_links: { title: string; url: string }[];
  fallback_action: string;
  is_active: boolean;
  order_index: number;
}

export function ChatWidgetManagement() {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [localConfig, setLocalConfig] = useState<ChatConfig | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qaList, setQaList] = useState<ChatQA[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQA, setEditingQA] = useState<ChatQA | null>(null);
  const [isQADialogOpen, setIsQADialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
    fetchQA();
  }, []);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setHasUnsavedChanges(false);
    }
  }, [config]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_widget_config')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching config:', error);
        return;
      }

      setConfig(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQA = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_widget_qa')
        .select('*')
        .order('order_index');

      if (error) {
        console.error('Error fetching Q&A:', error);
        return;
      }

      setQaList((data || []).map(item => ({
        ...item,
        related_links: Array.isArray(item.related_links) 
          ? item.related_links as { title: string; url: string }[]
          : []
      })));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateLocalConfig = (updates: Partial<ChatConfig>) => {
    if (!localConfig) return;
    
    setLocalConfig({ ...localConfig, ...updates });
    setHasUnsavedChanges(true);
  };

  const saveConfiguration = async () => {
    if (!localConfig || !config) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chat_widget_config')
        .update(localConfig)
        .eq('id', config.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save configuration",
          variant: "destructive",
        });
        return;
      }

      setConfig(localConfig);
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetConfiguration = () => {
    if (config) {
      setLocalConfig(config);
      setHasUnsavedChanges(false);
    }
  };

  const saveQA = async (qa: Omit<ChatQA, 'id'>) => {
    try {
      if (editingQA) {
        const { error } = await supabase
          .from('chat_widget_qa')
          .update(qa)
          .eq('id', editingQA.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chat_widget_qa')
          .insert(qa);

        if (error) throw error;
      }

      fetchQA();
      setIsQADialogOpen(false);
      setEditingQA(null);
      toast({
        title: "Success",
        description: `Q&A ${editingQA ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving Q&A:', error);
      toast({
        title: "Error",
        description: "Failed to save Q&A",
        variant: "destructive",
      });
    }
  };

  const deleteQA = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chat_widget_qa')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchQA();
      toast({
        title: "Success",
        description: "Q&A deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting Q&A:', error);
      toast({
        title: "Error",
        description: "Failed to delete Q&A",
        variant: "destructive",
      });
    }
  };

  const generateImplementationCode = () => {
    if (!config) return '';

    return `<!-- Chat Widget Implementation Code -->
<script>
  // Chat Widget Configuration
  window.chatWidgetConfig = {
    enabled: ${config.is_enabled},
    supportName: "${config.support_person_name}",
    supportAvatar: "${config.support_person_avatar_url || ''}",
    position: "${config.widget_position}",
    primaryColor: "${config.primary_color}",
    apiUrl: "https://kgwcogltpsmapxnjzjhm.supabase.co"
  };

  // Load Chat Widget
  (function() {
    if (!window.chatWidgetConfig.enabled) return;
    
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/chat-widget.js';
    script.async = true;
    document.head.appendChild(script);
    
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = 'https://your-domain.com/chat-widget.css';
    document.head.appendChild(styles);
  })();
</script>`;
  };

  const copyImplementationCode = () => {
    navigator.clipboard.writeText(generateImplementationCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast({
      title: "Success",
      description: "Implementation code copied to clipboard",
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!config) {
    return <div>No configuration found</div>;
  }

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings size={16} />
          Settings
        </TabsTrigger>
        <TabsTrigger value="qa" className="flex items-center gap-2">
          <MessageCircle size={16} />
          Q&A Management
        </TabsTrigger>
        <TabsTrigger value="implementation" className="flex items-center gap-2">
          <Code size={16} />
          Implementation
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Chat Widget Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={localConfig?.is_enabled || false}
                onCheckedChange={(checked) => updateLocalConfig({ is_enabled: checked })}
              />
              <Label>Enable Chat Widget</Label>
              <Badge variant={localConfig?.is_enabled ? "default" : "secondary"}>
                {localConfig?.is_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supportName">Support Person Name</Label>
                <Input
                  id="supportName"
                  value={localConfig?.support_person_name || ''}
                  onChange={(e) => updateLocalConfig({ support_person_name: e.target.value })}
                  placeholder="Support Agent"
                />
              </div>

              <div className="space-y-2">
                <Label>Support Person Avatar</Label>
                <ImageUpload
                  currentImageUrl={localConfig?.support_person_avatar_url || ''}
                  onImageUploaded={(url) => updateLocalConfig({ support_person_avatar_url: url })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Widget Position</Label>
                <Select 
                  value={localConfig?.widget_position || 'bottom-right'} 
                  onValueChange={(value) => updateLocalConfig({ widget_position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    value={localConfig?.primary_color || '#0066cc'}
                    onChange={(e) => updateLocalConfig({ primary_color: e.target.value })}
                    placeholder="#0066cc"
                  />
                  <div 
                    className="w-10 h-10 rounded border"
                    style={{ backgroundColor: localConfig?.primary_color || '#0066cc' }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiInstructions">AI Instructions</Label>
              <Textarea
                id="aiInstructions"
                value={localConfig?.ai_instructions || ''}
                onChange={(e) => updateLocalConfig({ ai_instructions: e.target.value })}
                placeholder="Instructions for how the AI should respond to users..."
                rows={4}
              />
            </div>

            {/* Save Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges && (
                    <Badge variant="secondary">Unsaved Changes</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetConfiguration}
                    disabled={!hasUnsavedChanges || isSaving}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={saveConfiguration}
                    disabled={!hasUnsavedChanges || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="qa" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Q&A Management</h3>
          <Dialog open={isQADialogOpen} onOpenChange={setIsQADialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingQA(null)}>
                <Plus size={16} className="mr-2" />
                Add Q&A
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingQA ? 'Edit' : 'Add'} Q&A</DialogTitle>
              </DialogHeader>
              <QAForm 
                qa={editingQA}
                onSave={saveQA}
                onCancel={() => {
                  setIsQADialogOpen(false);
                  setEditingQA(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Answer Preview</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Fallback</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qaList.map((qa) => (
                  <TableRow key={qa.id}>
                    <TableCell className="font-medium">{qa.question}</TableCell>
                    <TableCell className="max-w-xs truncate">{qa.answer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{qa.related_links.length} links</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{qa.fallback_action}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={qa.is_active ? "default" : "secondary"}>
                        {qa.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingQA(qa);
                            setIsQADialogOpen(true);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteQA(qa.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="implementation" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Implementation Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Copy and paste this code into any page where you want the chat widget to appear:
            </p>
            
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{generateImplementationCode()}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={copyImplementationCode}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                {copiedCode ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Implementation Notes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• The widget will only appear when enabled in settings</li>
                <li>• You'll need to host the chat-widget.js and chat-widget.css files</li>
                <li>• The widget automatically follows your configured styling</li>
                <li>• Users can interact with pre-defined Q&A or get AI assistance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

interface QAFormProps {
  qa: ChatQA | null;
  onSave: (qa: Omit<ChatQA, 'id'>) => void;
  onCancel: () => void;
}

function QAForm({ qa, onSave, onCancel }: QAFormProps) {
  const [formData, setFormData] = useState({
    question: qa?.question || '',
    answer: qa?.answer || '',
    related_links: qa?.related_links || [],
    fallback_action: qa?.fallback_action || 'escalate',
    is_active: qa?.is_active ?? true,
    order_index: qa?.order_index || 0,
  });

  const [newLink, setNewLink] = useState({ title: '', url: '' });

  const addLink = () => {
    if (newLink.title && newLink.url) {
      setFormData(prev => ({
        ...prev,
        related_links: [...prev.related_links, newLink]
      }));
      setNewLink({ title: '', url: '' });
    }
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      related_links: prev.related_links.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
          placeholder="What question will trigger this response?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
          placeholder="The response that will be shown to users..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Related Links</Label>
        <div className="space-y-2">
          {formData.related_links.map((link, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1">{link.title}</span>
              <span className="text-muted-foreground text-sm">{link.url}</span>
              <Button variant="ghost" size="sm" onClick={() => removeLink(index)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Link title"
              value={newLink.title}
              onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
            />
            <Input
              placeholder="Link URL"
              value={newLink.url}
              onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
            />
            <Button onClick={addLink}>Add</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fallback">Fallback Action</Label>
          <Select 
            value={formData.fallback_action}
            onValueChange={(value) => setFormData(prev => ({ ...prev, fallback_action: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="escalate">Escalate to AI</SelectItem>
              <SelectItem value="contact">Show Contact Info</SelectItem>
              <SelectItem value="redirect">Redirect to Page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Order Index</Label>
          <Input
            id="order"
            type="number"
            value={formData.order_index}
            onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label>Active</Label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Q&A</Button>
      </DialogFooter>
    </div>
  );
}