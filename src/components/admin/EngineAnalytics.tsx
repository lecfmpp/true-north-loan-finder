import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AnalyticsData {
  validation_stats: {
    total_processed: number;
    success_rate: number;
    avg_processing_time: number;
    rules_triggered: Record<string, number>;
  };
  routing_stats: {
    total_routed: number;
    success_rate: number;
    avg_routing_time: number;
    routing_types: Record<string, number>;
  };
  queue_stats: {
    current_queue_size: number;
    avg_wait_time: number;
    completed_today: number;
    failed_today: number;
  };
  performance_trends: Array<{
    date: string;
    leads_processed: number;
    validation_rate: number;
    routing_rate: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const EngineAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    validation_stats: {
      total_processed: 0,
      success_rate: 0,
      avg_processing_time: 0,
      rules_triggered: {}
    },
    routing_stats: {
      total_routed: 0,
      success_rate: 0,
      avg_routing_time: 0,
      routing_types: {}
    },
    queue_stats: {
      current_queue_size: 0,
      avg_wait_time: 0,
      completed_today: 0,
      failed_today: 0
    },
    performance_trends: []
  });
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - in reality, these would be calculated from actual data
      const mockAnalytics: AnalyticsData = {
        validation_stats: {
          total_processed: 2847,
          success_rate: 94.2,
          avg_processing_time: 1.8,
          rules_triggered: {
            'Email Validation': 145,
            'Duplicate Check': 89,
            'Phone Validation': 67,
            'Custom Logic': 23,
            'Data Quality': 12
          }
        },
        routing_stats: {
          total_routed: 2681,
          success_rate: 89.7,
          avg_routing_time: 0.9,
          routing_types: {
            'Exclusive': 1520,
            'Multi-Sell': 856,
            'Weighted': 245,
            'Ping-Post': 60
          }
        },
        queue_stats: {
          current_queue_size: 47,
          avg_wait_time: 3.2,
          completed_today: 156,
          failed_today: 8
        },
        performance_trends: [
          { date: '2024-01-01', leads_processed: 245, validation_rate: 94.2, routing_rate: 89.1 },
          { date: '2024-01-02', leads_processed: 267, validation_rate: 95.1, routing_rate: 91.2 },
          { date: '2024-01-03', leads_processed: 289, validation_rate: 93.8, routing_rate: 88.7 },
          { date: '2024-01-04', leads_processed: 312, validation_rate: 96.2, routing_rate: 92.3 },
          { date: '2024-01-05', leads_processed: 298, validation_rate: 94.7, routing_rate: 90.8 },
          { date: '2024-01-06', leads_processed: 334, validation_rate: 95.4, routing_rate: 91.7 },
          { date: '2024-01-07', leads_processed: 356, validation_rate: 94.9, routing_rate: 89.4 }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color = 'blue' }: {
    title: string;
    value: string | number;
    subtitle: string;
    trend?: number;
    icon: any;
    color?: 'blue' | 'green' | 'yellow' | 'red';
  }) => {
    const colorClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              {trend !== undefined && (
                <div className="flex items-center mt-1">
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(trend)}% from last period
                  </span>
                </div>
              )}
            </div>
            <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatRulesData = (rules: Record<string, number>) => {
    return Object.entries(rules).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  };

  const formatRoutingTypesData = (types: Record<string, number>) => {
    return Object.entries(types).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Engine Analytics</h2>
          <p className="text-muted-foreground">
            Performance insights and trends for the lead distribution engine
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Today</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Leads Processed"
          value={analytics.validation_stats.total_processed.toLocaleString()}
          subtitle="Total validated"
          trend={8.2}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Validation Rate"
          value={`${analytics.validation_stats.success_rate}%`}
          subtitle="Success rate"
          trend={2.1}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Routing Rate"
          value={`${analytics.routing_stats.success_rate}%`}
          subtitle="Successfully routed"
          trend={-1.3}
          icon={TrendingUp}
          color="yellow"
        />
        <MetricCard
          title="Queue Size"
          value={analytics.queue_stats.current_queue_size}
          subtitle="Items in queue"
          trend={-12.4}
          icon={Clock}
          color="red"
        />
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>
            Daily performance metrics over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.performance_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="leads_processed" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Leads Processed"
              />
              <Line 
                type="monotone" 
                dataKey="validation_rate" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Validation Rate %"
              />
              <Line 
                type="monotone" 
                dataKey="routing_rate" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Routing Rate %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Validation Rules Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Rules Triggered</CardTitle>
            <CardDescription>
              Number of times each validation rule was triggered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatRulesData(analytics.validation_stats.rules_triggered)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatRulesData(analytics.validation_stats.rules_triggered).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Routing Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Routing Types Distribution</CardTitle>
            <CardDescription>
              Distribution of leads by routing type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatRoutingTypesData(analytics.routing_stats.routing_types)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {formatRoutingTypesData(analytics.routing_stats.routing_types).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Validation Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate</span>
                <Badge variant="default">{analytics.validation_stats.success_rate}%</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Processing Time</span>
                <Badge variant="outline">{analytics.validation_stats.avg_processing_time}s</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Processed</span>
                <Badge variant="secondary">{analytics.validation_stats.total_processed.toLocaleString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Routing Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate</span>
                <Badge variant="default">{analytics.routing_stats.success_rate}%</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Routing Time</span>
                <Badge variant="outline">{analytics.routing_stats.avg_routing_time}s</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Routed</span>
                <Badge variant="secondary">{analytics.routing_stats.total_routed.toLocaleString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Queue Size</span>
                <Badge variant="default">{analytics.queue_stats.current_queue_size}</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Wait Time</span>
                <Badge variant="outline">{analytics.queue_stats.avg_wait_time}min</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed Today</span>
                <Badge variant="secondary">{analytics.queue_stats.completed_today}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EngineAnalytics;