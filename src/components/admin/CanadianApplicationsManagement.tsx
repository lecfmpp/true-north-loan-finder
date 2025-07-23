import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Eye, Search, Filter, FileText, User, Building2, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CanadianApplication {
  id: string;
  application_reference_number: string;
  legal_business_name: string;
  email_address: string;
  business_phone: string;
  amount_requested: number;
  status: string;
  conversion_stage: string;
  lead_source: string;
  quiz_response_id?: string;
  user_id?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface QuizResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthly_revenue: number;
  loan_amount: number;
  status: string;
  created_at: string;
}

const CanadianApplicationsManagement = () => {
  const [applications, setApplications] = useState<CanadianApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<CanadianApplication[]>([]);
  const [quizResponses, setQuizResponses] = useState<Record<string, QuizResponse>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<CanadianApplication | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, stageFilter]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('canadian_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);

      // Fetch related quiz responses
      const quizIds = data?.filter(app => app.quiz_response_id).map(app => app.quiz_response_id) || [];
      if (quizIds.length > 0) {
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_responses')
          .select('*')
          .in('id', quizIds);

        if (!quizError && quizData) {
          const quizMap = quizData.reduce((acc, quiz) => {
            acc[quiz.id] = quiz;
            return acc;
          }, {} as Record<string, QuizResponse>);
          setQuizResponses(quizMap);
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.application_reference_number.toLowerCase().includes(term) ||
        app.legal_business_name.toLowerCase().includes(term) ||
        app.email_address.toLowerCase().includes(term) ||
        app.business_phone.includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter(app => app.conversion_stage === stageFilter);
    }

    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updateData: any = { 
        status,
        conversion_stage: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'in_review'
      };
      
      if (notes) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('canadian_applications')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success("Application status updated successfully");
      fetchApplications();
      setSelectedApplication(null);
      setNotes("");
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error("Failed to update application status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'applicant': 'default',
      'in_review': 'secondary',
      'approved': 'default',
      'rejected': 'destructive'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getStageBadge = (stage: string) => {
    const colors: Record<string, string> = {
      'lead': 'bg-blue-100 text-blue-800',
      'application': 'bg-yellow-100 text-yellow-800',
      'in_review': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[stage] || 'bg-gray-100 text-gray-800'}`}>
        {stage}
      </span>
    );
  };

  const getSourceBadge = (source: string) => {
    return source === 'quiz' ? (
      <Badge variant="outline" className="text-green-600 border-green-600">Quiz Lead</Badge>
    ) : (
      <Badge variant="outline">Direct</Badge>
    );
  };

  if (loading) {
    return <div>Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Canadian Applications Management</h2>
        <div className="text-sm text-muted-foreground">
          Total: {applications.length} | Showing: {filteredApplications.length}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, company, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="applicant">Applicant</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setStageFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.map((application) => {
          const linkedQuiz = application.quiz_response_id ? quizResponses[application.quiz_response_id] : null;
          
          return (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm font-bold text-primary">
                        {application.application_reference_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{application.legal_business_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {application.email_address}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {application.business_phone}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Loan Amount:</span>
                      <span className="text-green-600 font-semibold">
                        ${application.amount_requested.toLocaleString()}
                      </span>
                    </div>

                    {linkedQuiz && (
                      <div className="text-sm text-blue-600">
                        <span className="font-medium">Linked Quiz Lead:</span> {linkedQuiz.name}
                        <span className="ml-2">
                          (Quiz Score: {linkedQuiz.monthly_revenue ? `$${linkedQuiz.monthly_revenue.toLocaleString()}/mo` : 'N/A'})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Stage:</span>
                        {getStageBadge(application.conversion_stage)}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Source:</span>
                        {getSourceBadge(application.lead_source)}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div>Applied: {new Date(application.created_at).toLocaleDateString()}</div>
                      <div>Updated: {new Date(application.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>

                    {linkedQuiz && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin?tab=quiz&id=${linkedQuiz.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Quiz
                      </Button>
                    )}

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => updateApplicationStatus(application.id, 'approved')}
                        disabled={application.status === 'approved'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => updateApplicationStatus(application.id, 'rejected')}
                        disabled={application.status === 'rejected'}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>

                {application.admin_notes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Admin Notes:</span>
                    <p className="text-sm mt-1">{application.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Reference:</span>
                  <p className="font-mono">{selectedApplication.application_reference_number}</p>
                </div>
                <div>
                  <span className="font-medium">Company:</span>
                  <p>{selectedApplication.legal_business_name}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p>{selectedApplication.email_address}</p>
                </div>
                <div>
                  <span className="font-medium">Phone:</span>
                  <p>{selectedApplication.business_phone}</p>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Add Admin Notes:</span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes about this application..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'approved', notes)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve with Notes
                </Button>
                <Button
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected', notes)}
                  variant="destructive"
                >
                  Reject with Notes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedApplication(null);
                    setNotes("");
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CanadianApplicationsManagement;