
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ApplicationsManagement from '@/components/admin/ApplicationsManagement';
import USAApplicationsManagement from '@/components/admin/USAApplicationsManagement';
import CanadianApplicationsManagement from '@/components/admin/CanadianApplicationsManagement';
import PartnerManagement from '@/components/admin/PartnerManagement';
import PartnerLeads from '@/components/admin/PartnerLeads';
import PartnerPayments from '@/components/admin/PartnerPayments';
import SimplifiedPartnersManagement from '@/components/admin/SimplifiedPartnersManagement';
import BillingManagement from '@/components/admin/BillingManagement';
import LeadPricingManagement from '@/components/admin/LeadPricingManagement';
import ROIManagement from '@/components/admin/ROIManagement';
import SettingsManagement from '@/components/admin/SettingsManagement';
import AvailableTimesManagement from '@/components/admin/AvailableTimesManagement';
import EmailSequenceManagement from '@/components/admin/EmailSequenceManagement';
import NotificationEmailSettings from '@/components/admin/NotificationEmailSettings';
import SocialProofManagement from '@/components/admin/SocialProofManagement';
import ChatWidgetManagement from '@/components/admin/ChatWidgetManagement';
import BlogManagement from '@/components/admin/BlogManagement';
import SEOAnalyzer from '@/components/admin/SEOAnalyzer';
import LeadSimulationManagement from '@/components/admin/LeadSimulationManagement';
import { Badge } from '@/components/ui/badge';

const Admin = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserRole(data.role);
      }
      setLoading(false);
    };

    checkUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  if (!user || !userRole || !['superadmin', 'lender', 'broker'].includes(userRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage applications, partners, and system settings</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Role: {userRole}
          </Badge>
        </div>

        <Tabs defaultValue="usa-applications" className="w-full">
          <TabsList className="grid w-full grid-cols-8 lg:grid-cols-16 mb-8">
            <TabsTrigger value="usa-applications">USA Apps</TabsTrigger>
            <TabsTrigger value="canadian-applications">CAN Apps</TabsTrigger>
            <TabsTrigger value="applications">Quiz Leads</TabsTrigger>
            <TabsTrigger value="lead-simulation">Lead Sim</TabsTrigger>
            <TabsTrigger value="partners-simple">Partners</TabsTrigger>
            <TabsTrigger value="partner-leads">Lead Assign</TabsTrigger>
            <TabsTrigger value="partner-payments">Payments</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="roi">ROI</TabsTrigger>
            <TabsTrigger value="times">Times</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
            <TabsTrigger value="social-proof">Social</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="usa-applications">
            <USAApplicationsManagement />
          </TabsContent>

          <TabsContent value="canadian-applications">
            <CanadianApplicationsManagement />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsManagement />
          </TabsContent>

          <TabsContent value="lead-simulation">
            <LeadSimulationManagement />
          </TabsContent>

          <TabsContent value="partners-simple">
            <SimplifiedPartnersManagement />
          </TabsContent>

          <TabsContent value="partner-leads">
            <PartnerLeads />
          </TabsContent>

          <TabsContent value="partner-payments">
            <PartnerPayments />
          </TabsContent>

          <TabsContent value="billing">
            <BillingManagement />
          </TabsContent>

          <TabsContent value="pricing">
            <LeadPricingManagement />
          </TabsContent>

          <TabsContent value="roi">
            <ROIManagement />
          </TabsContent>

          <TabsContent value="times">
            <AvailableTimesManagement />
          </TabsContent>

          <TabsContent value="emails">
            <EmailSequenceManagement />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationEmailSettings />
          </TabsContent>

          <TabsContent value="social-proof">
            <SocialProofManagement />
          </TabsContent>

          <TabsContent value="chat">
            <ChatWidgetManagement />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManagement />
          </TabsContent>

          <TabsContent value="seo">
            <SEOAnalyzer />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
