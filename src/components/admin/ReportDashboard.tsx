import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks, isWithinInterval } from 'date-fns';
import { ArrowUpDown, DollarSign, TrendingUp, Users, Target, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [filteredDailyData, setFilteredDailyData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof DayData>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState('last_7_days');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  
  // Pagination for All Time view
  const [currentPage, setCurrentPage] = useState(0);
  const DAYS_PER_PAGE = 30;

  useEffect(() => {
    fetchReportData();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [dailyData, dateFilter, customStartDate, customEndDate]);

  const getDateRange = () => {
    const today = new Date();
    
    switch (dateFilter) {
      case 'today':
        return {
          startDate: startOfDay(today),
          endDate: endOfDay(today)
        };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return {
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday)
        };
      case 'last_7_days':
        return {
          startDate: startOfDay(subDays(today, 7)),
          endDate: endOfDay(today)
        };
      case 'last_30_days':
        return {
          startDate: startOfDay(subDays(today, 30)),
          endDate: endOfDay(today)
        };
      case 'all_time':
        return {
          startDate: new Date('2020-01-01'),
          endDate: endOfDay(today)
        };
      case 'custom':
        return {
          startDate: customStartDate ? startOfDay(customStartDate) : startOfDay(subDays(today, 7)),
          endDate: customEndDate ? endOfDay(customEndDate) : endOfDay(today)
        };
      default:
        return {
          startDate: startOfDay(subDays(today, 7)),
          endDate: endOfDay(today)
        };
    }
  };

  const applyDateFilter = () => {
    if (dateFilter === 'all_time') {
      // For all time, we'll handle pagination in the render
      setFilteredDailyData(dailyData);
      return;
    }

    const { startDate, endDate } = getDateRange();
    
    const filtered = dailyData.filter(day => {
      const dayDate = new Date(day.date);
      return isWithinInterval(dayDate, { start: startDate, end: endDate });
    });
    
    setFilteredDailyData(filtered);
    setCurrentPage(0); // Reset pagination when filter changes
  };

  const groupDataByWeeks = (data: DayData[]) => {
    const weeks: { [key: string]: DayData[] } = {};
    
    data.forEach(day => {
      const dayDate = new Date(day.date);
      const weekStart = startOfWeek(dayDate, { weekStartsOn: 1 }); // Start week on Monday
      const weekEnd = endOfWeek(dayDate, { weekStartsOn: 1 });
      const weekKey = `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(day);
    });

    // Sort days within each week
    Object.keys(weeks).forEach(weekKey => {
      weeks[weekKey].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return weeks;
  };

  const handleSort = (field: keyof DayData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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

      // Group data by day for daily performance breakdown
      const dailyMap = new Map<string, {
        spend: number;
        leads: any[];
        leadsByHour: Map<string, number>; // Track leads by hour for better attribution
      }>();

      // First, collect all unique dates from both ad spend and leads
      const allDates = new Set<string>();
      
      // Add dates from ad spend records
      adSpendData?.forEach(record => {
        allDates.add(record.date);
      });
      
      // Add dates from leads (convert to date format)
      leadsData?.forEach(lead => {
        const dateKey = format(new Date(lead.created_at), 'yyyy-MM-dd');
        allDates.add(dateKey);
      });

      // Initialize all dates with empty data
      allDates.forEach(date => {
        dailyMap.set(date, { 
          spend: 0, 
          leads: [],
          leadsByHour: new Map()
        });
      });

      // Add ad spend by day
      adSpendData?.forEach(record => {
        const dateKey = record.date;
        const dayData = dailyMap.get(dateKey);
        if (dayData) {
          dayData.spend += (record.amount || 0) / 100; // Convert from cents to dollars
        }
      });

      // Add leads by day with hour tracking for better cost attribution
      leadsData?.forEach(lead => {
        const leadDate = new Date(lead.created_at);
        const dateKey = format(leadDate, 'yyyy-MM-dd');
        const hourKey = format(leadDate, 'HH');
        
        const dayData = dailyMap.get(dateKey);
        if (dayData) {
          dayData.leads.push(lead);
          const currentCount = dayData.leadsByHour.get(hourKey) || 0;
          dayData.leadsByHour.set(hourKey, currentCount + 1);
        }
      });

      // Convert to daily data array with accurate calculations
      const dailyDataArray: DayData[] = Array.from(dailyMap.entries())
        .map(([date, data]) => {
          const totalLeads = data.leads.length; // Total leads generated on this specific day
          const qualifiedLeads = data.leads.filter(isQualifiedLead).length; // Qualified leads on this specific day
          const spend = data.spend; // Ad spend on this specific day
          
          // Calculate daily cost metrics:
          // Cost per lead = daily ad spend ÷ daily total leads
          const costPerLead = totalLeads > 0 ? spend / totalLeads : 0;
          // Cost per qualified lead = daily ad spend ÷ daily qualified leads
          const costPerQualifiedLead = qualifiedLeads > 0 ? spend / qualifiedLeads : 0;
          
          // Debug logging for verification
          if (totalLeads > 0 || spend > 0) {
            console.log(`${date}: Spend=$${spend.toFixed(2)}, Total Leads=${totalLeads}, Qualified=${qualifiedLeads}, CPL=$${costPerLead.toFixed(2)}, CPQL=$${costPerQualifiedLead.toFixed(2)}`);
          }
          
          return {
            date,
            spend: Math.round(spend * 100) / 100, // Round to 2 decimal places
            totalLeads,
            qualifiedLeads,
            costPerLead: Math.round(costPerLead * 100) / 100, // Round to 2 decimal places
            costPerQualifiedLead: Math.round(costPerQualifiedLead * 100) / 100 // Round to 2 decimal places
          };
        })
        .filter(day => {
          // Show days that have either leads OR spend (real activity)
          return day.totalLeads > 0 || day.spend > 0;
        })
        .sort((a, b) => {
          // Sort by date descending (most recent first)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

      setDailyData(dailyDataArray);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      {/* Row 1: Volume Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      {/* Row 2: Cost Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost per Lead</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metricsData.totalLeads > 0 ? metricsData.totalAdSpend / metricsData.totalLeads : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Average acquisition cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost per Qualified Lead</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metricsData.totalQualifiedLeads > 0 ? metricsData.totalAdSpend / metricsData.totalQualifiedLeads : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Average qualified lead cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Revenue & Profitability Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle>Daily Performance Breakdown</CardTitle>
            
            {/* Date Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Range Pickers */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "MMM dd") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border shadow-md z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        disabled={(date) =>
                          date > new Date() || (customEndDate && date > customEndDate)
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-muted-foreground">to</span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "MMM dd") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border shadow-md z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        disabled={(date) =>
                          date > new Date() || (customStartDate && date < customStartDate)
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Render different views based on filter */}
          {dateFilter === 'all_time' ? (
            // All Time View - Weekly Accordions with Pagination
            <div className="space-y-4">
              {/* Pagination Controls */}
              {(() => {
                const totalDays = dailyData.length;
                const totalPages = Math.ceil(totalDays / DAYS_PER_PAGE);
                const startIndex = currentPage * DAYS_PER_PAGE;
                const endIndex = Math.min(startIndex + DAYS_PER_PAGE, totalDays);
                const currentPageData = dailyData.slice(startIndex, endIndex);
                const weeklyData = groupDataByWeeks(currentPageData);
                const weekKeys = Object.keys(weeklyData).sort();

                return (
                  <>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{endIndex} of {totalDays} days
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <div className="text-sm">
                            Page {currentPage + 1} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                            disabled={currentPage >= totalPages - 1}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Weekly Accordions */}
                    {weekKeys.length > 0 ? (
                      <Accordion type="multiple" className="w-full">
                        {weekKeys.map((weekKey) => (
                          <AccordionItem key={weekKey} value={weekKey}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full mr-4">
                                <span className="font-medium">{weekKey}</span>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{weeklyData[weekKey].length} days</span>
                                  <span>
                                    {weeklyData[weekKey].reduce((sum, day) => sum + day.totalLeads, 0)} leads
                                  </span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead className="text-right">Spend</TableHead>
                                      <TableHead className="text-right">Total Leads</TableHead>
                                      <TableHead className="text-right">Cost per Lead</TableHead>
                                      <TableHead className="text-right">Qualified Leads</TableHead>
                                      <TableHead className="text-right">Cost per Qualified Lead</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {weeklyData[weekKey].map((day) => (
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
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No data available for the current page
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            // Regular filtered table view
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
                  {(() => {
                    const dataToSort = dateFilter === 'all_time' ? dailyData : filteredDailyData;
                    const sortedData = [...dataToSort].sort((a, b) => {
                      const aVal = a[sortField];
                      const bVal = b[sortField];
                      
                      if (sortDirection === 'asc') {
                        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                      } else {
                        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                      }
                    });

                    return sortedData.map((day) => (
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
                    ));
                  })()}
                </TableBody>
              </Table>
              {filteredDailyData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}