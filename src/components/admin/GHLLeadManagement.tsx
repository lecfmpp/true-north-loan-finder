import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  RefreshCw,
  User,
  Building,
  DollarSign,
  Phone,
  Mail,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  loan_amount: number;
  assigned_partner_id: string;
  ghl_contact_id: string;
  ghl_opportunity_id: string;
  status: string;
  conversion_status: string;
  created_at: string;
  updated_at: string;
}

const GHLLeadManagement = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingLeads, setSendingLeads] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'error'>('pending');
  const [selectedLeadLogs, setSelectedLeadLogs] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // First, get partner IDs that have active GHL integrations
      const { data: ghlIntegrations, error: ghlError } = await supabase
        .from('ghl_integrations')
        .select('partner_id')
        .eq('is_active', true);
      
      if (ghlError) throw ghlError;
      
      const activePartnerIds = ghlIntegrations?.map(integration => integration.partner_id) || [];
      
      if (activePartnerIds.length === 0) {
        setLeads([]);
        return;
      }

      let query = supabase
        .from('quiz_responses')
        .select(`
          id,
          name,
          email,
          phone,
          company_name,
          loan_amount,
          assigned_partner_id,
          ghl_contact_id,
          ghl_opportunity_id,
          status,
          conversion_status,
          created_at,
          updated_at
        `)
        .in('assigned_partner_id', activePartnerIds)
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filters
      if (filter === 'pending') {
        query = query.is('ghl_contact_id', null);
      } else if (filter === 'sent') {
        query = query.not('ghl_contact_id', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const sendLeadToGHL = async (leadId: string, skipDuplicateCheck = false) => {
    const operation = skipDuplicateCheck ? 'Creating Opportunity' : 'Sending Lead to GHL';
    console.log(`🚀 ${operation} started for lead:`, leadId);
    
    try {
      setSendingLeads(prev => new Set([...prev, leadId]));
      
      // Find the lead to get the assigned_partner_id
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      console.log('📋 Lead details:', {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        partnerId: lead.assigned_partner_id,
        hasContact: !!lead.ghl_contact_id,
        hasOpportunity: !!lead.ghl_opportunity_id
      });
      
      if (!lead.assigned_partner_id) {
        throw new Error('Lead has no assigned partner');
      }
      
      const payload = {
        leadId,
        partnerId: lead.assigned_partner_id,
        createOpportunity: true,
        skipDuplicateCheck
      };
      
      console.log('📤 Sending to GHL with payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('send-lead-to-ghl', {
        body: payload
      });

      console.log('📥 GHL Response:', { data, error });

      if (error) throw error;

      if (data.success) {
        console.log('✅ Success:', data);
        toast.success(data.message || 'Lead sent to GHL successfully');
        fetchLeads(); // Refresh the list
      } else {
        console.log('❌ Operation failed:', data);
        throw new Error(data.error || 'Failed to send lead');
      }
    } catch (error) {
      console.error('💥 Error sending lead to GHL:', error);
      toast.error(`Failed to send lead: ${error.message}`);
    } finally {
      setSendingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
      console.log(`🏁 ${operation} completed for lead:`, leadId);
    }
  };

  const fetchActivityLogs = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('ghl_activity_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error('Failed to fetch activity logs');
    }
  };

  const toggleLeadLogs = async (leadId: string) => {
    if (selectedLeadLogs === leadId) {
      setSelectedLeadLogs(null);
      setActivityLogs([]);
    } else {
      setSelectedLeadLogs(leadId);
      await fetchActivityLogs(leadId);
    }
  };

  const debugGHLIntegration = async (leadId: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead || !lead.assigned_partner_id) {
        throw new Error('Lead not found or no assigned partner');
      }

      console.log('🔍 Starting GHL integration debug for partner:', lead.assigned_partner_id);

      const { data, error } = await supabase.functions.invoke('debug-ghl-integration', {
        body: { partnerId: lead.assigned_partner_id }
      });

      if (error) throw error;

      console.log('🔧 GHL Integration Debug Results:', data);
      
      if (data.success) {
        toast.success('Debug completed - check console for detailed results');
      } else {
        toast.error(`Debug failed: ${data.error}`);
      }
    } catch (error) {
      console.error('💥 Debug error:', error);
      toast.error(`Debug failed: ${error.message}`);
    }
  };

  const getLeadStatus = (lead: Lead) => {
    if (lead.ghl_contact_id && lead.ghl_opportunity_id) {
      return { status: 'complete', label: 'Contact & Opportunity', color: 'bg-green-500' };
    } else if (lead.ghl_contact_id) {
      return { status: 'partial', label: 'Contact Only', color: 'bg-yellow-500' };
    } else {
      return { status: 'pending', label: 'Pending', color: 'bg-gray-500' };
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !lead.ghl_contact_id;
    if (filter === 'sent') return lead.ghl_contact_id;
    return false;
  });

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              GHL Lead Management
            </span>
            <Button
              onClick={fetchLeads}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Send assigned leads to GoHighLevel (GHL) to create contacts and opportunities.
              This will sync lead information with your partners' GHL systems.
            </AlertDescription>
          </Alert>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {['all', 'pending', 'sent'].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption as any)}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                <Badge className="ml-2" variant="secondary">
                  {filterOption === 'all' 
                    ? leads.length 
                    : filterOption === 'pending'
                    ? leads.filter(l => !l.ghl_contact_id).length
                    : leads.filter(l => l.ghl_contact_id).length
                  }
                </Badge>
              </Button>
            ))}
          </div>

          {/* Leads List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No leads found for the selected filter.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const leadStatus = getLeadStatus(lead);
                const isSending = sendingLeads.has(lead.id);
                
                return (
                  <Card key={lead.id} className="border-l-4" style={{borderLeftColor: leadStatus.color}}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{lead.name}</span>
                            </div>
                            <Badge className={leadStatus.color + " text-white"}>
                              {leadStatus.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>{lead.company_name || 'No company'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${lead.loan_amount?.toLocaleString() || 'No amount'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>

                          {(lead.ghl_contact_id || lead.ghl_opportunity_id) && (
                            <div className="flex gap-4 text-sm">
                              {lead.ghl_contact_id && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Contact: {lead.ghl_contact_id.substring(0, 8)}...</span>
                                </div>
                              )}
                              {lead.ghl_opportunity_id && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <ExternalLink className="h-4 w-4" />
                                  <span>Opportunity: {lead.ghl_opportunity_id.substring(0, 8)}...</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {!lead.ghl_contact_id && (
                            <Button
                              onClick={() => sendLeadToGHL(lead.id)}
                              disabled={isSending}
                              size="sm"
                            >
                              {isSending ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send to GHL
                                </>
                              )}
                            </Button>
                          )}
                          
                          {lead.ghl_contact_id && !lead.ghl_opportunity_id && (
                            <Button
                              onClick={() => sendLeadToGHL(lead.id, true)}
                              disabled={isSending}
                              variant="outline"
                              size="sm"
                            >
                              {isSending ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Create Opportunity
                                </>
                              )}
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => toggleLeadLogs(lead.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <History className="h-4 w-4 mr-2" />
                            Activity
                            {selectedLeadLogs === lead.id ? 
                              <ChevronUp className="h-4 w-4 ml-1" /> : 
                              <ChevronDown className="h-4 w-4 ml-1" />
                            }
                          </Button>
                          
                          {/* Debug button for leads with opportunities */}
                          {(lead.ghl_contact_id || lead.ghl_opportunity_id) && (
                            <Button
                              onClick={() => debugGHLIntegration(lead.id)}
                              variant="secondary"
                              size="sm"
                            >
                              🔍 Debug GHL
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Activity Logs Section */}
                    {selectedLeadLogs === lead.id && (
                      <CardContent className="pt-0 border-t">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground">GHL Activity Log</h4>
                          {activityLogs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {activityLogs.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                  <div className={`w-2 h-2 rounded-full mt-2 ${
                                    log.status === 'success' ? 'bg-green-500' :
                                    log.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium capitalize">
                                        {log.activity_type.replace('_', ' ')}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(log.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    {log.error_message && (
                                      <p className="text-sm text-red-600">{log.error_message}</p>
                                    )}
                                    {log.ghl_contact_id && (
                                      <p className="text-xs text-muted-foreground">
                                        Contact ID: {log.ghl_contact_id}
                                      </p>
                                    )}
                                    {log.ghl_opportunity_id && (
                                      <p className="text-xs text-muted-foreground">
                                        Opportunity ID: {log.ghl_opportunity_id}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GHLLeadManagement;