import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, FileText, CheckCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface LeadTierData {
  tier: string;
  count: number;
  cost_per_lead: number;
  total_cost: number;
  applications_sent: number;
  files_uploaded: number;
  application_rate: number;
  file_upload_rate: number;
}

interface DailyTierData {
  date: string;
  [key: string]: string | number;
}

const LeadTierAnalytics = () => {
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [filterType, setFilterType] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [tierData, setTierData] = useState<LeadTierData[]>([]);
  const [dailyData, setDailyData] = useState<DailyTierData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalLeads: 0,
    totalCost: 0,
    avgCostPerLead: 0,
    applicationRate: 0,
    fileUploadRate: 0
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAnalytics();
    }
  }, [dateRange, filterType, channelFilter, isSuperAdmin]);

  const getScoreTier = (score: number | null): string => {
    if (!score) return 'No Score';
    if (score >= 85) return 'Exceptional (85+)';
    if (score >= 65) return 'Strong (65-84)';
    if (score >= 45) return 'Good (45-64)';
    return 'Potential (0-44)';
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'Exceptional (85+)': return '#22c55e'; // green
      case 'Strong (65-84)': return '#3b82f6';    // blue  
      case 'Good (45-64)': return '#f59e0b';      // yellow
      case 'Potential (0-44)': return '#ef4444';  // red
      default: return '#9ca3af';                   // gray
    }
  };

  // Normalize channels from both spend and leads to a common set
  const normalizeChannel = (name?: string | null): string => {
    const n = (name || 'unknown').toLowerCase().trim();
    if (/google|gads|adwords|sem/.test(n)) return 'google';
    if (/meta|facebook|instagram|fb|ig/.test(n)) return 'meta';
    if (/bing|microsoft/.test(n)) return 'bing';
    if (/tiktok/.test(n)) return 'tiktok';
    if (/linkedin/.test(n)) return 'linkedin';
    if (/twitter|\bx\b/.test(n)) return 'twitter';
    if (/organic|seo/.test(n)) return 'organic';
    if (/direct/.test(n)) return 'direct';
    if (/referr/.test(n)) return 'referral';
    return n;
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      // Use the same ROI metrics RPC that the ROI Management uses
      const { data: roiMetrics, error: roiError } = await supabase
        .rpc('get_roi_metrics', {
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        });

      if (roiError) throw roiError;

      // Build the base query for leads with proper joins
      let query = supabase
        .from('quiz_responses')
        .select(`
          id,
          score,
          created_at,
          status,
          conversion_status,
          attribution_channel,
          usa_applications(id, document_files),
          canadian_applications(id, document_files, processing_statements)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', new Date().toISOString());

      // Apply filters based on type
      if (filterType === 'applications') {
        // Get leads who have applications
      } else if (filterType === 'files') {
        // Will filter in processing
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      // Get real ad spend data (same as ROI Management) - filtered by date range
      const { data: adSpend, error: spendError } = await supabase
        .from('ad_spend_records')
        .select('amount, date, channel, clicks, conversions')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', new Date().toISOString().split('T')[0]);

      if (spendError) throw spendError;

      // Debug: Log the date range and ad spend records
      console.log('Date range:', startDate.toISOString().split('T')[0], 'to', new Date().toISOString().split('T')[0]);
      console.log('Filtered ad spend records:', adSpend?.length || 0);

      // Use the ROI metrics we fetched (same as ROI Management)
      const roiData = roiMetrics?.[0] || {
        total_leads: 0,
        qualified_leads: 0, 
        application_leads: 0,
        funded_leads: 0
      };
      
      // Convert ad spend from cents to dollars - ONLY from date-filtered records
      const totalSpend = (adSpend || []).reduce((sum, record) => {
        // Double-check date filtering in case there are edge cases
        const recordDate = record.date;
        const isInRange = recordDate >= startDate.toISOString().split('T')[0] && 
                         recordDate <= new Date().toISOString().split('T')[0];
        return isInRange ? sum + (record.amount / 100) : sum;
      }, 0);
      
      console.log('Total spend for date range:', totalSpend);
      const totalLeads = roiData.total_leads || 0;
      const qualifiedLeads = roiData.qualified_leads || 0;
      const applicationLeads = roiData.application_leads || 0;
      const fundedLeads = roiData.funded_leads || 0;
      
      // Calculate cost per lead (same as ROI Management)
      const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
      const costPerQualifiedLead = qualifiedLeads > 0 ? totalSpend / qualifiedLeads : 0;
      
      const tierStats: Record<string, LeadTierData> = {};
      const dailyStats: Record<string, Record<string, number>> = {};

      // Filter leads based on filterType
      let filteredLeads = leads || [];
      if (filterType === 'applications') {
        filteredLeads = filteredLeads.filter(lead => 
          lead.usa_applications?.length > 0 || lead.canadian_applications?.length > 0
        );
      } else if (filterType === 'files') {
        filteredLeads = filteredLeads.filter(lead => {
          const usaFiles = Array.isArray(lead.usa_applications?.[0]?.document_files) ? lead.usa_applications[0].document_files : [];
          const canFiles = Array.isArray(lead.canadian_applications?.[0]?.document_files) ? lead.canadian_applications[0].document_files : [];
          const canStatements = Array.isArray(lead.canadian_applications?.[0]?.processing_statements) ? lead.canadian_applications[0].processing_statements : [];
          return usaFiles.length > 0 || canFiles.length > 0 || canStatements.length > 0;
        });
      }

      // Apply channel filter
      if (channelFilter !== 'all') {
        filteredLeads = filteredLeads.filter(lead => {
          const normalizedChannel = normalizeChannel(lead.attribution_channel);
          return normalizedChannel === channelFilter;
        });
      }

      // Build channel spending data (convert cents to dollars)
      const spendByChannel: Record<string, number> = {};
      (adSpend || []).forEach(record => {
        const normalizedChannel = normalizeChannel(record.channel);
        spendByChannel[normalizedChannel] = (spendByChannel[normalizedChannel] || 0) + (record.amount / 100);
      });

      // Build leads by channel (use ALL leads in range, not filtered) and tier-channel mapping
      const leadsByChannel: Record<string, number> = {};
      const tierChannelCounts: Record<string, Record<string, number>> = {};

      const leadsAll = leads || [];
      leadsAll.forEach(l => {
        const ch = normalizeChannel(l.attribution_channel);
        leadsByChannel[ch] = (leadsByChannel[ch] || 0) + 1;
      });

      filteredLeads.forEach(lead => {
        const tier = getScoreTier(lead.score);
        const normalizedChannel = normalizeChannel(lead.attribution_channel);
        const date = new Date(lead.created_at).toISOString().split('T')[0];
        
        // Count leads by tier and channel
        if (!tierChannelCounts[tier]) {
          tierChannelCounts[tier] = {};
        }
        tierChannelCounts[tier][normalizedChannel] = (tierChannelCounts[tier][normalizedChannel] || 0) + 1;
        
        // Initialize tier stats
        if (!tierStats[tier]) {
          tierStats[tier] = {
            tier,
            count: 0,
            cost_per_lead: 0,
            total_cost: 0,
            applications_sent: 0,
            files_uploaded: 0,
            application_rate: 0,
            file_upload_rate: 0
          };
        }

        // Initialize daily stats
        if (!dailyStats[date]) {
          dailyStats[date] = {};
        }
        if (!dailyStats[date][tier]) {
          dailyStats[date][tier] = 0;
        }

        tierStats[tier].count++;
        dailyStats[date][tier]++;

        // Check if application was sent
        if (lead.usa_applications?.length > 0 || lead.canadian_applications?.length > 0) {
          tierStats[tier].applications_sent++;
        }

        // Check if files were uploaded  
        const usaFiles = Array.isArray(lead.usa_applications?.[0]?.document_files) ? lead.usa_applications[0].document_files : [];
        const canFiles = Array.isArray(lead.canadian_applications?.[0]?.document_files) ? lead.canadian_applications[0].document_files : [];
        const canStatements = Array.isArray(lead.canadian_applications?.[0]?.processing_statements) ? lead.canadian_applications[0].processing_statements : [];
        const hasFiles = usaFiles.length > 0 || canFiles.length > 0 || canStatements.length > 0;
        if (hasFiles) {
          tierStats[tier].files_uploaded++;
        }
      });

      // Calculate channel-level CPL (Cost Per Lead)
      const channelCPL: Record<string, number> = {};
      Object.keys(spendByChannel).forEach(channel => {
        const channelSpend = spendByChannel[channel];
        const channelLeads = leadsByChannel[channel] || 0;
        channelCPL[channel] = channelLeads > 0 ? channelSpend / channelLeads : 0;
      });

      // Compute paid-only global CPL for fallback weighting
      const paidLeadsTotal = Object.keys(spendByChannel).reduce((sum, ch) => sum + (leadsByChannel[ch] || 0), 0);
      const paidGlobalCPL = paidLeadsTotal > 0 ? totalSpend / paidLeadsTotal : 0;

      // Calculate tier-specific CPL using total ad spend divided by tier lead count
      Object.values(tierStats).forEach(tier => {
        if (tier.count === 0) {
          tier.cost_per_lead = 0;
          tier.application_rate = 0;
          tier.file_upload_rate = 0;
          return;
        }

        // Simple calculation: total ad spend across all tiers / leads in this tier
        tier.cost_per_lead = totalSpend / tier.count;
        
        // Calculate real application and file upload rates from actual data
        tier.application_rate = (tier.applications_sent / tier.count) * 100;
        tier.file_upload_rate = (tier.files_uploaded / tier.count) * 100;
      });

      // Prepare daily data for charts
      const dailyArray: DailyTierData[] = Object.entries(dailyStats)
        .map(([date, tiers]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          ...tiers
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate aggregated stats from our filtered data
      const actualTotalLeads = Object.values(tierStats).reduce((sum, tier) => sum + tier.applications_sent, 0); // Use applications_sent instead of count
      const totalApplications = Object.values(tierStats).reduce((sum, tier) => sum + tier.applications_sent, 0);
      const totalFilesUploaded = Object.values(tierStats).reduce((sum, tier) => sum + tier.files_uploaded, 0);
      
      // Calculate filtered cost per conversion (applications) based on the actual filter applied
      const filteredCostPerLead = actualTotalLeads > 0 ? totalSpend / actualTotalLeads : 0;
      
      console.log('Metrics calculation:', {
        actualTotalLeads,
        totalSpend,
        filteredCostPerLead,
        dateRange,
        filterType
      });
      
      setTierData(Object.values(tierStats));
      setDailyData(dailyArray);
      setTotalStats({
        totalLeads: actualTotalLeads,
        totalCost: totalSpend, // Already filtered by date range above
        avgCostPerLead: filteredCostPerLead, // Use filtered calculation
        applicationRate: actualTotalLeads > 0 ? (totalApplications / actualTotalLeads) * 100 : 0,
        fileUploadRate: actualTotalLeads > 0 ? (totalFilesUploaded / actualTotalLeads) * 100 : 0
      });

    } catch (error) {
      console.error('Error fetching lead tier analytics:', error);
      toast.error("Failed to fetch lead analytics");
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Access denied. Super admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading lead tier analytics...</div>;
  }

  const pieData = tierData.map(tier => ({
    name: tier.tier,
    value: tier.count,
    color: getTierColor(tier.tier)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Lead Tier Analytics</h2>
          <p className="text-muted-foreground">Cost analysis by lead quality tiers</p>
        </div>
        <div className="flex gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="applications">Sent Applications</SelectItem>
              <SelectItem value="files">Uploaded Files</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
              <SelectItem value="meta">Meta</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Big Numbers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Total Leads</span>
            </div>
            <div className="text-4xl font-bold text-blue-900 mb-1">
              {totalStats.totalLeads.toLocaleString()}
            </div>
            <p className="text-xs text-blue-700">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium text-green-600">Total Cost</span>
            </div>
            <div className="text-4xl font-bold text-green-900 mb-1">
              ${Math.round(totalStats.totalCost).toLocaleString()}
            </div>
            <p className="text-xs text-green-700">Ad spend</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Cost/Lead</span>
            </div>
            <div className="text-4xl font-bold text-purple-900 mb-1">
              ${totalStats.avgCostPerLead.toFixed(0)}
            </div>
            <p className="text-xs text-purple-700">Average</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Application Rate</span>
            </div>
            <div className="text-4xl font-bold text-orange-900 mb-1">
              {totalStats.applicationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-orange-700">Sent applications</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-red-600" />
              <span className="text-sm font-medium text-red-600">File Upload Rate</span>
            </div>
            <div className="text-4xl font-bold text-red-900 mb-1">
              {totalStats.fileUploadRate.toFixed(1)}%
            </div>
            <p className="text-xs text-red-700">Uploaded documents</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tier Overview</TabsTrigger>
          <TabsTrigger value="trends">Daily Trends</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lead Distribution by Tier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tier Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Application Rates by Tier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tierData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" fontSize={12} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Application Rate']} />
                    <Bar dataKey="application_rate" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tier Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tierData.map((tier) => (
              <Card key={tier.tier} className="border-l-4" style={{ borderLeftColor: getTierColor(tier.tier) }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tier.tier}</CardTitle>
                    <Badge style={{ backgroundColor: getTierColor(tier.tier), color: 'white' }}>
                      {tier.count} leads
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost per lead</span>
                    <span className="font-semibold">${tier.cost_per_lead.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Applications</span>
                    <span className="font-semibold">{tier.application_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Files uploaded</span>
                    <span className="font-semibold">{tier.file_upload_rate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Lead Generation by Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  {tierData.map((tier) => (
                    <Line
                      key={tier.tier}
                      type="monotone"
                      dataKey={tier.tier}
                      stroke={getTierColor(tier.tier)}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost per Lead by Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={tierData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier" fontSize={12} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`$${value.toFixed(0)}`, 'Cost per Lead']} />
                  <Bar dataKey="cost_per_lead" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadTierAnalytics;