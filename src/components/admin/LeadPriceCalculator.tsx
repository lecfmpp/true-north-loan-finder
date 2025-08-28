import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScoringCriteria {
  monthlyRevenue: string;
  businessAge: string;
  creditScore: string;
}

interface ScoreBreakdown {
  monthlyRevenue: { points: number; label: string };
  businessAge: { points: number; label: string };
  creditScore: { points: number; label: string };
  total: number;
}

interface LeadStats {
  totalLeads: number;
  totalCost: number;
  costPerLead: number;
}

const LeadPriceCalculator = () => {
  const [selectedCriteria, setSelectedCriteria] = useState<ScoringCriteria>({
    monthlyRevenue: '',
    businessAge: '',
    creditScore: ''
  });
  
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown>({
    monthlyRevenue: { points: 0, label: '' },
    businessAge: { points: 0, label: '' },
    creditScore: { points: 0, label: '' },
    total: 0
  });

  const [leadStats, setLeadStats] = useState<LeadStats>({
    totalLeads: 0,
    totalCost: 0,
    costPerLead: 0
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Scoring configurations
  const monthlyRevenueOptions = [
    { value: '100000+', label: '$100K+', points: 40, tier: 'Excellent' },
    { value: '50000-99999', label: '$50K-$99K', points: 35, tier: 'Very Good' },
    { value: '25000-49999', label: '$25K-$49K', points: 30, tier: 'Good' },
    { value: '10000-24999', label: '$10K-$24K', points: 25, tier: 'Minimum Threshold' },
    { value: '0-9999', label: 'Below $10K', points: 0, tier: 'Not Qualified' }
  ];

  const businessAgeOptions = [
    { value: '5+', label: '5+ years', points: 35, tier: 'Excellent stability' },
    { value: '3-5', label: '3-5 years', points: 30, tier: 'Very stable' },
    { value: '2-3', label: '2-3 years', points: 25, tier: 'Stable' },
    { value: '1-2', label: '1-2 years', points: 20, tier: 'Established' },
    { value: '6-12', label: '6-12 months', points: 15, tier: 'Minimum threshold' },
    { value: '0-6', label: 'Under 6 months', points: 0, tier: 'Not Qualified' }
  ];

  const creditScoreOptions = [
    { value: '750+', label: '750+', points: 25, tier: 'Excellent credit' },
    { value: '700-749', label: '700-749', points: 20, tier: 'Good credit' },
    { value: '650-699', label: '650-699', points: 15, tier: 'Fair credit' },
    { value: '600-649', label: '600-649', points: 10, tier: 'Minimum threshold' },
    { value: '0-599', label: 'Below 600', points: 0, tier: 'Not Qualified' }
  ];

  // Calculate score breakdown
  const calculateScore = (criteria: ScoringCriteria): ScoreBreakdown => {
    const revenueOption = monthlyRevenueOptions.find(opt => opt.value === criteria.monthlyRevenue);
    const ageOption = businessAgeOptions.find(opt => opt.value === criteria.businessAge);
    const creditOption = creditScoreOptions.find(opt => opt.value === criteria.creditScore);

    const breakdown: ScoreBreakdown = {
      monthlyRevenue: {
        points: revenueOption?.points || 0,
        label: revenueOption ? `${revenueOption.label} (${revenueOption.tier})` : ''
      },
      businessAge: {
        points: ageOption?.points || 0,
        label: ageOption ? `${ageOption.label} (${ageOption.tier})` : ''
      },
      creditScore: {
        points: creditOption?.points || 0,
        label: creditOption ? `${creditOption.label} (${creditOption.tier})` : ''
      },
      total: 0
    };

    breakdown.total = breakdown.monthlyRevenue.points + breakdown.businessAge.points + breakdown.creditScore.points;
    return breakdown;
  };

  // Fetch lead stats based on criteria
  const fetchLeadStats = async (criteria: ScoringCriteria) => {
    if (!criteria.monthlyRevenue && !criteria.businessAge && !criteria.creditScore) {
      setLeadStats({ totalLeads: 0, totalCost: 0, costPerLead: 0 });
      return;
    }

    setLoading(true);
    try {
      let query = supabase.from('quiz_responses').select('*', { count: 'exact' });

      // Apply filters based on selected criteria
      if (criteria.monthlyRevenue) {
        const revenueRange = criteria.monthlyRevenue;
        if (revenueRange === '100000+') {
          query = query.gte('monthly_revenue', 100000);
        } else if (revenueRange === '50000-99999') {
          query = query.gte('monthly_revenue', 50000).lt('monthly_revenue', 100000);
        } else if (revenueRange === '25000-49999') {
          query = query.gte('monthly_revenue', 25000).lt('monthly_revenue', 50000);
        } else if (revenueRange === '10000-24999') {
          query = query.gte('monthly_revenue', 10000).lt('monthly_revenue', 25000);
        } else if (revenueRange === '0-9999') {
          query = query.lt('monthly_revenue', 10000);
        }
      }

      if (criteria.businessAge) {
        const ageMapping: Record<string, string[]> = {
          '5+': ['5+', '+5'],
          '3-5': ['3-5'],
          '2-3': ['2-3'],
          '1-2': ['1-2'],
          '6-12': ['6-12'],
          '0-6': ['0-6', 'less-than-6-months']
        };
        const mappedValues = ageMapping[criteria.businessAge] || [criteria.businessAge];
        query = query.in('time_in_business', mappedValues);
      }

      if (criteria.creditScore) {
        const creditMapping: Record<string, string[]> = {
          '750+': ['excellent'],
          '700-749': ['good'],
          '650-699': ['fair'],
          '600-649': ['poor'],
          '0-599': ['very-poor', 'unsure']
        };
        const mappedValues = creditMapping[criteria.creditScore];
        if (mappedValues) {
          query = query.in('credit_score', mappedValues);
        }
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Get ad spend data for cost calculation
      const { data: adSpendData, error: adSpendError } = await supabase
        .from('ad_spend_records')
        .select('amount');

      if (adSpendError) throw adSpendError;

      const totalCost = adSpendData?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
      const totalLeads = count || 0;
      const costPerLead = totalLeads > 0 ? totalCost / totalLeads : 0;

      setLeadStats({
        totalLeads,
        totalCost,
        costPerLead
      });

    } catch (error) {
      console.error('Error fetching lead stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lead statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle criteria change
  const handleCriteriaChange = (field: keyof ScoringCriteria, value: string) => {
    const newCriteria = { ...selectedCriteria, [field]: value };
    setSelectedCriteria(newCriteria);
    setScoreBreakdown(calculateScore(newCriteria));
    fetchLeadStats(newCriteria);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCriteria({ monthlyRevenue: '', businessAge: '', creditScore: '' });
    setScoreBreakdown({ monthlyRevenue: { points: 0, label: '' }, businessAge: { points: 0, label: '' }, creditScore: { points: 0, label: '' }, total: 0 });
    setLeadStats({ totalLeads: 0, totalCost: 0, costPerLead: 0 });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreTier = (score: number) => {
    if (score >= 80) return 'Premium';
    if (score >= 60) return 'High Quality';
    if (score >= 40) return 'Medium Quality';
    return 'Low Quality';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Lead Price Calculator</h2>
        </div>
        <Button onClick={resetFilters} variant="outline">
          Reset Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criteria Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Profile Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Monthly Revenue */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Monthly Revenue (40 points max)
              </label>
              <Select
                value={selectedCriteria.monthlyRevenue}
                onValueChange={(value) => handleCriteriaChange('monthlyRevenue', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select monthly revenue range" />
                </SelectTrigger>
                <SelectContent>
                  {monthlyRevenueOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {option.points} pts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Business Age */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Business Age (35 points max)
              </label>
              <Select
                value={selectedCriteria.businessAge}
                onValueChange={(value) => handleCriteriaChange('businessAge', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business age" />
                </SelectTrigger>
                <SelectContent>
                  {businessAgeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {option.points} pts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Credit Score */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Credit Score (25 points max)
              </label>
              <Select
                value={selectedCriteria.creditScore}
                onValueChange={(value) => handleCriteriaChange('creditScore', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select credit score range" />
                </SelectTrigger>
                <SelectContent>
                  {creditScoreOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {option.points} pts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Score Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scoreBreakdown.monthlyRevenue.label && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Monthly Revenue:</span>
                <div className="text-right">
                  <Badge variant="outline">{scoreBreakdown.monthlyRevenue.points} pts</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scoreBreakdown.monthlyRevenue.label}
                  </p>
                </div>
              </div>
            )}

            {scoreBreakdown.businessAge.label && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Business Age:</span>
                <div className="text-right">
                  <Badge variant="outline">{scoreBreakdown.businessAge.points} pts</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scoreBreakdown.businessAge.label}
                  </p>
                </div>
              </div>
            )}

            {scoreBreakdown.creditScore.label && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Credit Score:</span>
                <div className="text-right">
                  <Badge variant="outline">{scoreBreakdown.creditScore.points} pts</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scoreBreakdown.creditScore.label}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Score:</span>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${getScoreColor(scoreBreakdown.total)}`}>
                    {scoreBreakdown.total}/100
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {getScoreTier(scoreBreakdown.total)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Cost Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Calculating costs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold text-muted-foreground">Total Leads</h3>
                <p className="text-3xl font-bold text-primary">{leadStats.totalLeads.toLocaleString()}</p>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold text-muted-foreground">Total Cost</h3>
                <p className="text-3xl font-bold text-green-600">
                  ${(leadStats.totalCost / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold text-muted-foreground">Cost Per Lead</h3>
                <p className="text-3xl font-bold text-orange-600">
                  ${(leadStats.costPerLead / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {scoreBreakdown.total > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Pricing Recommendation
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Based on the selected criteria with a score of {scoreBreakdown.total}/100 ({getScoreTier(scoreBreakdown.total)}), 
                this lead profile represents {leadStats.totalLeads > 0 ? `${((leadStats.totalLeads / leadStats.totalLeads) * 100).toFixed(1)}%` : '0%'} of your total leads 
                with an average cost of ${(leadStats.costPerLead / 100).toFixed(2)} per lead.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadPriceCalculator;