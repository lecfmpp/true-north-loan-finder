import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, Save, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BrokerApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  company_name: string;
  company_website: string;
  application_type: string;
  license_number: string;
  business_description: string;
  years_of_experience: number;
  business_types: string[];
  preferred_industries: string[];
  min_monthly_revenue: string;
  max_monthly_revenue: string;
  min_time_in_business: string;
  min_credit_score: string;
  min_loan_amount: string;
  max_loan_amount: string;
  funding_purposes: string[];
  geographic_areas: string[];
  additional_requirements: string;
  status: string;
  payment_status: string;
  payment_amount: number;
  payment_deadline: string;
  created_at: string;
}

export default function PartnerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [application, setApplication] = useState<BrokerApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/partner-auth");
        return;
      }
      setUser(session.user);
      await fetchApplication(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/partner-auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchApplication = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lender_broker_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setApplication(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching application:', error);
      toast({
        title: "Error",
        description: "Failed to load application data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!application || !user) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('lender_broker_applications')
        .update({
          applicant_name: application.applicant_name,
          applicant_email: application.applicant_email,
          applicant_phone: application.applicant_phone,
          company_name: application.company_name,
          company_website: application.company_website,
          license_number: application.license_number,
          business_description: application.business_description,
          years_of_experience: application.years_of_experience,
          business_types: application.business_types,
          preferred_industries: application.preferred_industries,
          min_monthly_revenue: application.min_monthly_revenue,
          max_monthly_revenue: application.max_monthly_revenue,
          min_time_in_business: application.min_time_in_business,
          min_credit_score: application.min_credit_score,
          min_loan_amount: application.min_loan_amount,
          max_loan_amount: application.max_loan_amount,
          funding_purposes: application.funding_purposes,
          geographic_areas: application.geographic_areas,
          additional_requirements: application.additional_requirements,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof BrokerApplication, value: any) => {
    if (!application) return;
    setApplication({ ...application, [field]: value });
  };

  const handleArrayField = (field: 'business_types' | 'preferred_industries' | 'funding_purposes' | 'geographic_areas', value: string, checked: boolean) => {
    if (!application) return;
    const currentArray = application[field] || [];
    if (checked) {
      updateField(field, [...currentArray, value]);
    } else {
      updateField(field, currentArray.filter(item => item !== value));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Partner Dashboard</h1>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>No Application Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You haven't submitted a broker application yet. Please complete the application process first.
              </p>
              <Button onClick={() => navigate("/")} variant="default">
                Go to Home Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary"><CreditCard className="h-3 w-3 mr-1" />Payment Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Partner Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(application.status)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              {getPaymentStatusBadge(application.payment_status)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Lead Access Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(application.payment_amount / 100).toFixed(2)}</div>
              {application.payment_status === 'pending' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {new Date(application.payment_deadline).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Broker Application Details
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicant_name">Full Name</Label>
                <Input
                  id="applicant_name"
                  value={application.applicant_name}
                  onChange={(e) => updateField('applicant_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="applicant_email">Email</Label>
                <Input
                  id="applicant_email"
                  type="email"
                  value={application.applicant_email}
                  onChange={(e) => updateField('applicant_email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="applicant_phone">Phone</Label>
                <Input
                  id="applicant_phone"
                  value={application.applicant_phone || ''}
                  onChange={(e) => updateField('applicant_phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  value={application.years_of_experience || ''}
                  onChange={(e) => updateField('years_of_experience', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={application.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company_website">Company Website</Label>
                <Input
                  id="company_website"
                  value={application.company_website || ''}
                  onChange={(e) => updateField('company_website', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={application.license_number || ''}
                  onChange={(e) => updateField('license_number', e.target.value)}
                />
              </div>
            </div>

            {/* Business Description */}
            <div>
              <Label htmlFor="business_description">Business Description</Label>
              <Textarea
                id="business_description"
                value={application.business_description || ''}
                onChange={(e) => updateField('business_description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Loan Criteria */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Loan Criteria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_loan_amount">Minimum Loan Amount</Label>
                  <Select
                    value={application.min_loan_amount || ''}
                    onValueChange={(value) => updateField('min_loan_amount', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">$10,000</SelectItem>
                      <SelectItem value="25000">$25,000</SelectItem>
                      <SelectItem value="50000">$50,000</SelectItem>
                      <SelectItem value="100000">$100,000</SelectItem>
                      <SelectItem value="250000">$250,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max_loan_amount">Maximum Loan Amount</Label>
                  <Select
                    value={application.max_loan_amount || ''}
                    onValueChange={(value) => updateField('max_loan_amount', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select maximum amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100000">$100,000</SelectItem>
                      <SelectItem value="250000">$250,000</SelectItem>
                      <SelectItem value="500000">$500,000</SelectItem>
                      <SelectItem value="1000000">$1,000,000</SelectItem>
                      <SelectItem value="5000000">$5,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="min_credit_score">Minimum Credit Score</Label>
                  <Select
                    value={application.min_credit_score || ''}
                    onValueChange={(value) => updateField('min_credit_score', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum credit score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500+</SelectItem>
                      <SelectItem value="550">550+</SelectItem>
                      <SelectItem value="600">600+</SelectItem>
                      <SelectItem value="650">650+</SelectItem>
                      <SelectItem value="700">700+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="min_time_in_business">Minimum Time in Business</Label>
                  <Select
                    value={application.min_time_in_business || ''}
                    onValueChange={(value) => updateField('min_time_in_business', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 months">3 months</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="1 year">1 year</SelectItem>
                      <SelectItem value="2 years">2 years</SelectItem>
                      <SelectItem value="3 years">3 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Preferred Industries */}
            <div>
              <Label>Preferred Industries</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {['Restaurant', 'Retail', 'Construction', 'Healthcare', 'Manufacturing', 'Professional Services', 'Transportation', 'Real Estate', 'Technology'].map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${industry}`}
                      checked={application.preferred_industries?.includes(industry) || false}
                      onCheckedChange={(checked) => 
                        handleArrayField('preferred_industries', industry, checked as boolean)
                      }
                    />
                    <Label htmlFor={`industry-${industry}`} className="text-sm">
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Areas */}
            <div>
              <Label>Geographic Areas</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {['National', 'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'California', 'Texas', 'Florida', 'New York'].map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area}`}
                      checked={application.geographic_areas?.includes(area) || false}
                      onCheckedChange={(checked) => 
                        handleArrayField('geographic_areas', area, checked as boolean)
                      }
                    />
                    <Label htmlFor={`area-${area}`} className="text-sm">
                      {area}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Requirements */}
            <div>
              <Label htmlFor="additional_requirements">Additional Requirements</Label>
              <Textarea
                id="additional_requirements"
                value={application.additional_requirements || ''}
                onChange={(e) => updateField('additional_requirements', e.target.value)}
                placeholder="Any additional requirements or notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}