import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, DollarSign, ShoppingCart, History, AlertCircle } from 'lucide-react';

interface PartnerCredit {
  id: string;
  available_credits: number;
  total_purchased: number;
  total_used: number;
  updated_at: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  leads_purchased: number;
  created_at: string;
}

interface CreditTransaction {
  id: string;
  transaction_type: string;
  credits_amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function PartnerPayments() {
  const [credits, setCredits] = useState<PartnerCredit | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPartnerData();
    }
  }, [user]);

  const fetchPartnerData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch partner credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('partner_lead_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (creditsError && creditsError.code !== 'PGRST116') throw creditsError;

      // Fetch payment records
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch credit transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('lead_credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;

      setCredits(creditsData);
      setPayments(paymentsData || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching partner data:', error);
      toast({
        title: "Error",
        description: "Failed to load your payment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseMoreLeads = async () => {
    try {
      setPurchaseLoading(true);

      const { data, error } = await supabase.functions.invoke('create-broker-payment');

      if (error) throw error;

      // Open Stripe checkout in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
        setPurchaseDialog(false);
        
        toast({
          title: "Redirecting to Payment",
          description: "You'll be redirected to complete your purchase"
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to create payment session",
        variant: "destructive"
      });
    } finally {
      setPurchaseLoading(false);
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

  const getAvailableCreditsBadge = (credits: number) => {
    if (credits < 0) {
      return (
        <span className="text-2xl font-bold text-red-600">
          {credits}
        </span>
      );
    } else if (credits === 0) {
      return (
        <span className="text-2xl font-bold text-gray-600">
          {credits}
        </span>
      );
    } else {
      return (
        <span className="text-2xl font-bold text-green-600">
          {credits}
        </span>
      );
    }
  };

  const isLowCredits = credits && credits.available_credits <= 5;
  const isNegativeCredits = credits && credits.available_credits < 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
      {/* Credit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={isNegativeCredits ? "border-red-200 bg-red-50" : isLowCredits ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Credits</p>
                {getAvailableCreditsBadge(credits?.available_credits || 0)}
                {isNegativeCredits && (
                  <p className="text-sm text-red-600 mt-1 font-medium">Negative balance - please purchase more credits</p>
                )}
                {isLowCredits && !isNegativeCredits && (
                  <p className="text-sm text-orange-600 mt-1">Low credits - consider purchasing more</p>
                )}
              </div>
              <CreditCard className={`h-8 w-8 ${isNegativeCredits ? 'text-red-600' : isLowCredits ? 'text-orange-600' : 'text-blue-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchased</p>
                <p className="text-2xl font-bold">{credits?.total_purchased || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Assigned</p>
                <p className="text-2xl font-bold">{credits?.total_used || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Based on lead assignments</p>
              </div>
              <History className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase More Credits */}
      {(isLowCredits || isNegativeCredits) && (
        <Card className={isNegativeCredits ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className={`h-6 w-6 ${isNegativeCredits ? 'text-red-600' : 'text-orange-600'}`} />
                <div>
                  <h3 className={`font-semibold ${isNegativeCredits ? 'text-red-900' : 'text-orange-900'}`}>
                    {isNegativeCredits ? 'Negative Credit Balance' : 'Running Low on Credits'}
                  </h3>
                  <p className={`text-sm ${isNegativeCredits ? 'text-red-700' : 'text-orange-700'}`}>
                    You have {credits?.available_credits || 0} credits remaining. 
                    {isNegativeCredits ? ' Your account is overdrawn. ' : ' '}
                    Purchase more to continue receiving leads.
                  </p>
                </div>
              </div>
              <Dialog open={purchaseDialog} onOpenChange={setPurchaseDialog}>
                <DialogTrigger asChild>
                  <Button className={isNegativeCredits ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}>
                    Buy More Credits
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Purchase Lead Credits</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Lead Credits Package</h4>
                      <p className="text-2xl font-bold">$500.00</p>
                      <p className="text-sm text-muted-foreground">Access to qualified leads for 7 days</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>• Get access to high-quality, pre-qualified leads</p>
                      <p>• Leads are assigned based on your preferences</p>
                      <p>• 7-day trial period with full access</p>
                    </div>
                    <Button 
                      onClick={handlePurchaseMoreLeads} 
                      className="w-full"
                      disabled={purchaseLoading}
                    >
                      {purchaseLoading ? 'Processing...' : 'Purchase Credits'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payment History</CardTitle>
            {!isLowCredits && (
              <Dialog open={purchaseDialog} onOpenChange={setPurchaseDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Buy More Credits
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Purchase Lead Credits</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Lead Credits Package</h4>
                      <p className="text-2xl font-bold">$500.00</p>
                      <p className="text-sm text-muted-foreground">Access to qualified leads for 7 days</p>
                    </div>
                    <Button 
                      onClick={handlePurchaseMoreLeads} 
                      className="w-full"
                      disabled={purchaseLoading}
                    >
                      {purchaseLoading ? 'Processing...' : 'Purchase Credits'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>{payment.leads_purchased}</TableCell>
                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payment history found</p>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
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
          ) : (
            <p className="text-center text-muted-foreground py-8">No transactions found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
