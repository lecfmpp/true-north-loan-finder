import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Filter, Users, ShieldCheck, PhoneCall, Banknote, FileText } from "lucide-react";


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

type DatePreset = typeof DATE_PRESETS[number]["value"];

export default function PartnerROIDashboard() {
  const { user } = useAuth();
  const [datePreset, setDatePreset] = useState<DatePreset>("90d");
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [pricePerLead, setPricePerLead] = useState<number>(0); // cents
  const [brokerCommissionPct, setBrokerCommissionPct] = useState<number>(0); // percent
  const [platformCommissionPct, setPlatformCommissionPct] = useState<number>(0); // percent
  const [assignments, setAssignments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

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
          .select("id, broker_commission_percentage, platform_commission_percentage")
          .eq("user_id", user.id)
          .maybeSingle();
        if (partnerErr) throw partnerErr;
        const pid = partnerData?.id || null;
        setPartnerId(pid);
        setBrokerCommissionPct(Number((partnerData as any)?.broker_commission_percentage) || 0);
        setPlatformCommissionPct(Number((partnerData as any)?.platform_commission_percentage) || 0);
        if (!pid) { setAssignments([]); setLeads([]); return; }

        // 2) Fetch active pricing (public policy allows)
        const { data: pricingData } = await supabase
          .from("lead_pricing")
          .select("price_per_lead")
          .eq("is_active", true)
          .limit(1);
        if (pricingData && pricingData.length > 0) setPricePerLead(pricingData[0].price_per_lead || 0);

        // 3) Fetch partner assignments in date range
        let q = supabase
          .from("lead_assignments")
          .select("id, quiz_response_id, status, assigned_at")
          .eq("partner_id", pid)
          .order("assigned_at", { ascending: false });

        if (startDate) {
          q = q.gte("assigned_at", startDate.toISOString());
        }
        if (endDate) {
          q = q.lte("assigned_at", endDate.toISOString());
        }

        const { data: assigns, error: aErr } = await q;
        if (aErr) throw aErr;
        if (!assigns || assigns.length === 0) { setAssignments([]); setLeads([]); return; }
        setAssignments(assigns);

        // 4) Fetch the associated leads (quiz_responses)
        const ids = assigns.map(a => a.quiz_response_id).filter(Boolean);
        const { data: leadData, error: lErr } = await supabase
          .from("quiz_responses")
          .select("id, monthly_revenue, loan_amount, credit_score, time_in_business, status, conversion_status, partner_loan_amount, created_at")
          .in("id", ids);
        if (lErr) throw lErr;
        setLeads(leadData || []);
      } catch (e) {
        console.error("Partner ROI fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [user, startDate, endDate]);

  // Derived metrics
  const totalLeads = assignments.length;
  const assignedSpend = totalLeads * (pricePerLead || 0);
  const costPerLeadCents = (pricePerLead && pricePerLead > 0) ? pricePerLead : 5000;

  const joined = useMemo(() => {
    const map: Record<string, any> = Object.fromEntries(leads.map(l => [l.id, l]));
    return assignments.map(a => ({ ...a, lead: map[a.quiz_response_id] })).filter(x => !!x.lead);
  }, [assignments, leads]);

  const contactedLeads = joined.filter(x => normalize(x.lead?.status) === 'contacted').length;
  const applicationsSubmitted = joined.filter(x => normalize(x.lead?.status) === 'application sent').length;

  const qualified = joined.filter(x => isQualified(x.lead));
  const funded = joined.filter(x => normalize(x.lead?.status) === 'loan approved');

  const totalFundedVolumeCents = funded.reduce((sum, x) => sum + ((x.lead?.partner_loan_amount || 0) * 100), 0);
  const avgFundedDealCents = funded.length ? Math.round(totalFundedVolumeCents / funded.length) : 0;
  const totalAmountRequestedDollars = qualified.reduce((sum, x) => sum + (x.lead?.loan_amount || 0), 0);

  const contactedQualified = joined.filter(x => isQualified(x.lead) && normalize(x.lead?.status) === 'contacted').length;
  const contactRate = qualified.length ? Math.round((contactedQualified / qualified.length) * 100) : 0;
  const conversionRate = totalLeads ? Math.round((funded.length / totalLeads) * 100) : 0;

  // CPFD = total spend / funded deals
  const cpfdCents = funded.length ? Math.round((assignedSpend) / funded.length) : 0;
  // Total commission on funded volume based on partner commission percentage
  const totalCommissionCents = brokerCommissionPct ? Math.round(totalFundedVolumeCents * (brokerCommissionPct / 100)) : 0;

  const funnelData = [
    { name: "Total Leads", value: totalLeads },
    { name: "Qualified", value: qualified.length },
    { name: "Contacted", value: contactedLeads },
    { name: "Funded", value: funded.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Partner ROI Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Date Range</span>
          </div>
          <Select value={datePreset} onValueChange={(v: DatePreset) => setDatePreset(v)}>
            <SelectTrigger className="w-[180px]">
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

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Funded Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toCurrency(totalFundedVolumeCents)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sum of all approved loan amounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Funded Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toCurrency(avgFundedDealCents)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average approved amount per funded deal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toCurrency(totalCommissionCents)}</div>
            <p className="text-xs text-muted-foreground mt-1">Your commission based on funded volume</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Leads Provided</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toCompact(totalLeads)}</div>
            <p className="text-xs text-muted-foreground mt-1">Number of leads assigned to you in the selected range</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost per Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toCurrency(costPerLeadCents)}</div>
            <p className="text-xs text-muted-foreground mt-1">Fixed price per lead (default $50)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CPFD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funded.length ? toCurrency(cpfdCents) : "-"}</div>
            <p className="text-xs text-muted-foreground mt-1">Total spend divided by funded deals</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Lead Quality & Qualification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Qualified Leads Delivered</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toCompact(qualified.length)}</div>
            <div className="text-sm text-muted-foreground mt-1">Revenue ≥ $10k, 6+ months in business, credit score ≥ 600</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Amount Requested (Qualified)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalAmountRequestedDollars || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Conversion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactRate}%</div>
            <div className="text-sm text-muted-foreground mt-1">Based on assignment status updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Conversion Rate (Lead → Funded)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel - mobile friendly, simple, consistent shapes */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {[
              { label: "Total Leads", value: totalLeads, Icon: Users, cls: "bg-blue-50 text-blue-700", iconBg: "bg-blue-600" },
              { label: "Qualified", value: qualified.length, Icon: ShieldCheck, cls: "bg-emerald-50 text-emerald-700", iconBg: "bg-emerald-600" },
              { label: "Contacted", value: contactedLeads, Icon: PhoneCall, cls: "bg-amber-50 text-amber-700", iconBg: "bg-amber-600" },
              { label: "Application Submitted", value: applicationsSubmitted, Icon: FileText, cls: "bg-indigo-50 text-indigo-700", iconBg: "bg-indigo-600" },
              { label: "Funded", value: funded.length, Icon: Banknote, cls: "bg-purple-50 text-purple-700", iconBg: "bg-purple-600" },
            ].map((s) => (
              <div key={s.label} className={`${s.cls} rounded-xl px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${s.iconBg}`}>
                    <s.Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">{s.label}</span>
                </div>
                <span className="text-2xl font-bold">{toCompact(s.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
