// Billing Management for Clients (Pay-per-lead model)
// Partners with commission-based structure are managed separately
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, DollarSign, Users, TrendingUp, Plus, Edit, Trash2, Receipt } from 'lucide-react';

interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  leads_purchased: number;
  created_at: string;
  metadata?: {
    payment_method?: string;
    description?: string;
    created_by?: string;
    [key: string]: any;
  } | null;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface PartnerCredit {
  id: string;
  user_id: string;
  available_credits: number;
  total_purchased: number;
  total_used: number;
  actual_assignments: number; // New field for actual lead assignments
  created_at: string;
  partners?: {
    name: string;
    email: string;
    company_name: string;
  } | null;
}

export default function BillingManagement() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [partnerCredits, setPartnerCredits] = useState<PartnerCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [manualPaymentDialog, setManualPaymentDialog] = useState(false);
  const [editPaymentDialog, setEditPaymentDialog] = useState(false);
  const [deletePaymentDialog, setDeletePaymentDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerCredit | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [selectedPaymentPartner, setSelectedPaymentPartner] = useState<string>('');
  const [leadsPurchased, setLeadsPurchased] = useState('');
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [editLeadsPurchased, setEditLeadsPurchased] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentDescription, setEditPaymentDescription] = useState('');
  const [isProcessingStripePayment, setIsProcessingStripePayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch payment records (including manual payments)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_records')
        .select('*')
        .in('payment_type', ['lead_credits', 'manual_payment'])
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch all client applications
      const { data: clientApplicationsData, error: clientError } = await supabase
        .from('lender_broker_applications')
        .select('*')
        .eq('application_type', 'client');

      // Fetch all partners from the partners table
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*');

      if (clientError) throw clientError;
      if (partnersError) throw partnersError;

      // Fetch partner credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('partner_lead_credits')
        .select('*')
        .order('updated_at', { ascending: false });

      if (creditsError) throw creditsError;

      // Fetch actual lead assignments for all partners
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('lead_assignments')
        .select(`
          partner_id,
          quiz_response_id,
          partners!inner (
            user_id,
            name,
            email,
            company_name
          )
        `);

      if (assignmentsError) throw assignmentsError;

      // Count assignments per partner user_id
      const assignmentCounts = (assignmentsData || []).reduce((acc, assignment) => {
        const userId = assignment.partners.user_id;
        acc[userId] = (acc[userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get all unique partners from both credits and assignments
      const allPartnerUserIds = new Set([
        ...(creditsData || []).map(c => c.user_id),
        ...Object.keys(assignmentCounts)
      ]);

      // Create comprehensive partner credits data
      const creditsWithPartners = Array.from(allPartnerUserIds).map(userId => {
        // Find existing credit record or create default
        const existingCredit = (creditsData || []).find(c => c.user_id === userId);
        const defaultCredit = {
          id: `default-${userId}`,
          user_id: userId,
          available_credits: 0,
          total_purchased: 0,
          total_used: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const credit = existingCredit || defaultCredit;
        
        // Find partner info from client applications first
        const client = (clientApplicationsData || []).find(c => c.user_id === userId);
        if (client) {
          return {
            ...credit,
            actual_assignments: assignmentCounts[userId] || 0,
            partners: {
              name: client.applicant_name,
              email: client.applicant_email,
              company_name: client.company_name
            }
          };
        }
        
        // Then try partners table
        const partner = (partnersData || []).find(p => p.user_id === userId);
        if (partner) {
          return {
            ...credit,
            actual_assignments: assignmentCounts[userId] || 0,
            partners: {
              name: partner.name,
              email: partner.email,
              company_name: partner.company_name
            }
          };
        }

        // If no partner info found but has assignments, try to get from assignments data
        const assignmentWithPartner = (assignmentsData || []).find(a => a.partners.user_id === userId);
        if (assignmentWithPartner) {
          return {
            ...credit,
            actual_assignments: assignmentCounts[userId] || 0,
            partners: {
              name: assignmentWithPartner.partners.name,
              email: assignmentWithPartner.partners.email,
              company_name: assignmentWithPartner.partners.company_name
            }
          };
        }

        return null; // Filter out partners without info
      }).filter(Boolean);

      // Filter out partners without valid info and sort by assignments desc
      const filteredCredits = creditsWithPartners
        .filter(credit => credit?.partners !== null)
        .sort((a, b) => (b?.actual_assignments || 0) - (a?.actual_assignments || 0));

      setPayments((paymentsData as any) || []);
      setPartnerCredits(filteredCredits as any);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAdjustment = async () => {
    if (!selectedPartner || !adjustmentAmount) return;

    try {
      const amount = parseInt(adjustmentAmount);
      if (isNaN(amount)) {
        toast({
          title: "Error",
          description: "Please enter a valid number",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.rpc('update_partner_credits', {
        p_user_id: selectedPartner.user_id,
        p_credit_change: amount,
        p_transaction_type: 'admin_adjustment',
        p_description: adjustmentReason || 'Admin credit adjustment'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Credit adjustment applied successfully"
      });

      setAdjustmentDialog(false);
      setSelectedPartner(null);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      fetchBillingData();
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast({
        title: "Error",
        description: "Failed to adjust credits",
        variant: "destructive"
      });
    }
  };

  const handleStripePayment = async () => {
    if (!selectedPaymentPartner || !leadsPurchased) {
      toast({
        title: "Error",
        description: "Please select a partner and enter number of leads",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessingStripePayment(true);
      
      const leadsCount = parseInt(leadsPurchased);
      if (isNaN(leadsCount) || leadsCount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid number of leads",
          variant: "destructive"
        });
        return;
      }

      // Find the selected partner
      const partner = partnerCredits.find(p => p.id === selectedPaymentPartner);
      if (!partner) {
        toast({
          title: "Error",
          description: "Selected partner not found",
          variant: "destructive"
        });
        return;
      }

      // Call the create-partner-payment edge function
      const { data, error } = await supabase.functions.invoke('create-partner-payment', {
        body: {
          leadPackageCount: leadsCount,
          partnerId: partner.user_id // Use user_id for the partner payment function
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Stripe Checkout Opened",
          description: "Complete the payment in the new tab to add credits to the partner's account"
        });

        // Reset form and close dialog
        setManualPaymentDialog(false);
        setPaymentAmount('');
        setPaymentMethod('');
        setPaymentDescription('');
        setSelectedPaymentPartner('');
        setLeadsPurchased('');
        
        // Refresh data after a short delay to potentially catch the payment
        setTimeout(() => {
          fetchBillingData();
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating Stripe payment:', error);
      toast({
        title: "Error",
        description: "Failed to create Stripe payment session",
        variant: "destructive"
      });
    } finally {
      setIsProcessingStripePayment(false);
    }
  };

  const handleManualPayment = async () => {
    if (paymentMethod === 'stripe') {
      await handleStripePayment();
      return;
    }

    if (!paymentAmount || !paymentMethod || !selectedPaymentPartner || !leadsPurchased) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const amount = parseFloat(paymentAmount);
      const leadsCount = parseInt(leadsPurchased);
      
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive"
        });
        return;
      }

      if (isNaN(leadsCount) || leadsCount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid number of leads",
          variant: "destructive"
        });
        return;
      }

      // Convert to cents for storage
      const amountInCents = Math.round(amount * 100);

      // Find the selected partner to get their details
      const partner = partnerCredits.find(p => p.id === selectedPaymentPartner);
      if (!partner) {
        toast({
          title: "Error",
          description: "Selected partner not found",
          variant: "destructive"
        });
        return;
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          user_id: partner.user_id,
          amount: amountInCents,
          currency: 'usd',
          status: 'completed',
          payment_type: 'manual_payment',
          leads_purchased: leadsCount,
          metadata: {
            payment_method: paymentMethod,
            description: paymentDescription || `Manual ${paymentMethod} payment`,
            created_by: 'admin'
          }
        });

      if (paymentError) throw paymentError;

      // Also add credits to the partner's account
      const { error: creditError } = await supabase.rpc('update_partner_credits', {
        p_user_id: partner.user_id,
        p_credit_change: leadsCount,
        p_transaction_type: 'purchase',
        p_description: `Manual payment - ${leadsCount} leads purchased via ${paymentMethod}`
      });

      if (creditError) throw creditError;

      toast({
        title: "Success",
        description: `Manual payment record created and ${leadsCount} credits added successfully`
      });

      // Reset form and close dialog
      setManualPaymentDialog(false);
      setPaymentAmount('');
      setPaymentMethod('');
      setPaymentDescription('');
      setSelectedPaymentPartner('');
      setLeadsPurchased('');
      fetchBillingData();
    } catch (error) {
      console.error('Error creating manual payment:', error);
      toast({
        title: "Error",
        description: "Failed to create manual payment record",
        variant: "destructive"
      });
    }
  };

  const handleEditPayment = async () => {
    if (!selectedPayment || !editPaymentAmount || !editPaymentStatus || !editLeadsPurchased || !editPaymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const amount = parseFloat(editPaymentAmount);
      const leadsCount = parseInt(editLeadsPurchased);
      
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive"
        });
        return;
      }

      if (isNaN(leadsCount) || leadsCount < 0) {
        toast({
          title: "Error",
          description: "Please enter a valid number of leads",
          variant: "destructive"
        });
        return;
      }

      const amountInCents = Math.round(amount * 100);

      const { error } = await supabase
        .from('payment_records')
        .update({
          amount: amountInCents,
          status: editPaymentStatus,
          leads_purchased: leadsCount,
          metadata: {
            ...selectedPayment.metadata,
            payment_method: editPaymentMethod,
            description: editPaymentDescription || selectedPayment.metadata?.description
          }
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment record updated successfully"
      });

      setEditPaymentDialog(false);
      setSelectedPayment(null);
      setEditPaymentAmount('');
      setEditPaymentStatus('');
      setEditLeadsPurchased('');
      setEditPaymentMethod('');
      setEditPaymentDescription('');
      fetchBillingData();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to update payment record",
        variant: "destructive"
      });
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      console.log('Attempting to delete payment:', selectedPayment.id);
      console.log('Current user auth:', await supabase.auth.getUser());
      
      const { data, error, count } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', selectedPayment.id)
        .select('*'); // Return the deleted record

      console.log('Delete response:', { data, error, count });

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No record was deleted - check permissions');
      }

      console.log('Payment deleted successfully:', data);

      // Optimistically update UI immediately
      setPayments(prev => {
        const updated = prev.filter(p => p.id !== selectedPayment.id);
        console.log('Updated payments list length:', updated.length);
        return updated;
      });

      toast({
        title: "Success",
        description: "Payment record deleted successfully"
      });

      setDeletePaymentDialog(false);
      setSelectedPayment(null);

      // Refresh data to ensure totals and related info are accurate
      setTimeout(() => {
        fetchBillingData();
      }, 100);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error", 
        description: `Failed to delete payment record: ${error.message || error}`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getAvailableCreditsBadge = (credits: number) => {
    if (credits < 0) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          {credits}
        </Badge>
      );
    } else if (credits === 0) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">
          {credits}
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          {credits}
        </Badge>
      );
    }
  };

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const totalCreditsIssued = partnerCredits.reduce((sum, p) => sum + p.total_purchased, 0);
  const totalCreditsUsed = partnerCredits.reduce((sum, p) => sum + p.total_used, 0);
  const activePartners = partnerCredits.filter(p => p.available_credits > 0).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Partners</p>
                <p className="text-2xl font-bold">{activePartners}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credits Issued</p>
                <p className="text-2xl font-bold">{totalCreditsIssued}</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Assigned</p>
                <p className="text-2xl font-bold">{totalCreditsUsed}</p>
                <p className="text-xs text-muted-foreground mt-1">Based on lead assignments</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        {['overview', 'payments', 'credits'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`pb-2 px-1 capitalize ${
              selectedTab === tab
                ? 'border-b-2 border-primary text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'payments' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payment Records</CardTitle>
              <Dialog open={manualPaymentDialog} onOpenChange={setManualPaymentDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Receipt className="h-4 w-4 mr-2" />
                    Add Manual Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Manual Payment Record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Partner</Label>
                      <Select
                        value={selectedPaymentPartner}
                        onValueChange={setSelectedPaymentPartner}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a partner" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {partnerCredits.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.partners?.name || 'Unknown Partner'} - {partner.partners?.company_name || 'No Company'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                     <div>
                       <Label>Payment Method</Label>
                       <Select
                         value={paymentMethod}
                         onValueChange={setPaymentMethod}
                       >
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select payment method" />
                         </SelectTrigger>
                         <SelectContent className="bg-background border shadow-lg z-50">
                           <SelectItem value="stripe">Stripe (Credit Card)</SelectItem>
                           <SelectItem value="etransfer">E-Transfer</SelectItem>
                           <SelectItem value="cash">Cash</SelectItem>
                           <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                           <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                           <SelectItem value="check">Check</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     {paymentMethod !== 'stripe' && (
                       <div>
                         <Label>Amount ($)</Label>
                         <Input
                           type="number"
                           step="0.01"
                           placeholder="Enter payment amount"
                           value={paymentAmount}
                           onChange={(e) => setPaymentAmount(e.target.value)}
                         />
                       </div>
                     )}
                    <div>
                      <Label>Number of Leads</Label>
                      <Input
                        type="number"
                        placeholder="Enter number of leads being purchased"
                        value={leadsPurchased}
                        onChange={(e) => setLeadsPurchased(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Description (Optional)</Label>
                      <Textarea
                        placeholder="Additional payment details"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                      />
                    </div>
                     <Button 
                       onClick={handleManualPayment} 
                       className="w-full"
                       disabled={isProcessingStripePayment}
                     >
                       {isProcessingStripePayment 
                         ? "Creating Stripe Session..." 
                         : paymentMethod === 'stripe' 
                           ? "Create Stripe Checkout" 
                           : "Create Payment Record"
                       }
                     </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Partner</TableHead>
                   <TableHead>Amount</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Type</TableHead>
                   <TableHead>Credits</TableHead>
                   <TableHead>Date</TableHead>
                   <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {payments.map((payment) => {
                   // Try to find partner info from our existing data
                   const partnerInfo = partnerCredits.find(p => p.user_id === payment.user_id);
                   const displayName = partnerInfo?.partners?.name || payment.user_id;
                   const paymentMethodDisplay = payment.metadata?.payment_method 
                     ? `${payment.payment_type} (${payment.metadata.payment_method})`
                     : payment.payment_type;
                   
                     return (
                       <TableRow key={payment.id}>
                         <TableCell>{displayName}</TableCell>
                         <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                         <TableCell>{getStatusBadge(payment.status)}</TableCell>
                         <TableCell className="capitalize">{paymentMethodDisplay}</TableCell>
                         <TableCell>{payment.leads_purchased}</TableCell>
                         <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                         <TableCell>
                           <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setEditPaymentAmount((payment.amount / 100).toString());
                                  setEditPaymentStatus(payment.status);
                                  setEditLeadsPurchased(payment.leads_purchased.toString());
                                  setEditPaymentMethod(payment.metadata?.payment_method || '');
                                  setEditPaymentDescription(payment.metadata?.description || '');
                                  setEditPaymentDialog(true);
                                }}
                              >
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button
                               size="sm"
                               variant="destructive"
                               onClick={() => {
                                 setSelectedPayment(payment);
                                 setDeletePaymentDialog(true);
                               }}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     );
                 })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'credits' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Partner Credits</CardTitle>
              <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adjust Credits
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adjust Partner Credits</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Partner</Label>
                      <Select
                        value={selectedPartner?.id || ''}
                        onValueChange={(value) => {
                          const partner = partnerCredits.find(p => p.id === value);
                          setSelectedPartner(partner || null);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a partner" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {partnerCredits.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.partners?.name || 'Unknown Partner'} - {partner.partners?.company_name || 'No Company'} ({partner.available_credits} credits)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Credit Adjustment</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount (positive to add, negative to subtract)"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Textarea
                        placeholder="Reason for adjustment"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreditAdjustment} className="w-full">
                      Apply Adjustment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Available Credits</TableHead>
                  <TableHead>Purchased</TableHead>
                  <TableHead>Credit Assignments</TableHead>
                  <TableHead>Actual Assignments</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerCredits.map((credit) => {
                  const balance = credit.total_purchased - credit.actual_assignments;
                  const utilizationRate = credit.total_purchased > 0 
                    ? ((credit.actual_assignments / credit.total_purchased) * 100).toFixed(1)
                    : credit.actual_assignments > 0 ? '∞' : '0';
                  
                  const getBalanceBadge = (balance: number) => {
                    if (balance < 0) {
                      return (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                          {balance}
                        </Badge>
                      );
                    } else if (balance === 0) {
                      return (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">
                          {balance}
                        </Badge>
                      );
                    } else {
                      return (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          +{balance}
                        </Badge>
                      );
                    }
                  };
                  
                  return (
                    <TableRow key={credit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{credit.partners?.name || 'Unknown Partner'}</div>
                          <div className="text-sm text-muted-foreground">{credit.partners?.company_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAvailableCreditsBadge(credit.available_credits)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {credit.total_purchased}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {credit.total_used}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {credit.actual_assignments}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getBalanceBadge(balance)}
                        {balance < 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            Owes {Math.abs(balance)} credits
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPartner(credit);
                            setAdjustmentDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
         </Card>
       )}
       
       {/* Edit Payment Dialog */}
       <Dialog open={editPaymentDialog} onOpenChange={setEditPaymentDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Payment Record</DialogTitle>
           </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editPaymentAmount}
                  onChange={(e) => setEditPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={editPaymentMethod}
                  onValueChange={setEditPaymentMethod}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="stripe">Stripe (Credit Card)</SelectItem>
                    <SelectItem value="etransfer">E-Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                    <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editPaymentStatus} onValueChange={setEditPaymentStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of Leads</Label>
                <Input
                  type="number"
                  value={editLeadsPurchased}
                  onChange={(e) => setEditLeadsPurchased(e.target.value)}
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Additional payment details"
                  value={editPaymentDescription}
                  onChange={(e) => setEditPaymentDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleEditPayment} className="w-full">
                Update Payment Record
              </Button>
            </div>
         </DialogContent>
       </Dialog>

       {/* Delete Payment Dialog */}
       <Dialog open={deletePaymentDialog} onOpenChange={setDeletePaymentDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Delete Payment Record</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p>Are you sure you want to delete this payment record? This action cannot be undone.</p>
             <div className="flex gap-2 justify-end">
               <Button variant="outline" onClick={() => setDeletePaymentDialog(false)}>
                 Cancel
               </Button>
               <Button variant="destructive" onClick={handleDeletePayment}>
                 Delete
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 }
