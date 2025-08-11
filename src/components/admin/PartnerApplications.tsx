import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import USAApplicationsManagement from "@/components/admin/USAApplicationsManagement";
import CanadianApplicationsManagement from "@/components/admin/CanadianApplicationsManagement";

export default function PartnerApplications() {
  const { user } = useAuth();
  const [quizIds, setQuizIds] = useState<string[] | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      // Find this user's partner id
      const { data: partner, error: pErr } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (pErr || !partner) {
        setQuizIds([]);
        return;
      }
      // Get all quiz responses assigned to this partner
      const { data: qr, error: qErr } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('assigned_partner_id', partner.id);
      if (qErr) {
        setQuizIds([]);
        return;
      }
      setQuizIds((qr || []).map(q => q.id));
    };
    load();
  }, [user]);

  if (quizIds === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>My USA Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <USAApplicationsManagement restrictToQuizIds={quizIds} partnerMode />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Canadian Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CanadianApplicationsManagement restrictToQuizIds={quizIds} partnerMode />
        </CardContent>
      </Card>
    </div>
  );
}
