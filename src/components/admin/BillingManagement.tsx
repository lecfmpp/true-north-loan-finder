import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, DollarSign, Users, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';

interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  leads_purchased: number;
  created_at: string;
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
  created_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  credits_amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
}

export default function BillingManagement() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [partnerCredits, setPartnerCredits] = useState<PartnerCredit[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerCredit | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch payment records
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_records')
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch partner credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('partner_lead_credits')
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .order('created_at', { ascending: false });

      if (creditsError) throw creditsError;

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('lead_credit_transactions')
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      setPayments((paymentsData as any) || []);
      setPartnerCredits((creditsData as any) || []);
      setTransactions((transactionsData as any) || []);
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

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      purchase: 'default',
      usage: 'destructive',
      admin_adjustment: 'secondary',
      refund: 'outline'
    } as const;
    
    return <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>{type}</Badge>;
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
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="text-2xl font-bold">{totalCreditsUsed}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        {['overview', 'payments', 'credits', 'transactions'].map((tab) => (
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
            <CardTitle>Payment Records</CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.profiles?.display_name || 'Unknown'}</TableCell>
                    <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="capitalize">{payment.payment_type}</TableCell>
                    <TableCell>{payment.leads_purchased}</TableCell>
                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
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
                      <select
                        className="w-full mt-1 p-2 border rounded-md"
                        value={selectedPartner?.id || ''}
                        onChange={(e) => {
                          const partner = partnerCredits.find(p => p.id === e.target.value);
                          setSelectedPartner(partner || null);
                        }}
                      >
                        <option value="">Select a partner</option>
                        {partnerCredits.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.profiles?.display_name || 'Unknown'} ({partner.available_credits} credits)
                          </option>
                        ))}
                      </select>
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
                  <TableHead>Available</TableHead>
                  <TableHead>Total Purchased</TableHead>
                  <TableHead>Total Used</TableHead>
                  <TableHead>Utilization Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerCredits.map((credit) => {
                  const utilizationRate = credit.total_purchased > 0 
                    ? ((credit.total_used / credit.total_purchased) * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <TableRow key={credit.id}>
                      <TableCell>{credit.profiles?.display_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={credit.available_credits > 0 ? 'default' : 'secondary'}>
                          {credit.available_credits}
                        </Badge>
                      </TableCell>
                      <TableCell>{credit.total_purchased}</TableCell>
                      <TableCell>{credit.total_used}</TableCell>
                      <TableCell>{utilizationRate}%</TableCell>
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

      {selectedTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.profiles?.display_name || 'Unknown'}</TableCell>
                    <TableCell>{getTransactionTypeBadge(transaction.transaction_type)}</TableCell>
                    <TableCell>
                      <span className={transaction.credits_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.balance_after}</TableCell>
                    <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                    <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}