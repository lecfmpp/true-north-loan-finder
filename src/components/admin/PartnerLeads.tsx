import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, DollarSign, Calendar, Building2, MapPin, Edit3, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthly_revenue: number;
  loan_amount: number;
  credit_score: string;
  time_in_business: string;
  use_of_funds: string;
  created_at: string;
  country: string;
  city_province: string;
  assignment_id: string;
  assignment_status: string;
  loan_value?: number;
  partner_notes?: string;
  attribution_channel?: string;
  shared_notes?: string;
}

export default function PartnerLeads() {
  const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    status: string;
    loan_value: string;
    partner_notes: string;
    shared_notes: string;
  }>({ status: '', loan_value: '', partner_notes: '', shared_notes: '' });
  const { user } = useAuth();
  const { toast } = useToast();

  const leadStatuses = [
    'New', 'No Answer', 'Wrong Number', 'Contacted', 
    'Application Sent', 'Disqualified', 'Loan Approved'
  ];

  useEffect(() => {
    if (user) {
      fetchAssignedLeads();
    }
  }, [user]);

  const fetchAssignedLeads = async () => {
    try {
      setLoading(true);
      
      // Get the partner record for the current user
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (partnerError || !partnerData) {
        setAssignedLeads([]);
        return;
      }

      // Fetch assigned leads with full lead information
      const { data: assignments, error: assignmentError } = await supabase
        .from('lead_assignments')
        .select(`
          *,
          quiz_responses!inner(*)
        `)
        .eq('partner_id', partnerData.id);

      if (assignmentError) throw assignmentError;

      // Transform the data to match our Lead interface
      const leads = assignments?.map(assignment => ({
        id: assignment.quiz_responses.id,
        name: assignment.quiz_responses.name,
        email: assignment.quiz_responses.email,
        phone: assignment.quiz_responses.phone,
        monthly_revenue: assignment.quiz_responses.monthly_revenue,
        loan_amount: assignment.quiz_responses.loan_amount,
        credit_score: assignment.quiz_responses.credit_score,
        time_in_business: assignment.quiz_responses.time_in_business,
        use_of_funds: assignment.quiz_responses.use_of_funds,
        created_at: assignment.quiz_responses.created_at,
        country: assignment.quiz_responses.country,
        city_province: assignment.quiz_responses.city_province,
        assignment_id: assignment.id,
        assignment_status: assignment.status,
        loan_value: assignment.loan_value,
        partner_notes: assignment.partner_notes,
        attribution_channel: assignment.quiz_responses.attribution_channel,
        shared_notes: assignment.quiz_responses.shared_notes
      })) || [];

      setAssignedLeads(leads);
      
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assigned leads.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCallLead = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmailLead = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const startEdit = (lead: Lead) => {
    setEditingLead(lead.assignment_id);
    setEditValues({
      status: lead.assignment_status,
      loan_value: lead.loan_value ? lead.loan_value.toString() : '',
      partner_notes: lead.partner_notes || '',
      shared_notes: lead.shared_notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingLead(null);
    setEditValues({ status: '', loan_value: '', partner_notes: '', shared_notes: '' });
  };

  const saveChanges = async (lead: Lead) => {
    try {
      const updateData: any = {
        status: editValues.status
      };

      if (editValues.loan_value) {
        updateData.loan_value = parseInt(editValues.loan_value);
      }

      if (editValues.partner_notes) {
        updateData.partner_notes = editValues.partner_notes;
      }

      // Update lead assignment
      const { error } = await supabase
        .from('lead_assignments')
        .update(updateData)
        .eq('id', lead.assignment_id);

      if (error) throw error;

      // Update shared notes on quiz_responses (if changed)
      if (editValues.shared_notes !== lead.shared_notes) {
        const { error: notesError } = await supabase
          .from('quiz_responses')
          .update({ shared_notes: editValues.shared_notes })
          .eq('id', lead.id);

        if (notesError) {
          console.error('Error updating shared notes:', notesError);
          // Don't throw here to avoid blocking the main update
        }
      }

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });

      // Refresh the leads
      fetchAssignedLeads();
      setEditingLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'No Answer': return 'bg-gray-100 text-gray-800';
      case 'Wrong Number': return 'bg-red-100 text-red-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Application Sent': return 'bg-purple-100 text-purple-800';
      case 'Disqualified': return 'bg-red-100 text-red-800';
      case 'Loan Approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Assigned Leads</h2>
          <p className="text-muted-foreground">Leads that have been assigned to you based on your preferences</p>
        </div>
      </div>

      {assignedLeads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="text-6xl">🔒</div>
              <h3 className="text-xl font-semibold">No Leads Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete your payment to unlock access to qualified leads matching your criteria. 
                Once payment is processed, leads will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignedLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{lead.name}</h3>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ${(lead.loan_amount / 1000)}K Loan
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Monthly Revenue:</span>
                        <span>${(lead.monthly_revenue / 1000)}K</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Time in Business:</span>
                        <span>{lead.time_in_business}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Location:</span>
                        <span>{lead.city_province}, {lead.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Lead Date:</span>
                        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Lead Source:</span>
                        <Badge variant="outline" className="text-xs">
                          {lead.attribution_channel ? lead.attribution_channel.charAt(0).toUpperCase() + lead.attribution_channel.slice(1) : 'Direct'}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded-lg">
                      <span className="font-medium text-sm">Use of Funds:</span>
                      <p className="text-sm mt-1">{lead.use_of_funds}</p>
                    </div>

                    {/* Status and Loan Management */}
                    <div className="border-t pt-3 space-y-3">
                      {editingLead === lead.assignment_id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <Select value={editValues.status} onValueChange={(value) => 
                                setEditValues(prev => ({ ...prev, status: value }))
                              }>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {leadStatuses.map(status => (
                                    <SelectItem key={status} value={status}>
                                      <Badge className={getStatusBadgeColor(status)}>{status}</Badge>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Loan Value Offered</label>
                              <Input
                                type="number"
                                placeholder="Enter loan amount"
                                value={editValues.loan_value}
                                onChange={(e) => setEditValues(prev => ({ ...prev, loan_value: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Partner Notes</label>
                            <Textarea
                              placeholder="Add partner notes..."
                              value={editValues.partner_notes}
                              onChange={(e) => setEditValues(prev => ({ ...prev, partner_notes: e.target.value }))}
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Shared Notes</label>
                            <Textarea
                              placeholder="Add shared notes visible to all admins and partners..."
                              value={editValues.shared_notes}
                              onChange={(e) => setEditValues(prev => ({ ...prev, shared_notes: e.target.value }))}
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveChanges(lead)}>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Status:</span>
                              <Badge className={getStatusBadgeColor(lead.assignment_status)}>
                                {lead.assignment_status}
                              </Badge>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => startEdit(lead)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                          {lead.loan_value && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Loan Offered:</span>
                              <span className="text-sm text-green-600 font-medium">
                                ${lead.loan_value.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {lead.partner_notes && (
                            <div>
                              <span className="text-sm font-medium">Partner Notes:</span>
                              <p className="text-sm text-muted-foreground mt-1">{lead.partner_notes}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium">Notes:</span>
                            {lead.shared_notes ? (
                              <p className="text-sm text-muted-foreground mt-1">{lead.shared_notes}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-1 italic">No notes added yet</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-fit">
                    <Button
                      onClick={() => handleCallLead(lead.phone)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Lead
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEmailLead(lead.email)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Lead
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}