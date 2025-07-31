import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ShoppingCart 
} from "lucide-react";

interface PaymentInfo {
  payment_status: string;
  payment_amount: number;
  payment_deadline: string;
  created_at: string;
  status: string;
}

export default function PartnerPayments() {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPaymentInfo();
    }
  }, [user]);

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lender_broker_applications')
        .select('payment_status, payment_amount, payment_deadline, created_at, status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setPaymentInfo(data);
    } catch (error) {
      console.error('Error fetching payment info:', error);
      setPaymentInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Payment Pending
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Payment Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleBuyMoreLeads = () => {
    // TODO: Implement Stripe payment flow for additional leads
    toast({
      title: "Coming Soon",
      description: "Lead purchase feature will be available soon."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Payment Information</h2>
          <p className="text-muted-foreground">Your payment status and history</p>
        </div>

        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No payment information found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaymentPending = paymentInfo.payment_status === 'pending';
  const isPaymentExpired = paymentInfo.payment_status === 'expired';
  const isPaymentPaid = paymentInfo.payment_status === 'paid';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Information</h2>
        <p className="text-muted-foreground">Your payment status and lead access details</p>
      </div>

      {/* Payment Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Status:</span>
            {getPaymentStatusBadge(paymentInfo.payment_status)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Amount:</span>
              <span>${(paymentInfo.payment_amount / 100).toFixed(2)}</span>
            </div>
            
            {paymentInfo.payment_deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {isPaymentPaid ? 'Paid On:' : 'Due Date:'}
                </span>
                <span>{new Date(paymentInfo.payment_deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {isPaymentPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Payment Required</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please complete your payment to unlock access to qualified leads.
              </p>
            </div>
          )}

          {isPaymentExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Payment Expired</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                Your payment deadline has passed. Please contact support to renew access.
              </p>
            </div>
          )}

          {isPaymentPaid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Payment Confirmed</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Thank you! You now have access to qualified leads matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Access Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lead Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPaymentPaid ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">∞</div>
                  <div className="text-sm text-blue-600">Available Leads</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-green-600">Leads Contacted</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">Active</div>
                  <div className="text-sm text-purple-600">Access Status</div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button onClick={handleBuyMoreLeads} className="bg-blue-600 hover:bg-blue-700">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase Additional Leads
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Lead Access Locked</h3>
              <p className="text-muted-foreground mb-4">
                Complete your payment to unlock access to qualified business leads.
              </p>
              <p className="text-sm text-muted-foreground">
                Once payment is processed, you'll have immediate access to leads matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-medium">Initial Lead Access Payment</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(paymentInfo.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">${(paymentInfo.payment_amount / 100).toFixed(2)}</span>
                {getPaymentStatusBadge(paymentInfo.payment_status)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}