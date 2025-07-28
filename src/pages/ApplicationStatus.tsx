import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Application {
  id: string;
  application_reference_number: string;
  legal_business_name: string;
  amount_requested: number;
  status: string;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
  type: 'canadian' | 'usa';
  principal_owner_name: string;
  email_address: string;
  business_phone: string;
  city: string;
  state: string;
}

const ApplicationStatus = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasQuizHistory, setHasQuizHistory] = useState<boolean>(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchApplications();
    }
  }, [user, loading, navigate]);

  const fetchApplications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Check if user has any quiz history by looking for quiz responses with their email
      const { data: quizHistory, error: quizError } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('email', user.email)
        .limit(1);

      if (!quizError && quizHistory && quizHistory.length > 0) {
        setHasQuizHistory(true);
      }

      // Fetch Canadian applications
      const { data: canadianApps, error: canadianError } = await supabase
        .from('canadian_applications')
        .select(`
          id,
          application_reference_number,
          legal_business_name,
          amount_requested,
          status,
          created_at,
          updated_at,
          admin_notes,
          principal_owner_name,
          email_address,
          business_phone,
          city,
          state
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (canadianError) throw canadianError;

      // Fetch USA applications  
      const { data: usaApps, error: usaError } = await supabase
        .from('usa_applications')
        .select(`
          id,
          application_reference_number,
          legal_corporation_name,
          loan_amount_requested,
          status,
          created_at,
          updated_at,
          admin_notes,
          principal_name,
          principal_email,
          telephone_number,
          city,
          state
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (usaError) throw usaError;

      // Combine and normalize applications
      const allApplications: Application[] = [
        ...(canadianApps || []).map(app => ({
          ...app,
          type: 'canadian' as const,
          principal_owner_name: app.principal_owner_name,
          email_address: app.email_address,
          business_phone: app.business_phone,
        })),
        ...(usaApps || []).map(app => ({
          ...app,
          type: 'usa' as const,
          legal_business_name: app.legal_corporation_name,
          amount_requested: app.loan_amount_requested,
          principal_owner_name: app.principal_name,
          email_address: app.principal_email,
          business_phone: app.telephone_number,
        }))
      ];

      setApplications(allApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartApplication = async () => {
    if (hasQuizHistory) {
      // User has completed the wizard before, check their country preference and go to appropriate application
      try {
        const { data: latestQuiz, error } = await supabase
          .from('quiz_responses')
          .select('country')
          .eq('email', user?.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!error && latestQuiz) {
          const applicationRoute = latestQuiz.country === 'CA' ? '/application-canadian' : '/application-usa';
          navigate(applicationRoute);
        } else {
          // Default to US application if no country data found
          navigate('/application-usa');
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        // Default to US application if there's an error
        navigate('/application-usa');
      }
    } else {
      // User hasn't done the wizard, send them to the estimator first
      navigate('/loan-estimator');
    }
  };

  const fetchFullApplicationDetails = async (application: Application) => {
    setIsLoadingDetails(true);
    try {
      const tableName = application.type === 'canadian' ? 'canadian_applications' : 'usa_applications';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', application.id)
        .single();

      if (error) throw error;

      setSelectedApplication({ ...data, type: application.type });
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
      toast.error('Failed to load application details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'funded':
        return 'bg-green-500';
      case 'pending':
      case 'applicant':
      case 'in_review':
        return 'bg-yellow-500';
      case 'rejected':
      case 'declined':
        return 'bg-red-500';
      case 'documents_required':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'funded':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'applicant':
      case 'in_review':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
      case 'declined':
        return <AlertCircle className="h-4 w-4" />;
      case 'documents_required':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applicant':
        return 25;
      case 'pending':
      case 'in_review':
        return 50;
      case 'documents_required':
        return 75;
      case 'approved':
        return 90;
      case 'funded':
        return 100;
      case 'rejected':
      case 'declined':
        return 0;
      default:
        return 25;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Application Status</h1>
                <p className="text-muted-foreground mt-2">
                  Track the progress of your funding applications
                </p>
              </div>
              <Button onClick={fetchApplications} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Applications List */}
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any applications yet.
                  </p>
                  <Button onClick={handleStartApplication}>
                    Start Your Application
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {applications.map((application) => (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            {application.legal_business_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Application #{application.application_reference_number}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(application.status)} text-white`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {application.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Application Progress</span>
                          <span>{getProgressPercentage(application.status)}%</span>
                        </div>
                        <Progress 
                          value={getProgressPercentage(application.status)} 
                          className="h-2"
                        />
                      </div>

                      {/* Application Details */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Amount Requested:</span>
                            <span>{formatCurrency(application.amount_requested)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Principal Owner:</span>
                            <span>{application.principal_owner_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Location:</span>
                            <span>{application.city}, {application.state}</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Submitted:</span>
                            <span>{formatDate(application.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Email:</span>
                            <span>{application.email_address}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Phone:</span>
                            <span>{application.business_phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <Separator className="my-4" />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchFullApplicationDetails(application)}
                          disabled={isLoadingDetails}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Application
                        </Button>
                      </div>

                      {/* Admin Notes */}
                      {application.admin_notes && (
                        <>
                          <Separator className="my-4" />
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                              Update from your funding specialist:
                            </h4>
                            <p className="text-blue-800 dark:text-blue-200 text-sm">
                              {application.admin_notes}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Status-specific Messages */}
                      {application.status.toLowerCase() === 'documents_required' && (
                        <>
                          <Separator className="my-4" />
                          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
                            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                              Action Required: Additional Documents
                            </h4>
                            <p className="text-amber-800 dark:text-amber-200 text-sm mb-3">
                              Your application is progressing well! We need some additional documents to continue processing.
                            </p>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                              Upload Documents
                            </Button>
                          </div>
                        </>
                      )}

                      {application.status.toLowerCase() === 'approved' && (
                        <>
                          <Separator className="my-4" />
                          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                              🎉 Congratulations! Your application has been approved
                            </h4>
                            <p className="text-green-800 dark:text-green-200 text-sm">
                              Your funding specialist will contact you shortly to finalize the details and arrange fund transfer.
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Full Application Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complete Application Details
            </DialogTitle>
            <DialogDescription>
              {selectedApplication && `Application #${selectedApplication.application_reference_number}`}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-6">
            {selectedApplication && (
              <div className="space-y-6">
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Legal Business Name</label>
                      <p className="text-sm mt-1">{selectedApplication.legal_business_name || selectedApplication.legal_corporation_name}</p>
                    </div>
                    {selectedApplication.dba_name && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">DBA Name</label>
                        <p className="text-sm mt-1">{selectedApplication.dba_name}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Business Address</label>
                      <p className="text-sm mt-1">{selectedApplication.physical_address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">City, State/Province</label>
                      <p className="text-sm mt-1">{selectedApplication.city}, {selectedApplication.state}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Postal/Zip Code</label>
                      <p className="text-sm mt-1">{selectedApplication.zip}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Business Phone</label>
                      <p className="text-sm mt-1">{selectedApplication.business_phone || selectedApplication.telephone_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <p className="text-sm mt-1">{selectedApplication.email_address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
                      <p className="text-sm mt-1">{selectedApplication.type_of_entity || selectedApplication.entity_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Federal Tax ID</label>
                      <p className="text-sm mt-1">{selectedApplication.federal_tax_id}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount Requested</label>
                      <p className="text-sm mt-1 font-semibold">
                        {formatCurrency(selectedApplication.amount_requested || selectedApplication.loan_amount_requested)}
                      </p>
                    </div>
                    {selectedApplication.annual_gross_sales && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Annual Gross Sales</label>
                        <p className="text-sm mt-1">{formatCurrency(selectedApplication.annual_gross_sales)}</p>
                      </div>
                    )}
                    {selectedApplication.average_monthly_deposits && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Average Monthly Deposits</label>
                        <p className="text-sm mt-1">{formatCurrency(selectedApplication.average_monthly_deposits)}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Use of Funds</label>
                      <p className="text-sm mt-1">{selectedApplication.use_of_funds}</p>
                    </div>
                    {selectedApplication.business_start_date && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Business Start Date</label>
                        <p className="text-sm mt-1">{formatDate(selectedApplication.business_start_date)}</p>
                      </div>
                    )}
                    {selectedApplication.years_in_business !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Time in Business</label>
                        <p className="text-sm mt-1">
                          {selectedApplication.years_in_business} years, {selectedApplication.months_in_business || 0} months
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Principal Owner Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Principal Owner Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Principal Owner Name</label>
                      <p className="text-sm mt-1">{selectedApplication.principal_owner_name || selectedApplication.principal_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Home Address</label>
                      <p className="text-sm mt-1">{selectedApplication.home_address || selectedApplication.principal_home_address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">City, State/Province</label>
                      <p className="text-sm mt-1">
                        {selectedApplication.city_owner || selectedApplication.principal_city}, {selectedApplication.state_owner || selectedApplication.principal_state}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Postal/Zip Code</label>
                      <p className="text-sm mt-1">{selectedApplication.zip_owner || selectedApplication.principal_zip}</p>
                    </div>
                    {selectedApplication.cell_phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Cell Phone</label>
                        <p className="text-sm mt-1">{selectedApplication.cell_phone}</p>
                      </div>
                    )}
                    {selectedApplication.principal_cell_phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Cell Phone</label>
                        <p className="text-sm mt-1">{selectedApplication.principal_cell_phone}</p>
                      </div>
                    )}
                    {selectedApplication.ownership_percentage && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ownership Percentage</label>
                        <p className="text-sm mt-1">{selectedApplication.ownership_percentage}%</p>
                      </div>
                    )}
                    {selectedApplication.principal_ownership_percentage && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ownership Percentage</label>
                        <p className="text-sm mt-1">{selectedApplication.principal_ownership_percentage}%</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing Information (Canadian Only) */}
                {selectedApplication.type === 'canadian' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Processing Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                      {selectedApplication.current_credit_card_processor && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Current Credit Card Processor</label>
                          <p className="text-sm mt-1">{selectedApplication.current_credit_card_processor}</p>
                        </div>
                      )}
                      {selectedApplication.annual_credit_card_sales && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Annual Credit Card Sales</label>
                          <p className="text-sm mt-1">{formatCurrency(selectedApplication.annual_credit_card_sales)}</p>
                        </div>
                      )}
                      {selectedApplication.average_monthly_cc_volume && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Average Monthly CC Volume</label>
                          <p className="text-sm mt-1">{formatCurrency(selectedApplication.average_monthly_cc_volume)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Application Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Application Status
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                        <div className="mt-1">
                          <Badge className={`${getStatusColor(selectedApplication.status)} text-white`}>
                            {selectedApplication.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Submitted Date</label>
                        <p className="text-sm mt-1">{formatDate(selectedApplication.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                        <p className="text-sm mt-1">{formatDate(selectedApplication.updated_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Progress</label>
                        <div className="mt-1">
                          <Progress value={getProgressPercentage(selectedApplication.status)} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {getProgressPercentage(selectedApplication.status)}% Complete
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedApplication.admin_notes && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="text-sm font-medium text-muted-foreground">Notes from Funding Specialist</label>
                        <div className="mt-2 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {selectedApplication.admin_notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default ApplicationStatus;