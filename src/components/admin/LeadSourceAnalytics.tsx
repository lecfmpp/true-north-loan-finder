import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, DollarSign, Users, Search, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface LeadSourceData {
  source_name: string;
  source_category: string;
  source_type: string;
  lead_count: number;
  cost_per_lead: number | null;
  total_estimated_cost: number | null;
  conversion_rate: number | null;
  avg_loan_amount: number | null;
}

const LeadSourceAnalytics = () => {
  const { isSuperAdmin } = useAuth();
  const [analytics, setAnalytics] = useState<LeadSourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAnalytics();
    }
  }, [dateRange, isSuperAdmin]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const { data, error } = await supabase.rpc('get_lead_source_analytics', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching lead source analytics:', error);
      toast.error("Failed to fetch lead source analytics");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'paid': return <DollarSign className="w-4 h-4" />;
      case 'organic': return <TrendingUp className="w-4 h-4" />;
      case 'referral': return <Users className="w-4 h-4" />;
      case 'direct': return <Target className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'paid': return 'bg-red-100 text-red-800 border-red-200';
      case 'organic': return 'bg-green-100 text-green-800 border-green-200';
      case 'referral': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'direct': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'internal': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'owned': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAnalytics = analytics.filter(item => 
    categoryFilter === "all" || item.source_category === categoryFilter
  );

  const summaryData = {
    totalLeads: filteredAnalytics.reduce((sum, item) => sum + (item.lead_count || 0), 0),
    totalCost: filteredAnalytics.reduce((sum, item) => sum + (item.total_estimated_cost || 0), 0),
    avgConversionRate: filteredAnalytics.length > 0 
      ? filteredAnalytics.reduce((sum, item) => sum + (item.conversion_rate || 0), 0) / filteredAnalytics.length 
      : 0,
    avgLoanAmount: filteredAnalytics.length > 0 
      ? filteredAnalytics.reduce((sum, item) => sum + (item.avg_loan_amount || 0), 0) / filteredAnalytics.length 
      : 0
  };

  const chartData = filteredAnalytics.map(item => ({
    name: item.source_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    leads: item.lead_count,
    cost: item.total_estimated_cost || 0,
    conversion: item.conversion_rate || 0,
    category: item.source_category
  }));

  const pieData = Object.entries(
    filteredAnalytics.reduce((acc, item) => {
      acc[item.source_category] = (acc[item.source_category] || 0) + item.lead_count;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: count,
    color: getCategoryColor(category).split(' ')[0].replace('bg-', '#')
  }));

  const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#6b7280', '#8b5cf6', '#f97316'];

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Access denied. Super admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading lead source analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lead Source Analytics</h2>
          <p className="text-muted-foreground">Track performance across paid and organic channels</p>
        </div>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="organic">Organic</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryData.totalCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated acquisition cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryData.avgConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lead to conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Loan Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryData.avgLoanAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average requested amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Volume by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Source Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Cost/Lead</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Conversion %</TableHead>
                <TableHead className="text-right">Avg Loan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnalytics.map((source) => (
                <TableRow key={source.source_name}>
                  <TableCell className="font-medium">
                    {source.source_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(source.source_category)}>
                      <span className="flex items-center gap-1">
                        {getCategoryIcon(source.source_category)}
                        {source.source_category.charAt(0).toUpperCase() + source.source_category.slice(1)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{source.source_type}</TableCell>
                  <TableCell className="text-right">{source.lead_count}</TableCell>
                  <TableCell className="text-right">
                    {source.cost_per_lead ? `$${source.cost_per_lead}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {source.total_estimated_cost ? `$${source.total_estimated_cost.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {source.conversion_rate ? (
                      <span className={`flex items-center justify-end gap-1 ${
                        source.conversion_rate > 5 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {source.conversion_rate > 5 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {source.conversion_rate.toFixed(1)}%
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {source.avg_loan_amount ? `$${source.avg_loan_amount.toLocaleString()}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadSourceAnalytics;