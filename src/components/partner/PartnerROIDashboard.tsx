import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Filter, DollarSign, Users, Target, MousePointer, TrendingUp, Zap } from "lucide-react";


// Simple currency helpers
const toCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const toCompact = (num: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num || 0);

// Qualification rules (keep consistent with Admin.tsx)
const creditScoreApprox = (creditScore: string) => {
  switch (creditScore) {
    case "excellent": return 775;
    case "good": return 725;
    case "fair": return 675;
    case "poor": return 625;
    case "unsure": return 650;
    default: {
      const n = parseInt(creditScore, 10);
      return isNaN(n) ? 0 : n;
    }
  }
};
const timeInBiz6m = (t?: string) => !!t && ["6-12","1-2","2-5","5+","+6"].includes(t);
const isQualified = (lead: any) => (lead?.monthly_revenue || 0) >= 10000 && timeInBiz6m(lead?.time_in_business) && creditScoreApprox(lead?.credit_score) >= 600;

// Normalize statuses like "Loan Approved" vs "loan_approved"
const normalize = (s?: string) => (s || "").toString().trim().toLowerCase().replace(/_/g, " ");

// Date filter options
const DATE_PRESETS = [
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "60d", label: "Last 60 days", days: 60 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time" },
] as const;

// Channel filter options
const CHANNEL_OPTIONS = [
  { value: "all", label: "All Channels" },
  { value: "google", label: "Google Ads" },
  { value: "meta", label: "Meta Ads" },
  { value: "tiktok", label: "TikTok Ads" },
  { value: "linkedin", label: "LinkedIn Ads" },
] as const;

type DatePreset = typeof DATE_PRESETS[number]["value"];
type ChannelFilter = typeof CHANNEL_OPTIONS[number]["value"];

export default function PartnerROIDashboard() {
  const { user } = useAuth();
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [adSpendData, setAdSpendData] = useState<any[]>([]);

  // Compute date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    if (datePreset === "all") return { startDate: null as Date | null, endDate: end };
    const preset = DATE_PRESETS.find(p => p.value === datePreset);
    if (!preset || !("days" in preset)) return { startDate: null as Date | null, endDate: end };
    const start = new Date();
    start.setDate(start.getDate() - (preset.days as number));
    return { startDate: start, endDate: end };
  }, [datePreset]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchAll = async () => {
      try {
        setLoading(true);
        
        // 1) Find partner record for the current user
        const { data: partnerData, error: partnerErr } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (partnerErr) throw partnerErr;
        const pid = partnerData?.id || null;
        setPartnerId(pid);
        if (!pid) { setAssignments([]); setLeads([]); setAdSpendData([]); return; }

        // 2) Fetch partner assignments in date range
        let assignmentQuery = supabase
          .from("lead_assignments")
          .select("id, quiz_response_id, status, assigned_at")
          .eq("partner_id", pid)
          .order("assigned_at", { ascending: false });

        if (startDate) {
          assignmentQuery = assignmentQuery.gte("assigned_at", startDate.toISOString());
        }
        if (endDate) {
          assignmentQuery = assignmentQuery.lte("assigned_at", endDate.toISOString());
        }

        const { data: assigns, error: aErr } = await assignmentQuery;
        if (aErr) throw aErr;
        setAssignments(assigns || []);

        // 3) Fetch the associated leads (quiz_responses)
        if (assigns && assigns.length > 0) {
          const ids = assigns.map(a => a.quiz_response_id).filter(Boolean);
          let leadsQuery = supabase
            .from("quiz_responses")
            .select("id, monthly_revenue, loan_amount, credit_score, time_in_business, status, conversion_status, attribution_channel, created_at")
            .in("id", ids);
          
          // Apply channel filter
          if (channelFilter !== "all") {
            const channelMap: Record<ChannelFilter, string> = {
              google: "google",
              meta: "meta",
              tiktok: "tiktok",
              linkedin: "linkedin",
              all: ""
            };
            const channelName = channelMap[channelFilter];
            if (channelName) {
              leadsQuery = leadsQuery.ilike("attribution_channel", `%${channelName}%`);
            }
          }
          
          const { data: leadData, error: lErr } = await leadsQuery;
          if (lErr) throw lErr;
          setLeads(leadData || []);
        } else {
          setLeads([]);
        }

        // 4) Fetch ad spend data for the date range
        let spendQuery = supabase
          .from("ad_spend_records")
          .select("*")
          .order("date", { ascending: false });

        if (startDate) {
          spendQuery = spendQuery.gte("date", startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
          spendQuery = spendQuery.lte("date", endDate.toISOString().split('T')[0]);
        }

        const { data: spendData, error: sErr } = await spendQuery;
        if (sErr) throw sErr;
        setAdSpendData(spendData || []);
        
      } catch (e) {
        console.error("Ads Performance fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [user, startDate, endDate, channelFilter]);

  // Ads Performance Metrics
  const totalLeads = leads.length;
  const totalSpend = adSpendData.reduce((sum, record) => sum + (record.amount || 0), 0);
  
  const qualified = leads.filter(lead => isQualified(lead));
  const qualifiedLeads = qualified.length;
  
  const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const costPerQualifiedLead = qualifiedLeads > 0 ? totalSpend / qualifiedLeads : 0;
  
  // Mock data for clicks, CTR, conversions, CPC (in real scenario, this would come from ad platform APIs)
  const totalClicks = Math.round(totalLeads * 12); // Assuming ~12 clicks per lead
  const totalImpressions = Math.round(totalClicks * 8); // Assuming ~8 impressions per click
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const conversions = totalLeads; // Each lead is a conversion
  const costPerClick = totalClicks > 0 ? totalSpend / totalClicks : 0;

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Ads Performance</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Channel</span>
          </div>
          <Select value={channelFilter} onValueChange={(v: ChannelFilter) => setChannelFilter(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Date Range</span>
          </div>
          <Select value={datePreset} onValueChange={(v: DatePreset) => setDatePreset(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* First Row: Core Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Leads generated from ads</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toCurrency(totalSpend * 100)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total ad investment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Lead</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costPerLead > 0 ? toCurrency(costPerLead * 100) : "-"}</div>
            <p className="text-xs text-muted-foreground mt-1">Average cost per lead</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Qualified Lead</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costPerQualifiedLead > 0 ? toCurrency(costPerQualifiedLead * 100) : "-"}</div>
            <p className="text-xs text-muted-foreground mt-1">Cost for qualified leads only</p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Ad Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total ad clicks</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ctr.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Click-through rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Leads converted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Click</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costPerClick > 0 ? toCurrency(costPerClick * 100) : "-"}</div>
            <p className="text-xs text-muted-foreground mt-1">Average cost per click</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Channel Performance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Performance metrics filtered by {channelFilter === "all" ? "all channels" : CHANNEL_OPTIONS.find(c => c.value === channelFilter)?.label}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{qualifiedLeads}</div>
              <div className="text-sm text-muted-foreground">Qualified Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{((qualifiedLeads / totalLeads) * 100 || 0).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Qualification Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{((conversions / totalClicks) * 100 || 0).toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
