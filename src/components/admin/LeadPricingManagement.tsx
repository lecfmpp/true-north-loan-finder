import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign, Save } from 'lucide-react';

interface LeadPricing {
  id: string;
  price_per_lead: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LeadPricingManagement() {
  const [pricing, setPricing] = useState<LeadPricing | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentPricing();
  }, []);

  const fetchCurrentPricing = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_pricing')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching pricing:', error);
        toast({
          title: "Error",
          description: "Failed to fetch current pricing.",
          variant: "destructive"
        });
        return;
      }

      setPricing(data);
      setNewPrice((data.price_per_lead / 100).toString()); // Convert cents to dollars
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePricing = async () => {
    if (!pricing) return;

    const priceInCents = Math.round(parseFloat(newPrice) * 100);
    
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than $0.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // Deactivate current pricing
      const { error: deactivateError } = await supabase
        .from('lead_pricing')
        .update({ is_active: false })
        .eq('id', pricing.id);

      if (deactivateError) {
        throw deactivateError;
      }

      // Create new pricing record
      const { data: newPricingData, error: createError } = await supabase
        .from('lead_pricing')
        .insert({
          price_per_lead: priceInCents,
          currency: 'usd',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setPricing(newPricingData);
      
      toast({
        title: "Pricing Updated",
        description: `Lead price updated to $${newPrice} USD.`,
      });

    } catch (error: any) {
      console.error('Error updating pricing:', error);
      toast({
        title: "Error",
        description: "Failed to update pricing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading pricing information...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lead Pricing Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {pricing && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Current Pricing</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price per Lead:</span>
                  <p className="font-semibold text-2xl text-primary">
                    ${(pricing.price_per_lead / 100).toFixed(2)} USD
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p className="font-medium">
                    {new Date(pricing.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="newPrice">Update Price per Lead (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="newPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="50.00"
                  className="pl-8"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the price in USD (e.g., 50.00 for $50 per lead)
              </p>
            </div>

            <Button 
              onClick={updatePricing}
              disabled={saving || !newPrice || parseFloat(newPrice) <= 0}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating Pricing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Lead Pricing
                </>
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This price applies to all new lead purchases by partners</li>
              <li>• Existing pending payments will use the old pricing</li>
              <li>• Partners will see the new price immediately after update</li>
              <li>• All payments are processed in USD through Stripe</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}