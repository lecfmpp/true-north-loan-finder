import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Check, X, Mail, UserCheck, Zap } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  email: string;
  company_name: string;
}

interface LeadDiscrepancy {
  lead_id: string;
  lead_name: string;
  lead_email: string;
  emailed_to_partner: boolean;
  assigned_to_partner: boolean;
  currently_assigned_to?: string;
  currently_assigned_partner_name?: string;
  email_sent_at?: string;
  assignment_date?: string;
}

interface ReconciliationData {
  partner: Partner;
  discrepancies: LeadDiscrepancy[];
  total_emailed: number;
  total_assigned: number;
  missing_assignments: number;
  extra_assignments: number;
}

export default function ReconciliationManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [deductCredits, setDeductCredits] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [conflictLeads, setConflictLeads] = useState<LeadDiscrepancy[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      // Simple fetch without complex type chaining
      const partners = await fetch('/api/partners') // fallback approach
        .catch(async () => {
          // Direct supabase call as backup
          const res = await fetch(`https://kgwcogltpsmapxnjzjhm.supabase.co/rest/v1/partners?status=eq.active&select=id,name,email,company_name&order=name`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2NvZ2x0cHNtYXB4bmp6amhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTI5MjAsImV4cCI6MjA2NzkyODkyMH0.zTQ6IUFqaSOiTNuEMVbIoqIKIPCbLT9GgPvsnTtYVEI',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd2NvZ2x0cHNtYXB4bmp6amhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTI5MjAsImV4cCI6MjA2NzkyODkyMH0.zTQ6IUFqaSOiTNuEMVbIoqIKIPCbLT9GgPvsnTtYVEI`
            }
          });
          return res.json();
        });
      
      setPartners(Array.isArray(partners) ? partners : []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch partners',
        variant: 'destructive',
      });
    }
  };

  const analyzePartnerDiscrepancies = async (partnerId: string) => {
    if (!partnerId) return;

    setLoading(true);
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) return;

      // Get emailed leads
      const emailQuery = supabase
        .from('lead_custom_emails')
        .select('lead_id, recipient_emails, sent_at')
        .contains('recipient_emails', [partner.email])
        .eq('delivery_status', 'delivered');
      
      const emailResult = await emailQuery;
      if (emailResult.error) throw emailResult.error;
      const emailedLeads = emailResult.data || [];

      // Get assigned leads
      const assignQuery = supabase
        .from('lead_assignments')
        .select('quiz_response_id, assigned_at')
        .eq('partner_id', partnerId);
      
      const assignResult = await assignQuery;
      if (assignResult.error) throw assignResult.error;
      const assignedLeads = assignResult.data || [];

      // Get all lead IDs
      const emailedIds = emailedLeads.map(l => l.lead_id);
      const assignedIds = assignedLeads.map(l => l.quiz_response_id);
      const allIds = Array.from(new Set([...emailedIds, ...assignedIds]));

      if (allIds.length === 0) {
        setReconciliationData({
          partner,
          discrepancies: [],
          total_emailed: 0,
          total_assigned: 0,
          missing_assignments: 0,
          extra_assignments: 0,
        });
        return;
      }

      // Get lead details
      const leadQuery = supabase
        .from('quiz_responses')
        .select('id, name, email, assigned_partner_id')
        .in('id', allIds);
      
      const leadResult = await leadQuery;
      if (leadResult.error) throw leadResult.error;
      const leadDetails = leadResult.data || [];

      // Get partner names
      const partnerIds = Array.from(new Set(
        leadDetails.map(l => l.assigned_partner_id).filter(Boolean)
      ));

      let partnerNames: { [key: string]: string } = {};
      if (partnerIds.length > 0) {
        const partnerQuery = supabase
          .from('partners')
          .select('id, name')
          .in('id', partnerIds);
        
        const partnerResult = await partnerQuery;
        if (!partnerResult.error && partnerResult.data) {
          partnerNames = partnerResult.data.reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
          }, {} as { [key: string]: string });
        }
      }

      // Build discrepancies
      const emailedSet = new Set(emailedIds);
      const assignedSet = new Set(assignedIds);
      
      const discrepancies: LeadDiscrepancy[] = [];

      for (const lead of leadDetails) {
        const emailRecord = emailedLeads.find(e => e.lead_id === lead.id);
        const assignRecord = assignedLeads.find(a => a.quiz_response_id === lead.id);
        
        const emailed = emailedSet.has(lead.id);
        const assigned = assignedSet.has(lead.id);

        discrepancies.push({
          lead_id: lead.id,
          lead_name: lead.name,
          lead_email: lead.email,
          emailed_to_partner: emailed,
          assigned_to_partner: assigned,
          currently_assigned_to: lead.assigned_partner_id,
          currently_assigned_partner_name: lead.assigned_partner_id ? partnerNames[lead.assigned_partner_id] : undefined,
          email_sent_at: emailRecord?.sent_at,
          assignment_date: assignRecord?.assigned_at,
        });
      }

      const missingAssignments = discrepancies.filter(d => d.emailed_to_partner && !d.assigned_to_partner).length;
      const extraAssignments = discrepancies.filter(d => !d.emailed_to_partner && d.assigned_to_partner).length;

      setReconciliationData({
        partner,
        discrepancies,
        total_emailed: emailedSet.size,
        total_assigned: assignedSet.size,
        missing_assignments: missingAssignments,
        extra_assignments: extraAssignments,
      });

    } catch (error) {
      console.error('Error analyzing discrepancies:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze partner discrepancies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixSelected = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: 'No leads selected',
        description: 'Please select leads to fix',
        variant: 'destructive',
      });
      return;
    }

    // Check for conflicts
    const conflicts = selectedLeads
      .map(leadId => reconciliationData?.discrepancies.find(d => d.lead_id === leadId))
      .filter(lead => lead && lead.currently_assigned_to && lead.currently_assigned_to !== selectedPartnerId) as LeadDiscrepancy[];

    setConflictLeads(conflicts);
    setShowConfirmDialog(true);
  };

  const executeReconciliation = async () => {
    if (!reconciliationData || !selectedPartnerId) return;

    setLoading(true);
    try {
      const userResult = await supabase.auth.getUser();
      if (!userResult.data.user) throw new Error('Not authenticated');

      for (const leadId of selectedLeads) {
        // Insert assignment
        const insertResult = await supabase
          .from('lead_assignments')
          .insert({
            quiz_response_id: leadId,
            partner_id: selectedPartnerId,
            assigned_by: userResult.data.user.id,
            assigned_at: new Date().toISOString(),
            status: 'assigned'
          });

        if (insertResult.error) {
          console.error('Error assigning lead:', insertResult.error);
          continue;
        }

        // Handle credit deduction
        if (deductCredits) {
          const partnerResult = await supabase
            .from('partners')
            .select('user_id, name')
            .eq('id', selectedPartnerId)
            .single();

          if (partnerResult.data?.user_id) {
            await supabase.rpc('update_partner_credits', {
              p_user_id: partnerResult.data.user_id,
              p_credit_change: -1,
              p_transaction_type: 'usage',
              p_description: `Reconciliation assignment: ${leadId}`,
              p_reference_id: leadId,
              p_created_by: userResult.data.user.id
            });
          }
        }

        // Audit log
        await supabase
          .from('audit_logs')
          .insert({
            table_name: 'lead_assignments',
            record_id: leadId,
            action: 'RECONCILIATION_ASSIGN',
            user_id: userResult.data.user.id,
            new_values: {
              partner_id: selectedPartnerId,
              reconciliation_type: 'email_to_assignment_fix',
              credits_deducted: deductCredits
            }
          });
      }

      toast({
        title: 'Success',
        description: `Reconciled ${selectedLeads.length} leads to ${reconciliationData.partner.name}`,
      });

      // Refresh
      await analyzePartnerDiscrepancies(selectedPartnerId);
      setSelectedLeads([]);
      setShowConfirmDialog(false);

    } catch (error) {
      console.error('Error executing reconciliation:', error);
      toast({
        title: 'Error',
        description: 'Failed to reconcile leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickReconcileEzio = async () => {
    const ezio = partners.find(p => p.email === 'ezio@primedloans.com');
    if (!ezio) {
      toast({
        title: 'Error',
        description: 'Ezio not found in partners',
        variant: 'destructive',
      });
      return;
    }

    setSelectedPartnerId(ezio.id);
    await analyzePartnerDiscrepancies(ezio.id);
    
    // Auto-select target leads after analysis
    setTimeout(() => {
      if (reconciliationData) {
        const targetLeads = reconciliationData.discrepancies
          .filter(d => 
            (d.lead_name.includes('Prajwal Shah') || d.lead_name.includes('Jackie')) &&
            d.emailed_to_partner && !d.assigned_to_partner
          )
          .map(d => d.lead_id);
        
        setSelectedLeads(targetLeads);
      }
    }, 1000);
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Lead Assignment Reconciliation
          </CardTitle>
          <CardDescription>
            Compare leads emailed to partners vs leads assigned in the system and fix discrepancies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="partner-select">Select Partner</Label>
              <Select value={selectedPartnerId} onValueChange={(value) => {
                setSelectedPartnerId(value);
                analyzePartnerDiscrepancies(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a partner to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} ({partner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={quickReconcileEzio}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Quick Fix Ezio
              </Button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Analyzing discrepancies...</p>
            </div>
          )}

          {reconciliationData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{reconciliationData.total_emailed}</div>
                    <div className="text-sm text-muted-foreground">Emailed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{reconciliationData.total_assigned}</div>
                    <div className="text-sm text-muted-foreground">Assigned</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{reconciliationData.missing_assignments}</div>
                    <div className="text-sm text-muted-foreground">Missing Assignments</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <X className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold">{reconciliationData.extra_assignments}</div>
                    <div className="text-sm text-muted-foreground">Extra Assignments</div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deduct-credits"
                    checked={deductCredits}
                    onCheckedChange={setDeductCredits}
                  />
                  <Label htmlFor="deduct-credits">Deduct credits for new assignments</Label>
                </div>
                <Button 
                  onClick={handleFixSelected}
                  disabled={selectedLeads.length === 0 || loading}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Fix Selected ({selectedLeads.length})
                </Button>
              </div>

              {/* Discrepancies */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Lead Discrepancies</h3>
                {reconciliationData.discrepancies.length === 0 ? (
                  <p className="text-muted-foreground">No leads found for this partner.</p>
                ) : (
                  reconciliationData.discrepancies.map((discrepancy) => (
                    <Card key={discrepancy.lead_id} className={
                      discrepancy.emailed_to_partner !== discrepancy.assigned_to_partner 
                        ? "border-yellow-200 bg-yellow-50" 
                        : "border-green-200 bg-green-50"
                    }>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedLeads.includes(discrepancy.lead_id)}
                              onCheckedChange={() => toggleLeadSelection(discrepancy.lead_id)}
                              disabled={discrepancy.emailed_to_partner === discrepancy.assigned_to_partner}
                            />
                            <div>
                              <div className="font-medium">{discrepancy.lead_name}</div>
                              <div className="text-sm text-muted-foreground">{discrepancy.lead_email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={discrepancy.emailed_to_partner ? "default" : "outline"}>
                              {discrepancy.emailed_to_partner ? "Emailed" : "Not Emailed"}
                            </Badge>
                            <Badge variant={discrepancy.assigned_to_partner ? "default" : "outline"}>
                              {discrepancy.assigned_to_partner ? "Assigned" : "Not Assigned"}
                            </Badge>
                            {discrepancy.currently_assigned_to && discrepancy.currently_assigned_to !== selectedPartnerId && (
                              <Badge variant="destructive">
                                Assigned to {discrepancy.currently_assigned_partner_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Lead Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to assign {selectedLeads.length} leads to {reconciliationData?.partner.name}.
              {conflictLeads.length > 0 && (
                <>
                  <br /><br />
                  <strong>Warning:</strong> {conflictLeads.length} leads are currently assigned to other partners:
                  <ul className="mt-2 list-disc pl-4">
                    {conflictLeads.map(lead => (
                      <li key={lead.lead_id}>
                        {lead.lead_name} (currently assigned to {lead.currently_assigned_partner_name})
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <br /><br />
              Credits will {deductCredits ? 'be deducted' : 'NOT be deducted'} for these assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeReconciliation} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Assignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}