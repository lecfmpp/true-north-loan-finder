import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, Eye, Mail, TrendingUp, Users, MousePointer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailSequence {
  id: string;
  name: string;
  description: string;
  sequence_type: string;
  is_active: boolean;
}

interface EmailTemplate {
  id: string;
  sequence_id: string;
  email_order: number;
  purpose: string;
  subject_line: string;
  email_content: string;
  delay_hours: number;
  is_active: boolean;
}

interface SequenceMetrics {
  emails_sent: number;
  open_rate: number;
  click_rate: number;
}

const EmailSequenceManagement = () => {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [templates, setTemplates] = useState<{ [key: string]: EmailTemplate[] }>({});
  const [metrics, setMetrics] = useState<{ [key: string]: SequenceMetrics }>({});
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    purpose: '',
    subject_line: '',
    email_content: '',
    delay_hours: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch sequences
      const { data: sequencesData, error: sequencesError } = await supabase
        .from('email_sequences')
        .select('*')
        .order('sequence_type');

      if (sequencesError) throw sequencesError;
      setSequences(sequencesData || []);

      // Fetch templates for each sequence
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .order('email_order');

      if (templatesError) throw templatesError;

      // Group templates by sequence_id
      const groupedTemplates: { [key: string]: EmailTemplate[] } = {};
      templatesData?.forEach(template => {
        if (!groupedTemplates[template.sequence_id]) {
          groupedTemplates[template.sequence_id] = [];
        }
        groupedTemplates[template.sequence_id].push(template);
      });
      setTemplates(groupedTemplates);

      // Fetch metrics for each sequence
      const metricsData: { [key: string]: SequenceMetrics } = {};
      for (const sequence of sequencesData || []) {
        const { data: sendsData } = await supabase
          .from('email_sends')
          .select('*')
          .in('template_id', groupedTemplates[sequence.id]?.map(t => t.id) || []);

        const totalSent = sendsData?.length || 0;
        const opened = sendsData?.filter(s => s.opened_at).length || 0;
        const clicked = sendsData?.filter(s => s.clicked_at).length || 0;

        metricsData[sequence.id] = {
          emails_sent: totalSent,
          open_rate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
          click_rate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
        };
      }
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load email sequences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSequenceStatus = async (sequenceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_sequences')
        .update({ is_active: isActive })
        .eq('id', sequenceId);

      if (error) throw error;

      setSequences(prev =>
        prev.map(seq => seq.id === sequenceId ? { ...seq, is_active: isActive } : seq)
      );

      toast({
        title: "Success",
        description: `Sequence ${isActive ? 'activated' : 'paused'}`,
      });
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast({
        title: "Error",
        description: "Failed to update sequence status",
        variant: "destructive",
      });
    }
  };

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: isActive })
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(sequenceId => {
          updated[sequenceId] = updated[sequenceId].map(template =>
            template.id === templateId ? { ...template, is_active: isActive } : template
          );
        });
        return updated;
      });

      toast({
        title: "Success",
        description: `Email ${isActive ? 'activated' : 'paused'}`,
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update email status",
        variant: "destructive",
      });
    }
  };

  const handleViewEmail = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsViewModalOpen(true);
  };

  const handleEditEmail = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditFormData({
      purpose: template.purpose,
      subject_line: template.subject_line,
      email_content: template.email_content,
      delay_hours: template.delay_hours
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          purpose: editFormData.purpose,
          subject_line: editFormData.subject_line,
          email_content: editFormData.email_content,
          delay_hours: editFormData.delay_hours
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      // Update local state
      setTemplates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(sequenceId => {
          updated[sequenceId] = updated[sequenceId].map(template =>
            template.id === selectedTemplate.id 
              ? { ...template, ...editFormData }
              : template
          );
        });
        return updated;
      });

      setIsEditModalOpen(false);
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update email template",
        variant: "destructive",
      });
    }
  };

  const renderSequenceSection = (sequence: EmailSequence) => {
    const sequenceTemplates = templates[sequence.id] || [];
    const sequenceMetrics = metrics[sequence.id] || { emails_sent: 0, open_rate: 0, click_rate: 0 };

    return (
      <Card key={sequence.id} className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {sequence.name}
                <Badge variant={sequence.is_active ? "default" : "secondary"}>
                  {sequence.is_active ? "Active" : "Paused"}
                </Badge>
              </CardTitle>
              <CardDescription>{sequence.description}</CardDescription>
            </div>
            <Switch
              checked={sequence.is_active}
              onCheckedChange={(checked) => toggleSequenceStatus(sequence.id, checked)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Metrics Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Emails Sent</p>
                <p className="text-2xl font-bold">{sequenceMetrics.emails_sent}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Average Open Rate</p>
                <p className="text-2xl font-bold">{sequenceMetrics.open_rate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <MousePointer className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Average CTR</p>
                <p className="text-2xl font-bold">{sequenceMetrics.click_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Email Templates Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Email Purpose</TableHead>
                <TableHead>Subject Line</TableHead>
                <TableHead>Delay (hrs)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequenceTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {template.email_order}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{template.purpose}</TableCell>
                  <TableCell className="max-w-md truncate">{template.subject_line}</TableCell>
                  <TableCell>{template.delay_hours}</TableCell>
                  <TableCell>
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) => toggleTemplateStatus(template.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewEmail(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditEmail(template)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading email sequences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Sequence Management</h2>
          <p className="text-muted-foreground">
            Manage and monitor automated email sequences sent to your users
          </p>
        </div>
      </div>

      {sequences.map(sequence => renderSequenceSection(sequence))}

      {/* View Email Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Template - {selectedTemplate?.purpose}</DialogTitle>
            <DialogDescription>
              Email #{selectedTemplate?.email_order} - Subject: {selectedTemplate?.subject_line}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Purpose</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedTemplate?.purpose}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Subject Line</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedTemplate?.subject_line}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Delay Hours</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedTemplate?.delay_hours} hours</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email Content</Label>
              <div className="mt-2 p-4 border rounded-md bg-muted/50">
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate?.email_content || '' }} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Email Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update the email template content and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={editFormData.purpose}
                onChange={(e) => setEditFormData(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Email purpose"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={editFormData.subject_line}
                onChange={(e) => setEditFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                placeholder="Email subject line"
              />
            </div>
            <div>
              <Label htmlFor="delay">Delay Hours</Label>
              <Input
                id="delay"
                type="number"
                value={editFormData.delay_hours}
                onChange={(e) => setEditFormData(prev => ({ ...prev, delay_hours: parseInt(e.target.value) || 0 }))}
                placeholder="Delay in hours"
              />
            </div>
            <div>
              <Label htmlFor="content">Email Content</Label>
              <Textarea
                id="content"
                value={editFormData.email_content}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email_content: e.target.value }))}
                placeholder="Email content (HTML supported)"
                rows={10}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailSequenceManagement;