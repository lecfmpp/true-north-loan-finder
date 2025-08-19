
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Copy, Trash2, ArrowUp, ArrowDown, Send, Eye } from 'lucide-react';
import { useQuillEditor } from '@/hooks/useQuillEditor';
import { ImageUpload } from './ImageUpload';

interface BodyBlock {
  id: string;
  type: string;
  html: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  audience_type: 'leads' | 'partners';
  subject: string;
  header_logo_url?: string;
  body_blocks: BodyBlock[];
  footer_html?: string;
  is_active: boolean;
}

interface EmailSend {
  id: string;
  subject: string;
  audience_type: string;
  total_recipients: number;
  status: string;
  created_at: string;
}

export const EmailSenderManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'leads' | 'partners'>('leads');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recentSends, setRecentSends] = useState<EmailSend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [subject, setSubject] = useState('');
  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [bodyBlocks, setBodyBlocks] = useState<BodyBlock[]>([]);
  const [footerHtml, setFooterHtml] = useState('');

  // Load templates and recent sends
  useEffect(() => {
    loadTemplates();
    loadRecentSends();
  }, [activeTab]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_sender_templates')
        .select('*')
        .eq('audience_type', activeTab)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error('Failed to load templates');
      console.error(error);
    }
  };

  const loadRecentSends = async () => {
    try {
      const { data, error } = await supabase
        .from('email_sender_sends')
        .select('*')
        .eq('audience_type', activeTab)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSends(data || []);
    } catch (error: any) {
      console.error('Failed to load recent sends:', error);
    }
  };

  const createNewTemplate = () => {
    setSelectedTemplate(null);
    setTemplateName('');
    setSubject('');
    setHeaderLogoUrl('');
    setBodyBlocks([{ id: crypto.randomUUID(), type: 'html', html: '' }]);
    setFooterHtml('');
  };

  const loadTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setSubject(template.subject);
    setHeaderLogoUrl(template.header_logo_url || '');
    setBodyBlocks(template.body_blocks || []);
    setFooterHtml(template.footer_html || '');
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !subject.trim()) {
      toast.error('Template name and subject are required');
      return;
    }

    try {
      setIsLoading(true);
      const templateData = {
        name: templateName,
        audience_type: activeTab,
        subject,
        header_logo_url: headerLogoUrl || null,
        body_blocks: bodyBlocks,
        footer_html: footerHtml || null,
        created_by: user?.id
      };

      if (selectedTemplate) {
        const { error } = await supabase
          .from('email_sender_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);
        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { data, error } = await supabase
          .from('email_sender_templates')
          .insert([templateData])
          .select()
          .single();
        if (error) throw error;
        setSelectedTemplate(data);
        toast.success('Template saved successfully');
      }
      
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to save template');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('email_sender_templates')
        .insert([{
          name: `${selectedTemplate.name} (Copy)`,
          audience_type: activeTab,
          subject: selectedTemplate.subject,
          header_logo_url: selectedTemplate.header_logo_url,
          body_blocks: selectedTemplate.body_blocks,
          footer_html: selectedTemplate.footer_html,
          created_by: user?.id
        }]);
      
      if (error) throw error;
      toast.success('Template duplicated successfully');
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to duplicate template');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('email_sender_templates')
        .update({ is_active: false })
        .eq('id', selectedTemplate.id);
      
      if (error) throw error;
      toast.success('Template deleted successfully');
      createNewTemplate();
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to delete template');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBodyBlock = () => {
    setBodyBlocks(prev => [...prev, { 
      id: crypto.randomUUID(), 
      type: 'html', 
      html: '' 
    }]);
  };

  const duplicateBodyBlock = (index: number) => {
    const block = bodyBlocks[index];
    setBodyBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, { 
        ...block, 
        id: crypto.randomUUID() 
      });
      return newBlocks;
    });
  };

  const deleteBodyBlock = (index: number) => {
    if (bodyBlocks.length <= 1) return;
    setBodyBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const moveBodyBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...bodyBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBodyBlocks(newBlocks);
  };

  const updateBodyBlock = (index: number, html: string) => {
    setBodyBlocks(prev => prev.map((block, i) => 
      i === index ? { ...block, html } : block
    ));
  };

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error('Please enter a test email address');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('send-email-batch', {
        body: {
          template_id: selectedTemplate?.id,
          subject,
          header_logo_url: headerLogoUrl,
          body_blocks: bodyBlocks,
          footer_html: footerHtml,
          audience_type: activeTab,
          mode: 'test',
          test_email: testEmail
        }
      });

      if (error) throw error;
      toast.success('Test email sent successfully');
    } catch (error: any) {
      toast.error('Failed to send test email');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBatchEmail = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to send this email to all ${activeTab}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('send-email-batch', {
        body: {
          template_id: selectedTemplate?.id,
          subject,
          header_logo_url: headerLogoUrl,
          body_blocks: bodyBlocks,
          footer_html: footerHtml,
          audience_type: activeTab,
          mode: 'batch'
        }
      });

      if (error) throw error;
      toast.success(`Batch email sent: ${data.sent_count} delivered, ${data.failed_count} failed`);
      loadRecentSends();
    } catch (error: any) {
      toast.error('Failed to send batch email');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Sender</h2>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'leads' | 'partners')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leads">Leads Nurturing</TabsTrigger>
          <TabsTrigger value="partners">Brokers/Partners Nurturing</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Library</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedTemplate?.id || ''}
                    onValueChange={(value) => {
                      if (value === 'new') {
                        createNewTemplate();
                      } else {
                        const template = templates.find(t => t.id === value);
                        if (template) loadTemplate(template);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Create New Template</SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button onClick={createNewTemplate} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New
                    </Button>
                    {selectedTemplate && (
                      <>
                        <Button onClick={duplicateTemplate} variant="outline" size="sm" disabled={isLoading}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button onClick={deleteTemplate} variant="outline" size="sm" disabled={isLoading}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Template Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Editor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Enter template name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                    />
                  </div>

                  <div>
                    <Label htmlFor="headerLogo">Header Logo URL</Label>
                    <div className="space-y-2">
                      <Input
                        id="headerLogo"
                        value={headerLogoUrl}
                        onChange={(e) => setHeaderLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                      <ImageUpload
                        onImageUploaded={(url) => setHeaderLogoUrl(url)}
                        bucket="blog-images"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Button onClick={saveTemplate} disabled={isLoading} className="w-full">
                    Save Template
                  </Button>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="testEmail">Test Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="testEmail"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                      />
                      <Button onClick={sendTestEmail} variant="outline" disabled={isLoading}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button onClick={sendBatchEmail} disabled={isLoading} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send to All {activeTab === 'leads' ? 'Leads' : 'Partners'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Body Blocks & Preview */}
            <div className="space-y-6">
              {/* Body Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Body Blocks
                    <Button onClick={addBodyBlock} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Block
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bodyBlocks.map((block, index) => (
                    <EmailBodyBlockEditor
                      key={block.id}
                      block={block}
                      index={index}
                      onUpdate={(html) => updateBodyBlock(index, html)}
                      onDuplicate={() => duplicateBodyBlock(index)}
                      onDelete={() => deleteBodyBlock(index)}
                      onMoveUp={() => moveBodyBlock(index, 'up')}
                      onMoveDown={() => moveBodyBlock(index, 'down')}
                      canMoveUp={index > 0}
                      canMoveDown={index < bodyBlocks.length - 1}
                      canDelete={bodyBlocks.length > 1}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Footer Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Footer</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmailFooterEditor
                    value={footerHtml}
                    onChange={setFooterHtml}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Sends */}
          {recentSends.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Sends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentSends.map(send => (
                    <div key={send.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{send.subject}</div>
                        <div className="text-sm text-gray-600">
                          {send.total_recipients} recipients • {send.status}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(send.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Body Block Editor Component
const EmailBodyBlockEditor = ({ 
  block, 
  index, 
  onUpdate, 
  onDuplicate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown,
  canDelete 
}: {
  block: BodyBlock;
  index: number;
  onUpdate: (html: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDelete: boolean;
}) => {
  const { QuillEditor } = useQuillEditor({
    value: block.html,
    onChange: onUpdate
  });

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label>Block {index + 1}</Label>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onMoveUp} 
            disabled={!canMoveUp}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onMoveDown} 
            disabled={!canMoveDown}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDuplicate}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDelete} 
            disabled={!canDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="min-h-[200px]">
        <QuillEditor />
      </div>
    </div>
  );
};

// Footer Editor Component
const EmailFooterEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const { QuillEditor } = useQuillEditor({
    value,
    onChange
  });

  return (
    <div className="min-h-[150px]">
      <QuillEditor />
    </div>
  );
};
