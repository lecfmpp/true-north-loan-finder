
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface LeadSimulationSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

interface EmailFormData {
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  paymentAmount: number;
  paymentDeadline: string;
  customMessage?: string;
}

const LeadSimulationManagement = () => {
  const [selectedLead, setSelectedLead] = useState<LeadSimulationSubmission | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    recipientEmail: '',
    recipientName: '',
    companyName: '',
    paymentAmount: 50000, // $500.00 in cents
    paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  });

  const queryClient = useQueryClient();

  // Fetch lead simulation submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['lead-simulation-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_simulation_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeadSimulationSubmission[];
    },
  });

  // Send payment link email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: EmailFormData & { applicationId: string }) => {
      const { data, error } = await supabase.functions.invoke('send-payment-link-email', {
        body: emailData,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Payment link email sent successfully!');
      setEmailDialogOpen(false);
      setSelectedLead(null);
      queryClient.invalidateQueries({ queryKey: ['lead-simulation-submissions'] });
    },
    onError: (error: any) => {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error.message || 'Unknown error'}`);
    },
  });

  const handleSendEmail = (lead: LeadSimulationSubmission) => {
    setSelectedLead(lead);
    setEmailForm({
      ...emailForm,
      recipientEmail: lead.email,
      recipientName: lead.name,
      companyName: lead.name + "'s Company", // Default company name
    });
    setEmailDialogOpen(true);
  };

  const handleEmailSubmit = () => {
    if (!selectedLead) return;

    sendEmailMutation.mutate({
      ...emailForm,
      applicationId: selectedLead.id,
    });
  };

  const handleEmailFormChange = (field: keyof EmailFormData, value: string | number) => {
    setEmailForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading lead simulation submissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Lead Simulation Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions?.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.name}
                    </TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell>{submission.phone}</TableCell>
                    <TableCell>
                      {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(submission)}
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Send Payment Link
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!submissions || submissions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No lead simulation submissions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Link Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                value={emailForm.recipientName}
                onChange={(e) => handleEmailFormChange('recipientName', e.target.value)}
                placeholder="Enter recipient name"
              />
            </div>
            
            <div>
              <Label htmlFor="recipientEmail">Recipient Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={emailForm.recipientEmail}
                onChange={(e) => handleEmailFormChange('recipientEmail', e.target.value)}
                placeholder="Enter recipient email"
              />
            </div>
            
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={emailForm.companyName}
                onChange={(e) => handleEmailFormChange('companyName', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={emailForm.paymentAmount / 100} // Convert from cents to dollars
                onChange={(e) => handleEmailFormChange('paymentAmount', parseFloat(e.target.value) * 100)}
                placeholder="500.00"
                step="0.01"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="paymentDeadline">Payment Deadline</Label>
              <Input
                id="paymentDeadline"
                type="date"
                value={emailForm.paymentDeadline}
                onChange={(e) => handleEmailFormChange('paymentDeadline', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Textarea
                id="customMessage"
                value={emailForm.customMessage || ''}
                onChange={(e) => handleEmailFormChange('customMessage', e.target.value)}
                placeholder="Add any additional notes or instructions..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setEmailDialogOpen(false)}
                disabled={sendEmailMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEmailSubmit}
                disabled={sendEmailMutation.isPending || !emailForm.recipientEmail || !emailForm.recipientName}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadSimulationManagement;
