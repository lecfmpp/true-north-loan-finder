import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Phone, Building2, FileText } from "lucide-react";

interface USAApp {
  id: string;
  application_reference_number: string;
  legal_corporation_name: string;
  email_address: string;
  telephone_number: string;
  city: string;
  state: string;
  status: string;
  conversion_stage: string;
  quiz_response_id?: string;
  created_at: string;
}

interface CANApp {
  id: string;
  application_reference_number: string;
  legal_business_name: string;
  email_address: string;
  business_phone: string;
  city: string;
  state: string;
  status: string;
  conversion_stage: string;
  quiz_response_id?: string;
  created_at: string;
}

export default function PartnerApplications() {
  const { user } = useAuth();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usaApps, setUsaApps] = useState<USAApp[]>([]);
  const [canApps, setCanApps] = useState<CANApp[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [stage, setStage] = useState("all");

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      // Get current partner id
      const { data: partner, error: pErr } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (pErr || !partner) {
        setPartnerId(null);
        setLoading(false);
        return;
      }
      setPartnerId(partner.id);

      // Fetch assigned quiz responses
      const { data: qr, error: qErr } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('assigned_partner_id', partner.id);
      if (qErr) {
        setLoading(false);
        return;
      }
      const quizIds = (qr || []).map(q => q.id);

      if (quizIds.length === 0) {
        setUsaApps([]);
        setCanApps([]);
        setLoading(false);
        return;
      }

      // Fetch USA and Canadian applications linked to those quizzes
      const [{ data: usa }, { data: can }] = await Promise.all([
        supabase.from('usa_applications').select('*').in('quiz_response_id', quizIds).order('created_at', { ascending: false }),
        supabase.from('canadian_applications').select('*').in('quiz_response_id', quizIds).order('created_at', { ascending: false })
      ]);

      setUsaApps((usa as USAApp[]) || []);
      setCanApps((can as CANApp[]) || []);
      setLoading(false);
    };
    run();
  }, [user]);

  const filterList = <T extends { application_reference_number: string; status: string; conversion_stage: string; email_address: string; }>(list: T[]) => {
    let out = [...list];
    if (search) {
      const term = search.toLowerCase();
      out = out.filter(a => (
        a.application_reference_number?.toLowerCase().includes(term) ||
        a.email_address?.toLowerCase().includes(term)
      ));
    }
    if (status !== 'all') out = out.filter(a => a.status === status);
    if (stage !== 'all') out = out.filter(a => a.conversion_stage === stage);
    return out;
  };

  const filteredUsa = useMemo(() => filterList(usaApps), [usaApps, search, status, stage]);
  const filteredCan = useMemo(() => filterList(canApps), [canApps, search, status, stage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!partnerId) {
    return <div className="p-6 text-muted-foreground">No partner account associated with your user.</div>;
  }

  const StatusBadge = ({ value }: { value: string }) => (
    <Badge variant="outline">{value}</Badge>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Applications</h2>
          <p className="text-muted-foreground">All applications from leads assigned to you</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Search ref/email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="min-w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="applicant">Applicant</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="min-w-[160px]"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="funded">Funded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> USA Applications ({filteredUsa.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {filteredUsa.length === 0 && (
              <div className="text-sm text-muted-foreground">No USA applications found.</div>
            )}
            {filteredUsa.map((app) => (
              <div key={app.id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{app.legal_corporation_name}</div>
                  <div className="text-xs text-muted-foreground">Ref: {app.application_reference_number}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {app.email_address}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {app.telephone_number}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {app.city}, {app.state}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={app.status} />
                  <Badge variant="secondary">{app.conversion_stage}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Canadian Applications ({filteredCan.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {filteredCan.length === 0 && (
              <div className="text-sm text-muted-foreground">No Canadian applications found.</div>
            )}
            {filteredCan.map((app) => (
              <div key={app.id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{app.legal_business_name}</div>
                  <div className="text-xs text-muted-foreground">Ref: {app.application_reference_number}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {app.email_address}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {app.business_phone}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {app.city}, {app.state}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={app.status} />
                  <Badge variant="secondary">{app.conversion_stage}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
