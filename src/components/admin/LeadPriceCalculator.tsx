import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calculator, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScoringCriteria {
  monthlyRevenue: string;
  businessAge: string;
  creditScore: string;
  country: string;
  applicationSubmitted: string;
  homeownerStatus: string;
  bankAccountType: string;
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
    creditScore: '',
    country: '',
    applicationSubmitted: '',
    homeownerStatus: '',
    bankAccountType: ''
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
  const [profitMargin, setProfitMargin] = useState<number>(50); // Default 50% margin
  const { toast } = useToast();

  // Scoring configurations
  const monthlyRevenueOptions = [
    { value: '20000+', label: 'Above $20K', points: 40, tier: 'Excellent' },
    { value: '10000-20000', label: '$10K to $20K', points: 25, tier: 'Good' },
    { value: '0-10000', label: 'Below $10K', points: 0, tier: 'Not Qualified' }
  ];

  const businessAgeOptions = [
    { value: '6+', label: '6+ months', points: 35, tier: 'Established business' }
  ];

  const creditScoreOptions = [
    { value: '600+', label: 'Above 600', points: 25, tier: 'Qualified credit' },
    { value: '0-599', label: 'Below 600', points: 0, tier: 'Not Qualified' }
  ];

  const countryOptions = [
    { label: 'United States', value: 'US' },
    { label: 'Canada', value: 'CA' }
  ];

  const applicationSubmittedOptions = [
    { label: 'Yes - Has Application', value: 'yes' },
    { label: 'No - No Application', value: 'no' }
  ];

  const homeownerStatusOptions = [
    { label: 'Own', value: 'own' },
    { label: 'Rent', value: 'rent' },
    { label: 'Other', value: 'other' }
  ];

  const bankAccountTypeOptions = [
    { label: 'Business', value: 'business' },
    { label: 'Personal', value: 'personal' }
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
    // Show all leads if no criteria selected
    const hasAnyCriteria = criteria.monthlyRevenue || criteria.businessAge || criteria.creditScore || criteria.country || criteria.applicationSubmitted || criteria.homeownerStatus || criteria.bankAccountType;

    setLoading(true);
    try {
      let query = supabase.from('quiz_responses').select('*', { count: 'exact' });

      // Apply filters based on selected criteria
      if (criteria.monthlyRevenue) {
        const revenueRange = criteria.monthlyRevenue;
        if (revenueRange === '20000+') {
          query = query.gte('monthly_revenue', 20000);
        } else if (revenueRange === '10000-20000') {
          query = query.gte('monthly_revenue', 10000).lt('monthly_revenue', 20000);
        } else if (revenueRange === '0-10000') {
          query = query.lt('monthly_revenue', 10000);
        }
      }

      if (criteria.businessAge) {
        const ageMapping: Record<string, string[]> = {
          '6+': ['6-12', '1-2', '2-3', '3-5', '5+', '+5'] // 6+ months (all established businesses)
        };
        const mappedValues = ageMapping[criteria.businessAge] || [criteria.businessAge];
        query = query.in('time_in_business', mappedValues);
      }

      if (criteria.creditScore) {
        const creditMapping: Record<string, string[]> = {
          '600+': ['excellent', 'good', 'fair', 'poor'], // Above 600
          '0-599': ['very-poor', 'unsure'] // Below 600
        };
        const mappedValues = creditMapping[criteria.creditScore];
        if (mappedValues) {
          query = query.in('credit_score', mappedValues);
        }
      }

      if (criteria.country) {
        query = query.eq('country', criteria.country);
      }

      if (criteria.applicationSubmitted) {
        if (criteria.applicationSubmitted === 'yes') {
          // Leads that submitted an application (USA or Canadian)
          query = query.eq('conversion_status', 'application_sent');
        } else if (criteria.applicationSubmitted === 'no') {
          // Leads without an application submitted
          query = query.neq('conversion_status', 'application_sent');
        }
      }

      if (criteria.homeownerStatus) {
        query = query.eq('homeowner_status', criteria.homeownerStatus);
      }

      if (criteria.bankAccountType) {
        query = query.eq('bank_account_type', criteria.bankAccountType);
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
    const processedValue = value === 'none' ? '' : value;
    const newCriteria = { ...selectedCriteria, [field]: processedValue };
    setSelectedCriteria(newCriteria);
    setScoreBreakdown(calculateScore(newCriteria));
    fetchLeadStats(newCriteria);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCriteria({ monthlyRevenue: '', businessAge: '', creditScore: '', country: '', applicationSubmitted: '', homeownerStatus: '', bankAccountType: '' });
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
                value={selectedCriteria.monthlyRevenue || 'none'}
                onValueChange={(value) => handleCriteriaChange('monthlyRevenue', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select monthly revenue range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No filter (ignore this criteria)</span>
                  </SelectItem>
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
                value={selectedCriteria.businessAge || 'none'}
                onValueChange={(value) => handleCriteriaChange('businessAge', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No filter (ignore this criteria)</span>
                  </SelectItem>
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
                value={selectedCriteria.creditScore || 'none'}
                onValueChange={(value) => handleCriteriaChange('creditScore', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select credit score range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No filter (ignore this criteria)</span>
                  </SelectItem>
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

            {/* Country */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Country
              </label>
              <Select
                value={selectedCriteria.country || 'none'}
                onValueChange={(value) => handleCriteriaChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No filter (ignore this criteria)</span>
                  </SelectItem>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Application Submitted */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Application Submitted
              </label>
              <Select
                value={selectedCriteria.applicationSubmitted || 'none'}
                onValueChange={(value) => handleCriteriaChange('applicationSubmitted', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select application status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No filter (ignore this criteria)</span>
                  </SelectItem>
                  {applicationSubmittedOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Homeowner Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Homeowner Status
              </label>
              <Select
                value={selectedCriteria.homeownerStatus || 'none'}
                onValueChange={(value) => handleCriteriaChange('homeownerStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select homeowner status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No filter (ignore this criteria)</span>
                  </SelectItem>
                  {homeownerStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bank Account Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Bank Account Type
              </label>
              <Select
                value={selectedCriteria.bankAccountType || 'none'}
                onValueChange={(value) => handleCriteriaChange('bankAccountType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No filter (ignore this criteria)</span>
                  </SelectItem>
                  {bankAccountTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lead Persona */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Lead Persona</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(selectedCriteria.monthlyRevenue || selectedCriteria.businessAge || selectedCriteria.creditScore || selectedCriteria.country || selectedCriteria.applicationSubmitted || selectedCriteria.homeownerStatus || selectedCriteria.bankAccountType) ? (
              <div className="space-y-6">
                {/* Persona Avatar & Overview */}
                <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                  <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {scoreBreakdown.total > 0 ? scoreBreakdown.total : '?'}
                    </span>
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${getScoreColor(scoreBreakdown.total)}`}>
                    {getScoreTier(scoreBreakdown.total)} Lead
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Total Score: {scoreBreakdown.total}/{(() => {
                      let maxScore = 0;
                      if (selectedCriteria.monthlyRevenue) maxScore += 40;
                      if (selectedCriteria.businessAge) maxScore += 35;
                      if (selectedCriteria.creditScore) maxScore += 25;
                      return maxScore || 100;
                    })()} points
                  </p>
                </div>

                {/* Persona Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scoreBreakdown.monthlyRevenue.label && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Revenue Profile</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{scoreBreakdown.monthlyRevenue.label}</span>
                        <Badge variant="outline">{scoreBreakdown.monthlyRevenue.points} pts</Badge>
                      </div>
                    </div>
                  )}

                  {scoreBreakdown.businessAge.label && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Business Maturity</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{scoreBreakdown.businessAge.label}</span>
                        <Badge variant="outline">{scoreBreakdown.businessAge.points} pts</Badge>
                      </div>
                    </div>
                  )}

                  {scoreBreakdown.creditScore.label && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Credit Profile</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{scoreBreakdown.creditScore.label}</span>
                        <Badge variant="outline">{scoreBreakdown.creditScore.points} pts</Badge>
                      </div>
                    </div>
                  )}

                  {selectedCriteria.country && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Market</div>
                      <div className="text-sm">
                        {countryOptions.find(opt => opt.value === selectedCriteria.country)?.label || 'Unknown'}
                      </div>
                    </div>
                  )}

                  {selectedCriteria.applicationSubmitted && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Application Status</div>
                      <div className="text-sm">
                        {applicationSubmittedOptions.find(opt => opt.value === selectedCriteria.applicationSubmitted)?.label || 'Unknown'}
                      </div>
                    </div>
                  )}

                  {selectedCriteria.homeownerStatus && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Property Status</div>
                      <div className="text-sm">
                        {homeownerStatusOptions.find(opt => opt.value === selectedCriteria.homeownerStatus)?.label || 'Unknown'}
                      </div>
                    </div>
                  )}

                  {selectedCriteria.bankAccountType && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Banking</div>
                      <div className="text-sm">
                        {bankAccountTypeOptions.find(opt => opt.value === selectedCriteria.bankAccountType)?.label || 'Unknown'} Account
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Persona Summary
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    This persona represents a {getScoreTier(scoreBreakdown.total).toLowerCase()} lead profile based on the selected criteria. 
                    {scoreBreakdown.total >= 60 ? ' This is a strong candidate for premium pricing.' : 
                     scoreBreakdown.total >= 40 ? ' This represents a moderate-quality lead.' : 
                     ' This may require additional qualification or lower pricing.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select criteria to build a lead persona</p>
              </div>
            )}
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

          {(selectedCriteria.monthlyRevenue || selectedCriteria.businessAge || selectedCriteria.creditScore || selectedCriteria.country || selectedCriteria.applicationSubmitted || selectedCriteria.homeownerStatus || selectedCriteria.bankAccountType) && leadStats.totalLeads > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Pricing Recommendation
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Based on the selected criteria{scoreBreakdown.total > 0 ? ` with a score of ${scoreBreakdown.total} points (${getScoreTier(scoreBreakdown.total)})` : ''}, 
                this lead profile matches {leadStats.totalLeads.toLocaleString()} leads 
                with an average cost of ${(leadStats.costPerLead / 100).toFixed(2)} per lead.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profit Margin Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Percent className="h-5 w-5" />
            <span>Profit Margin Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leadStats.costPerLead > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold text-muted-foreground">Cost Per Lead</h3>
                <p className="text-3xl font-bold text-orange-600">
                  ${(leadStats.costPerLead / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold text-muted-foreground">Profit Margin</h3>
                <div className="flex items-center justify-center mt-2">
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                    className="w-32 text-center text-3xl font-bold border-0 bg-transparent p-0 h-auto focus:ring-0 text-blue-600 focus:outline-none"
                  />
                  <span className="text-3xl font-bold text-blue-600 ml-1">%</span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold text-muted-foreground">Profit Amount</h3>
                <p className="text-3xl font-bold text-green-600">
                  ${((leadStats.costPerLead * profitMargin / 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="text-center p-4 bg-primary/10 border-2 border-primary/20 rounded-lg">
                <h3 className="text-lg font-semibold text-primary">Final Selling Price</h3>
                <p className="text-3xl font-bold text-primary">
                  ${((leadStats.costPerLead * (1 + profitMargin / 100)) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <Percent className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select criteria above to calculate pricing with profit margin</p>
              </div>
            </div>
          )}

          {leadStats.costPerLead > 0 && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Pricing Recommendation
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                With a {profitMargin}% profit margin, charge <strong>${((leadStats.costPerLead * (1 + profitMargin / 100)) / 100).toFixed(2)}</strong> per lead.
                This gives you <strong>${((leadStats.costPerLead * profitMargin / 100) / 100).toFixed(2)}</strong> profit
                on top of your <strong>${(leadStats.costPerLead / 100).toFixed(2)}</strong> cost.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadPriceCalculator;