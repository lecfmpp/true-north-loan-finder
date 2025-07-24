import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  RefreshCw
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

  const handleStartApplication = () => {
    if (hasQuizHistory) {
      // User has completed the wizard before, go directly to application
      navigate('/application-canadian');
    } else {
      // User hasn't done the wizard, send them to the estimator first
      navigate('/loan-estimator');
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
      
      <Footer />
    </div>
  );
};

export default ApplicationStatus;