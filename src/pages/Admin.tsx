
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Mail, 
  Calendar,
  UserCheck,
  CreditCard,
  DollarSign,
  Briefcase,
  AlertCircle
} from "lucide-react";

import ApplicationsManagement from "@/components/admin/ApplicationsManagement";
import BlogManagement from "@/components/admin/BlogManagement";
import ROIManagement from "@/components/admin/ROIManagement";
import PartnerManagement from "@/components/admin/PartnerManagement";
import EmailSequenceManagement from "@/components/admin/EmailSequenceManagement";
import AvailableTimesManagement from "@/components/admin/AvailableTimesManagement";
import PartnerLeads from "@/components/admin/PartnerLeads";
import BillingManagement from "@/components/admin/BillingManagement";
import LeadPricingManagement from "@/components/admin/LeadPricingManagement";
import SimplifiedPartnersManagement from "@/components/admin/SimplifiedPartnersManagement";
import SettingsManagement from "@/components/admin/SettingsManagement";
import { useAuth } from "@/hooks/use-auth";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("applications");
  const { userRoles, isAdmin, authLoading } = useAuth();

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has admin access
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You don't have permission to access the admin dashboard.
            </p>
            <div className="text-sm text-gray-500">
              <p><strong>Current roles:</strong> {userRoles.length > 0 ? userRoles.join(', ') : 'No roles assigned'}</p>
              <p><strong>Required roles:</strong> superadmin, lender, or broker</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your business loan platform</p>
          </div>
          <Badge variant="outline" className="text-sm">
            Role: {userRoles.join(', ')}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-1 h-auto p-1 bg-white rounded-lg shadow-sm min-w-max">
              <TabsTrigger value="applications" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <FileText size={14} />
                <span className="hidden sm:inline">Applications</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <FileText size={14} />
                <span className="hidden sm:inline">Blog</span>
              </TabsTrigger>
              <TabsTrigger value="roi" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <TrendingUp size={14} />
                <span className="hidden sm:inline">ROI</span>
              </TabsTrigger>
              <TabsTrigger value="partners" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Users size={14} />
                <span className="hidden sm:inline">Partners</span>
              </TabsTrigger>
              <TabsTrigger value="partner-leads" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <UserCheck size={14} />
                <span className="hidden sm:inline">Leads</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <CreditCard size={14} />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <DollarSign size={14} />
                <span className="hidden sm:inline">Pay Per Lead</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Mail size={14} />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Calendar size={14} />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Settings size={14} />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="applications">
            <ApplicationsManagement />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManagement />
          </TabsContent>

          <TabsContent value="roi">
            <ROIManagement />
          </TabsContent>

          <TabsContent value="partners">
            <PartnerManagement />
          </TabsContent>

          <TabsContent value="partner-leads">
            <PartnerLeads />
          </TabsContent>

          <TabsContent value="billing">
            <BillingManagement />
          </TabsContent>

          <TabsContent value="pricing">
            <LeadPricingManagement />
          </TabsContent>

          <TabsContent value="email">
            <EmailSequenceManagement />
          </TabsContent>

          <TabsContent value="calendar">
            <AvailableTimesManagement />
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
