import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ArrowUpDown, DollarSign, TrendingUp, Users, Target } from 'lucide-react';

// Helper to determine if a lead is qualified
const isQualifiedLead = (lead: any) => {
  const revenueOk = (lead.monthly_revenue || 0) >= 10000;
  const tibOk = ['6-12', '1-2', '2-5', '5+', '+5'].includes(lead.time_in_business);
  const creditOk = getCreditScoreApprox(lead.credit_score) >= 600;
  return revenueOk && tibOk && creditOk;
};

const getCreditScoreApprox = (creditScore: string) => {
  switch (creditScore) {
    case "excellent": return 775;
    case "good": return 725;
    case "fair": return 675;
    case "poor": return 625;
    case "unsure": return 650;
    default:
      const n = parseInt(creditScore, 10);
      return isNaN(n) ? 0 : n;
  }
};

interface DayData {
  date: string;
  spend: number;
  totalLeads: number;
  qualifiedLeads: number;
  costPerLead: number;
  costPerQualifiedLead: number;
}

interface MetricsData {
  totalAdSpend: number;
  totalLeads: number;
  totalQualifiedLeads: number;
  totalRevenue: number;
  revenuePerLead: number;
  revenuePerQualifiedLead: number;
  profitMargin: number;
}

export default function ReportDashboard() {
  const [metricsData, setMetricsData] = useState<MetricsData>({
    totalAdSpend: 0,
    totalLeads: 0,
    totalQualifiedLeads: 0,
    totalRevenue: 0,
    revenuePerLead: 0,
    revenuePerQualifiedLead: 0,
    profitMargin: 0
  });
  
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof DayData>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch ad spend data
      const { data: adSpendData } = await supabase
        .from('ad_spend_records')
        .select('*')
        .order('date', { ascending: true });

      // Fetch all leads
      const { data: leadsData } = await supabase
        .from('quiz_responses')
        .select('*')
        .order('created_at', { ascending: true });

      // Fetch payments data
      const { data: paymentsData } = await supabase
        .from('payment_records')
        .select('*')
        .eq('status', 'completed');

      // Calculate top-level metrics (amounts stored in cents, divide by 100 for dollars)
      const totalAdSpend = (adSpendData?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0) / 100;
      const totalLeads = leadsData?.length || 0;
      const totalQualifiedLeads = leadsData?.filter(isQualifiedLead).length || 0;
      const totalRevenue = (paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0) / 100;
      
      const revenuePerLead = totalLeads > 0 ? totalRevenue / totalLeads : 0;
      const revenuePerQualifiedLead = totalQualifiedLeads > 0 ? totalRevenue / totalQualifiedLeads : 0;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalAdSpend) / totalRevenue) * 100 : 0;

      setMetricsData({
        totalAdSpend,
        totalLeads,
        totalQualifiedLeads,
        totalRevenue,
        revenuePerLead,
        revenuePerQualifiedLead,
        profitMargin
      });

      // Group data by day for daily breakdown
      const dailyMap = new Map<string, {
        spend: number;
        leads: any[];
      }>();

      // Add ad spend by day
      adSpendData?.forEach(record => {
        const dateKey = record.date;
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { spend: 0, leads: [] });
        }
        const dayData = dailyMap.get(dateKey)!;
        dayData.spend += (record.amount || 0) / 100; // Convert from cents to dollars
      });

      // Add leads by day
      leadsData?.forEach(lead => {
        const dateKey = format(new Date(lead.created_at), 'yyyy-MM-dd');
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { spend: 0, leads: [] });
        }
        const dayData = dailyMap.get(dateKey)!;
        dayData.leads.push(lead);
      });

      // Convert to daily data array
      const dailyDataArray: DayData[] = Array.from(dailyMap.entries())
        .map(([date, data]) => {
          const totalLeads = data.leads.length;
          const qualifiedLeads = data.leads.filter(isQualifiedLead).length;
          const spend = data.spend;
          
          return {
            date,
            spend,
            totalLeads,
            qualifiedLeads,
            costPerLead: totalLeads > 0 ? spend / totalLeads : 0,
            costPerQualifiedLead: qualifiedLeads > 0 ? spend / qualifiedLeads : 0
          };
        })
        .filter(day => day.totalLeads > 0 || day.spend > 0) // Only show days with activity
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first

      setDailyData(dailyDataArray);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof DayData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedDailyData = [...dailyData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Report</h1>
        <p className="text-muted-foreground">Comprehensive overview of key metrics and daily performance</p>
      </div>

      {/* Top-Level Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Row 1: Volume & Spend Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricsData.totalAdSpend)}</div>
            <p className="text-xs text-muted-foreground">Total advertising investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total leads captured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData.totalQualifiedLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Leads meeting qualification criteria</p>
          </CardContent>
        </Card>

        {/* Row 2: Profitability & ROI Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricsData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total collected payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per Lead</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricsData.revenuePerLead)}</div>
            <p className="text-xs text-muted-foreground">Average revenue per lead</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per Qualified Lead</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricsData.revenuePerQualifiedLead)}</div>
            <p className="text-xs text-muted-foreground">Average revenue per qualified lead</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(metricsData.profitMargin)}</div>
            <p className="text-xs text-muted-foreground">Net profit margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('spend')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Spend</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('totalLeads')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total Leads</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('costPerLead')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Cost per Lead</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('qualifiedLeads')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Qualified Leads</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('costPerQualifiedLead')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Cost per Qualified Lead</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDailyData.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">
                      {format(new Date(day.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(day.spend)}
                    </TableCell>
                    <TableCell className="text-right">
                      {day.totalLeads.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {day.costPerLead > 0 ? formatCurrency(day.costPerLead) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {day.qualifiedLeads.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {day.costPerQualifiedLead > 0 ? formatCurrency(day.costPerQualifiedLead) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sortedDailyData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}