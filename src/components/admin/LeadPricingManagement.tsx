import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign, Save } from 'lucide-react';

interface TierPricing {
  id: string;
  tier_name: string;
  tier_description: string;
  base_price_min: number;
  base_price_max: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LeadPricingManagement() {
  const [tierPricing, setTierPricing] = useState<TierPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTierPricing();
  }, []);

  const fetchTierPricing = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_tier_pricing')
        .select('*')
        .eq('is_active', true)
        .order('tier_name');

      if (error) {
        console.error('Error fetching tier pricing:', error);
        toast({
          title: "Error",
          description: "Failed to fetch current tier pricing.",
          variant: "destructive"
        });
        return;
      }

      setTierPricing(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load tier pricing information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTierPrice = async (tierId: string, tierName: string, minPrice: string, maxPrice: string) => {
    const minPriceInCents = Math.round(parseFloat(minPrice) * 100);
    const maxPriceInCents = Math.round(parseFloat(maxPrice) * 100);
    
    if (isNaN(minPriceInCents) || isNaN(maxPriceInCents) || minPriceInCents <= 0 || maxPriceInCents <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter valid prices greater than $0.",
        variant: "destructive"
      });
      return;
    }

    if (minPriceInCents >= maxPriceInCents) {
      toast({
        title: "Invalid Price Range",
        description: "Maximum price must be higher than minimum price.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('lead_tier_pricing')
        .update({
          base_price_min: minPriceInCents,
          base_price_max: maxPriceInCents,
          updated_at: new Date().toISOString()
        })
        .eq('id', tierId);

      if (error) {
        throw error;
      }

      await fetchTierPricing();
      
      toast({
        title: "Tier Pricing Updated",
        description: `${tierName} tier pricing updated successfully.`,
      });

    } catch (error: any) {
      console.error('Error updating tier pricing:', error);
      toast({
        title: "Error",
        description: "Failed to update tier pricing. Please try again.",
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
          <span>Loading tier pricing information...</span>
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
            Tier-Based Lead Pricing Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">New Tier-Based Pricing Strategy:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Potential (0-44):</strong> Entry-level, high-volume tier for pipeline filling</li>
              <li>• <strong>Qualified (45-84):</strong> Core product with solid fundamentals and high application rate</li>
              <li>• <strong>Exceptional (85+):</strong> Premium tier with largest deal sizes and most stable businesses</li>
            </ul>
          </div>

          {tierPricing.map((tier) => (
            <TierPricingCard
              key={tier.id}
              tier={tier}
              onUpdate={updateTierPrice}
              saving={saving}
            />
          ))}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Pricing Strategy Notes:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• <strong>Potential:</strong> Optimize acquisition costs to $20-25, add margin on top</li>
              <li>• <strong>Qualified:</strong> 60-80% margin justified by high application rate (36.9%)</li>
              <li>• <strong>Exceptional:</strong> Premium pricing for prime borrowers with largest deal potential</li>
              <li>• All payments are processed in USD through Stripe</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TierPricingCardProps {
  tier: TierPricing;
  onUpdate: (tierId: string, tierName: string, minPrice: string, maxPrice: string) => void;
  saving: boolean;
}

function TierPricingCard({ tier, onUpdate, saving }: TierPricingCardProps) {
  const [minPrice, setMinPrice] = useState((tier.base_price_min / 100).toFixed(2));
  const [maxPrice, setMaxPrice] = useState((tier.base_price_max / 100).toFixed(2));

  const handleUpdate = () => {
    onUpdate(tier.id, tier.tier_name, minPrice, maxPrice);
  };

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'Exceptional':
        return 'border-green-200 bg-green-50';
      case 'Qualified':
        return 'border-blue-200 bg-blue-50';
      case 'Potential':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTierTextColor = (tierName: string) => {
    switch (tierName) {
      case 'Exceptional':
        return 'text-green-900';
      case 'Qualified':
        return 'text-blue-900';
      case 'Potential':
        return 'text-orange-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <Card className={getTierColor(tier.tier_name)}>
      <CardHeader>
        <CardTitle className={`text-lg ${getTierTextColor(tier.tier_name)}`}>
          {tier.tier_name} Tier
        </CardTitle>
        <p className="text-sm text-muted-foreground">{tier.tier_description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`minPrice-${tier.id}`}>Minimum Price (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id={`minPrice-${tier.id}`}
                type="number"
                step="0.01"
                min="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`maxPrice-${tier.id}`}>Maximum Price (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id={`maxPrice-${tier.id}`}
                type="number"
                step="0.01"
                min="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${getTierColor(tier.tier_name)}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Range:</span>
            <span className={`font-bold ${getTierTextColor(tier.tier_name)}`}>
              ${(tier.base_price_min / 100).toFixed(2)} - ${(tier.base_price_max / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-muted-foreground">Last Updated:</span>
            <span className="text-sm text-muted-foreground">
              {new Date(tier.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Button 
          onClick={handleUpdate}
          disabled={saving || !minPrice || !maxPrice || parseFloat(minPrice) <= 0 || parseFloat(maxPrice) <= 0}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update {tier.tier_name} Pricing
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}