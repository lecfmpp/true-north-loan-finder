import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApplicationsManagement } from '@/components/admin/ApplicationsManagement';
import ClientsManagement from '@/components/admin/ClientsManagement';
import PartnerManagement from '@/components/admin/PartnerManagement';
import SimplifiedPartnersManagement from '@/components/admin/SimplifiedPartnersManagement';
import SettingsManagement from '@/components/admin/SettingsManagement';
import BillingManagement from '@/components/admin/BillingManagement';
import BlogManagement from '@/components/admin/BlogManagement';
import SocialProofManagement from '@/components/admin/SocialProofManagement';
import EmailSequenceManagement from '@/components/admin/EmailSequenceManagement';
import EmailSenderManagement from '@/components/admin/EmailSenderManagement';
import { ChatWidgetManagement } from '@/components/admin/ChatWidgetManagement';
import ROIManagement from '@/components/admin/ROIManagement';
import { LeadsSimulation } from '@/components/LeadsSimulation';
import {
  FileText,
  Users,
  Building2,
  Settings,
  CreditCard,
  PenTool,
  Star,
  Mail,
  Send,
  MessageCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('applications');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      try {
        // Prefer role from user_roles table
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
        }

        let resolvedRole: string = 'user';
        if (rolesData && rolesData.length > 0) {
          const roles = rolesData.map(r => r.role);
          if (roles.includes('superadmin')) resolvedRole = 'superadmin';
          else if (roles.includes('lender')) resolvedRole = 'lender';
          else if (roles.includes('broker')) resolvedRole = 'broker';
        } else {
          // Fallback to profiles table if present (by user_id)
          const { data: profileMaybe, error: profileErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!profileErr && profileMaybe?.role) {
            resolvedRole = profileMaybe.role;
          }
        }
        setUserRole(resolvedRole);

        // Determine superadmin via RPC (authoritative)
        const { data: superadminData, error: superadminError } = await supabase.rpc(
          'is_superadmin',
          { user_id_param: user.id }
        );
        if (superadminError) {
          console.error('Error checking superadmin status:', superadminError);
        }
        setIsSuperadmin(superadminData === true);
      } catch (e) {
        console.error('Unexpected error checking role:', e);
        setUserRole('user');
        setIsSuperadmin(false);
      }
    };

    checkUserRole();
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (userRole === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Checking your permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!['superadmin', 'lender', 'broker'].includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              You do not have permission to access this page. Please contact an administrator if you believe
              this is an error.
            </p>
            <Badge variant="destructive">Role: {userRole}</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const superadminTabs = [
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'partners', label: 'Partners', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'blog', label: 'Blog', icon: PenTool },
    { id: 'social-proof', label: 'Social Proof', icon: Star },
    { id: 'email-sequence', label: 'Email Sequence', icon: Mail },
    { id: 'email-sender', label: 'Email Sender', icon: Send },
    { id: 'chat-widget', label: 'Chat Widget', icon: MessageCircle },
    { id: 'roi', label: 'ROI Dashboard', icon: TrendingUp },
    { id: 'leads-simulation', label: 'Leads Simulation', icon: BarChart3 }
  ];

  const managementTabs = [
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'partners', label: 'Partners', icon: Building2 },
    { id: 'roi', label: 'ROI Dashboard', icon: TrendingUp }
  ];

  const availableTabs = isSuperadmin ? superadminTabs : managementTabs;
  const TabIcon = availableTabs.find(tab => tab.id === activeTab)?.icon || FileText;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'applications':
        return <ApplicationsManagement />;
      case 'clients':
        return <ClientsManagement />;
      case 'partners':
        return isSuperadmin ? <PartnerManagement /> : <SimplifiedPartnersManagement />;
      case 'settings':
        return <SettingsManagement />;
      case 'billing':
        return <BillingManagement />;
      case 'blog':
        return <BlogManagement />;
      case 'social-proof':
        return <SocialProofManagement />;
      case 'email-sequence':
        return <EmailSequenceManagement />;
      case 'email-sender':
        return <EmailSenderManagement />;
      case 'chat-widget':
        return <ChatWidgetManagement />;
      case 'roi':
        return <ROIManagement />;
      case 'leads-simulation':
        return <LeadsSimulation />;
      default:
        return <ApplicationsManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="md:w-64 bg-white shadow-md rounded-md p-4 mb-4 md:mb-0">
            <h3 className="text-lg font-semibold mb-4">Admin Dashboard</h3>
            <nav>
              <ul>
                {availableTabs.map((tab) => (
                  <li key={tab.id} className="mb-2">
                    <a
                      href={`#${tab.id}`}
                      className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 ${
                        activeTab === tab.id ? 'bg-gray-100 font-medium' : ''
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <TabIcon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 md:ml-4">
            <Card className="shadow-md rounded-md">
              <CardHeader className="py-4">
                <CardTitle className="flex items-center">
                  <TabIcon className="mr-2 h-5 w-5" />
                  {availableTabs.find(tab => tab.id === activeTab)?.label || 'Admin Section'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {renderTabContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
