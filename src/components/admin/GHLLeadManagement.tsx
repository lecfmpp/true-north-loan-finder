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
  Mail
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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
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
        .not('assigned_partner_id', 'is', null)
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
    try {
      setSendingLeads(prev => new Set([...prev, leadId]));
      
      // Find the lead to get the assigned_partner_id
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      if (!lead.assigned_partner_id) {
        throw new Error('Lead has no assigned partner');
      }
      
      const { data, error } = await supabase.functions.invoke('send-lead-to-ghl', {
        body: {
          leadId,
          partnerId: lead.assigned_partner_id,
          createOpportunity: true,
          skipDuplicateCheck
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || 'Lead sent to GHL successfully');
        fetchLeads(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to send lead');
      }
    } catch (error) {
      console.error('Error sending lead to GHL:', error);
      toast.error(`Failed to send lead: ${error.message}`);
    } finally {
      setSendingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
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
                        </div>
                      </div>
                    </CardContent>
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