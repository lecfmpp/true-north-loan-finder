import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Building2, User, CreditCard, FileText, CheckCircle, Upload, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationAuth } from "@/components/ApplicationAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useApplicationDraft } from "@/hooks/use-application-draft";

interface ApplicationData {
  // Company Information
  legal_corporation_name: string;
  dba_name: string;
  physical_address: string;
  city: string;
  state: string;
  zip: string;
  entity_type: string;
  telephone_number: string;
  fax_number: string;
  website: string;
  email_address: string;
  
  // Federal & State Information
  federal_tax_id: string;
  state_tax_id: string;
  state_of_incorporation: string;
  date_incorporated: string;
  
  // Principal Information
  principal_name: string;
  principal_title: string;
  principal_ssn: string;
  principal_date_of_birth: string;
  principal_home_address: string;
  principal_city: string;
  principal_state: string;
  principal_zip: string;
  principal_home_phone: string;
  principal_cell_phone: string;
  principal_email: string;
  principal_ownership_percentage: string;
  
  // Business Information
  years_in_business: string;
  months_in_business: string;
  number_of_employees: string;
  business_type: string;
  business_description: string;
  
  // Bank Information
  bank_name: string;
  bank_account_type: string;
  bank_routing_number: string;
  bank_account_number: string;
  months_with_bank: string;
  
  // Financial Information
  average_monthly_deposits: string;
  monthly_rent_mortgage: string;
  
  // Processing Information
  accept_cards: string[];
  current_processor: string;
  mid_number: string;
  monthly_processing_volume: string;
  average_ticket: string;
  high_ticket: string;
  
  // Loan Information
  loan_amount_requested: string;
  use_of_funds: string;
  
  // Document Files
  document_files: File[];
}

// US States for dropdown
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const Application = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user, loading } = useAuth();
  const { saveDraft, loadDraft, deleteDraft, checkQuizCompletion } = useApplicationDraft();
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const totalSteps = 7; // Updated to include auth step
  
  const [formData, setFormData] = useState<ApplicationData>({
    legal_corporation_name: "",
    dba_name: "",
    physical_address: "",
    city: "",
    state: "",
    zip: "",
    entity_type: "",
    telephone_number: "",
    fax_number: "",
    website: "",
    email_address: "",
    federal_tax_id: "",
    state_tax_id: "",
    state_of_incorporation: "",
    date_incorporated: "",
    principal_name: "",
    principal_title: "",
    principal_ssn: "",
    principal_date_of_birth: "",
    principal_home_address: "",
    principal_city: "",
    principal_state: "",
    principal_zip: "",
    principal_home_phone: "",
    principal_cell_phone: "",
    principal_email: "",
    principal_ownership_percentage: "",
    years_in_business: "",
    months_in_business: "",
    number_of_employees: "",
    business_type: "",
    business_description: "",
    bank_name: "",
    bank_account_type: "",
    bank_routing_number: "",
    bank_account_number: "",
    months_with_bank: "",
    average_monthly_deposits: "",
    monthly_rent_mortgage: "",
    accept_cards: [],
    current_processor: "",
    mid_number: "",
    monthly_processing_volume: "",
    average_ticket: "",
    high_ticket: "",
    loan_amount_requested: "",
    use_of_funds: "",
    document_files: [],
  });

  // Auto-fill form from URL parameters when coming from quiz results
  useEffect(() => {
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const loanAmount = searchParams.get('loanAmount');
    const monthlyRevenue = searchParams.get('monthlyRevenue');
    const useOfFunds = searchParams.get('useOfFunds');

    // Pre-fill form if quiz data is available
    if (name || email || phone || loanAmount) {
      setFormData(prev => ({
        ...prev,
        principal_name: name || prev.principal_name,
        principal_email: email || prev.principal_email,
        email_address: email || prev.email_address,
        principal_cell_phone: phone || prev.principal_cell_phone,
        loan_amount_requested: loanAmount || prev.loan_amount_requested,
        use_of_funds: useOfFunds || prev.use_of_funds,
      }));
    }
  }, [searchParams]);

  // Pre-fill email from authenticated user
  useEffect(() => {
    if (user?.email && !formData.email_address) {
      setFormData(prev => ({
        ...prev,
        email_address: user.email || '',
        principal_email: user.email || '',
      }));
    }
  }, [user, formData.email_address]);

  // Load draft and quiz data when user is authenticated
  useEffect(() => {
    const initializeFormData = async () => {
      if (!user || isDraftLoaded) return;
      
      try {
        // First check if there's quiz data from URL params
        const hasQuizData = searchParams.get('name') || searchParams.get('email') || searchParams.get('loanAmount');
        
        if (!hasQuizData) {
          // Try to load existing draft
          const draft = await loadDraft();
          if (draft) {
            // Show resume prompt to user
            setShowResumePrompt(true);
            return;
          }
          
          // No draft found, check if user has completed quiz
          const quizId = await checkQuizCompletion();
          if (!quizId) {
            // No quiz completion found, but allow direct application
            // Just pre-fill with user email if available
            setFormData(prev => ({
              ...prev,
              email_address: user?.email || prev.email_address,
            }));
          }
        }
        
        setIsDraftLoaded(true);
      } catch (error) {
        console.error('Error initializing form data:', error);
        setIsDraftLoaded(true);
      }
    };

    initializeFormData();
  }, [user, isDraftLoaded, searchParams, loadDraft, checkQuizCompletion, navigate]);

  // Auto-save draft periodically and on step changes
  useEffect(() => {
    if (!user || !isDraftLoaded || currentStep === 1) return;
    
    const saveTimer = setTimeout(() => {
      const quizId = searchParams.get('quiz_id') || localStorage.getItem('quiz_response_id');
      saveDraft(formData, currentStep, quizId || undefined);
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [formData, currentStep, user, isDraftLoaded, saveDraft, searchParams]);

  const handleResumeDraft = async () => {
    const draft = await loadDraft();
    if (draft) {
      setFormData(draft.form_data);
      setCurrentStep(draft.current_step);
      toast.success("Resuming from where you left off!");
    }
    setShowResumePrompt(false);
    setIsDraftLoaded(true);
  };

  const handleStartFresh = () => {
    setShowResumePrompt(false);
    setIsDraftLoaded(true);
  };

  const updateFormData = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.legal_corporation_name &&
          formData.physical_address &&
          formData.city &&
          formData.state &&
          formData.zip &&
          formData.entity_type &&
          formData.telephone_number &&
          formData.email_address
        );
      case 2:
        return !!(formData.federal_tax_id);
      case 3:
        return !!(
          formData.principal_name &&
          formData.principal_title &&
          formData.principal_ssn &&
          formData.principal_date_of_birth &&
          formData.principal_home_address &&
          formData.principal_city &&
          formData.principal_state &&
          formData.principal_zip &&
          formData.principal_email &&
          formData.principal_ownership_percentage
        );
      case 4:
        return !!(
          formData.years_in_business &&
          formData.months_in_business &&
          formData.number_of_employees &&
          formData.business_type &&
          formData.business_description
        );
      case 5:
        return !!(
          formData.bank_name &&
          formData.bank_account_type &&
          formData.bank_routing_number &&
          formData.bank_account_number &&
          formData.months_with_bank &&
          formData.average_monthly_deposits &&
          formData.monthly_rent_mortgage &&
          formData.accept_cards.length > 0
        );
      case 6:
        return !!(
          formData.loan_amount_requested &&
          formData.use_of_funds
        );
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fill in all required fields before proceeding.");
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Save progress when moving to next step
      if (user) {
        const quizId = searchParams.get('quiz_id') || localStorage.getItem('quiz_response_id');
        saveDraft(formData, currentStep + 1, quizId || undefined);
      }
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleFileUpload = async (files: File[]): Promise<string[]> => {
    const uploadedFiles: string[] = [];
    
    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('application-documents')
        .upload(fileName, file);
      
      if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload ${file.name}`);
      }
      
      uploadedFiles.push(fileName);
    }
    
    return uploadedFiles;
  };

  const handleSubmit = async () => {
    // Check if user is authenticated first
    if (!user) {
      setShowAuth(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get quiz response ID from URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const quizResponseId = urlParams.get('quiz_id') || localStorage.getItem('quiz_response_id');
      
      // Upload documents first
      let uploadedFileNames: string[] = [];
      if (formData.document_files.length > 0) {
        uploadedFileNames = await handleFileUpload(formData.document_files);
      }

      const applicationData = {
        legal_corporation_name: formData.legal_corporation_name,
        dba_name: formData.dba_name || null,
        physical_address: formData.physical_address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        entity_type: formData.entity_type,
        telephone_number: formData.telephone_number,
        fax_number: formData.fax_number || null,
        website: formData.website || null,
        email_address: formData.email_address,
        federal_tax_id: formData.federal_tax_id,
        state_tax_id: formData.state_tax_id || null,
        state_of_incorporation: formData.state_of_incorporation || null,
        date_incorporated: formData.date_incorporated || null,
        principal_name: formData.principal_name,
        principal_title: formData.principal_title,
        principal_ssn: formData.principal_ssn,
        principal_date_of_birth: formData.principal_date_of_birth,
        principal_home_address: formData.principal_home_address,
        principal_city: formData.principal_city,
        principal_state: formData.principal_state,
        principal_zip: formData.principal_zip,
        principal_home_phone: formData.principal_home_phone || null,
        principal_cell_phone: formData.principal_cell_phone || null,
        principal_email: formData.principal_email,
        principal_ownership_percentage: parseInt(formData.principal_ownership_percentage),
        years_in_business: parseInt(formData.years_in_business),
        months_in_business: parseInt(formData.months_in_business),
        number_of_employees: parseInt(formData.number_of_employees),
        business_type: formData.business_type,
        business_description: formData.business_description,
        bank_name: formData.bank_name,
        bank_account_type: formData.bank_account_type,
        bank_routing_number: formData.bank_routing_number,
        bank_account_number: formData.bank_account_number,
        months_with_bank: parseInt(formData.months_with_bank),
        average_monthly_deposits: parseInt(formData.average_monthly_deposits),
        monthly_rent_mortgage: parseInt(formData.monthly_rent_mortgage),
        accept_cards: formData.accept_cards,
        current_processor: formData.current_processor || null,
        mid_number: formData.mid_number || null,
        monthly_processing_volume: formData.monthly_processing_volume ? parseInt(formData.monthly_processing_volume) : null,
        average_ticket: formData.average_ticket ? parseInt(formData.average_ticket) : null,
        high_ticket: formData.high_ticket ? parseInt(formData.high_ticket) : null,
        loan_amount_requested: parseInt(formData.loan_amount_requested),
        use_of_funds: formData.use_of_funds,
        document_files: uploadedFileNames,
        status: 'applicant',
        // Add tracking fields
        quiz_response_id: quizResponseId || null,
        lead_source: quizResponseId ? 'quiz' : 'direct',
        conversion_stage: 'application',
        // Associate with authenticated user
        user_id: user?.id,
      };

      const { data, error } = await supabase
        .from('usa_applications')
        .insert([applicationData])
        .select('application_reference_number')
        .single();

      if (error) throw error;

      // Store reference number for success page
      if (data?.application_reference_number) {
        localStorage.setItem('application_reference_number', data.application_reference_number);
      }

      // Send admin notification
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'application',
            data: applicationData,
            submissionId: data.application_reference_number
          }
        });
      } catch (adminNotificationError) {
        console.error('Failed to send admin notification:', adminNotificationError);
        // Don't fail the whole submission if admin notification fails
      }

      // Track conversion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-16458367327/ads_conversion_SUBMIT_APPLICATION_1'
        });
      }

      // Delete draft after successful submission
      await deleteDraft();

      toast.success("Application submitted successfully!");
      navigate("/application-success");
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Company Information</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="legal_corporation_name">Legal Corporation Name *</Label>
                <Input
                  id="legal_corporation_name"
                  value={formData.legal_corporation_name}
                  onChange={(e) => updateFormData('legal_corporation_name', e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dba_name">DBA Name</Label>
                <Input
                  id="dba_name"
                  value={formData.dba_name}
                  onChange={(e) => updateFormData('dba_name', e.target.value)}
                  maxLength={100}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="physical_address">Physical Address *</Label>
                <Input
                  id="physical_address"
                  value={formData.physical_address}
                  onChange={(e) => updateFormData('physical_address', e.target.value)}
                  maxLength={150}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code *</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d{4})/, '$1-$2');
                    updateFormData('zip', formatted.slice(0, 10));
                  }}
                  placeholder="12345 or 12345-6789"
                  maxLength={10}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entity_type">Entity Type *</Label>
                <Select value={formData.entity_type} onValueChange={(value) => updateFormData('entity_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telephone_number">Telephone Number *</Label>
                <Input
                  id="telephone_number"
                  type="tel"
                  value={formData.telephone_number}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                    updateFormData('telephone_number', formatted.slice(0, 14));
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fax_number">Fax Number</Label>
                <Input
                  id="fax_number"
                  type="tel"
                  value={formData.fax_number}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                    updateFormData('fax_number', formatted.slice(0, 14));
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email_address">Email Address *</Label>
                <Input
                  id="email_address"
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => updateFormData('email_address', e.target.value)}
                  placeholder="example@domain.com"
                  maxLength={100}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Federal & State Information</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="federal_tax_id">Federal Tax ID (EIN) *</Label>
                <Input
                  id="federal_tax_id"
                  value={formData.federal_tax_id}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d{7})/, '$1-$2');
                    updateFormData('federal_tax_id', formatted.slice(0, 10));
                  }}
                  placeholder="12-3456789"
                  maxLength={10}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state_tax_id">State Tax ID</Label>
                <Input
                  id="state_tax_id"
                  value={formData.state_tax_id}
                  onChange={(e) => updateFormData('state_tax_id', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state_of_incorporation">State of Incorporation</Label>
                <Select value={formData.state_of_incorporation} onValueChange={(value) => updateFormData('state_of_incorporation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date_incorporated">Date Incorporated</Label>
                <Input
                  id="date_incorporated"
                  type="date"
                  value={formData.date_incorporated}
                  onChange={(e) => updateFormData('date_incorporated', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Principal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="principal_name">Principal Name *</Label>
                <Input
                  id="principal_name"
                  value={formData.principal_name}
                  onChange={(e) => updateFormData('principal_name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_title">Principal Title *</Label>
                <Input
                  id="principal_title"
                  value={formData.principal_title}
                  onChange={(e) => updateFormData('principal_title', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_ssn">Principal SSN *</Label>
                <Input
                  id="principal_ssn"
                  value={formData.principal_ssn}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
                    updateFormData('principal_ssn', formatted.slice(0, 11));
                  }}
                  placeholder="123-45-6789"
                  maxLength={11}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_date_of_birth">Principal Date of Birth *</Label>
                <Input
                  id="principal_date_of_birth"
                  type="date"
                  value={formData.principal_date_of_birth}
                  onChange={(e) => updateFormData('principal_date_of_birth', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="principal_home_address">Principal Home Address *</Label>
                <Input
                  id="principal_home_address"
                  value={formData.principal_home_address}
                  onChange={(e) => updateFormData('principal_home_address', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_city">City *</Label>
                <Input
                  id="principal_city"
                  value={formData.principal_city}
                  onChange={(e) => updateFormData('principal_city', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_state">State *</Label>
                <Select value={formData.principal_state} onValueChange={(value) => updateFormData('principal_state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_zip">ZIP Code *</Label>
                <Input
                  id="principal_zip"
                  value={formData.principal_zip}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d{4})/, '$1-$2');
                    updateFormData('principal_zip', formatted.slice(0, 10));
                  }}
                  placeholder="12345 or 12345-6789"
                  maxLength={10}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_home_phone">Home Phone</Label>
                <Input
                  id="principal_home_phone"
                  type="tel"
                  value={formData.principal_home_phone}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                    updateFormData('principal_home_phone', formatted.slice(0, 14));
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_cell_phone">Cell Phone</Label>
                <Input
                  id="principal_cell_phone"
                  type="tel"
                  value={formData.principal_cell_phone}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                    updateFormData('principal_cell_phone', formatted.slice(0, 14));
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_email">Principal Email *</Label>
                <Input
                  id="principal_email"
                  type="email"
                  value={formData.principal_email}
                  onChange={(e) => updateFormData('principal_email', e.target.value)}
                  placeholder="example@domain.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_ownership_percentage">Ownership Percentage *</Label>
                <Input
                  id="principal_ownership_percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.principal_ownership_percentage}
                  onChange={(e) => updateFormData('principal_ownership_percentage', e.target.value)}
                  placeholder="%"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Business & Financial Information</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="years_in_business">Years in Business *</Label>
                <Input
                  id="years_in_business"
                  type="number"
                  min="0"
                  value={formData.years_in_business}
                  onChange={(e) => updateFormData('years_in_business', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="months_in_business">Additional Months *</Label>
                <Input
                  id="months_in_business"
                  type="number"
                  min="0"
                  max="11"
                  value={formData.months_in_business}
                  onChange={(e) => updateFormData('months_in_business', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="number_of_employees">Number of Employees *</Label>
                <Input
                  id="number_of_employees"
                  type="number"
                  min="1"
                  value={formData.number_of_employees}
                  onChange={(e) => updateFormData('number_of_employees', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="business_type">Business Type *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The category that best describes your business (e.g., Restaurant, Retail Store, Construction, Healthcare, etc.)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="business_type"
                  value={formData.business_type}
                  onChange={(e) => updateFormData('business_type', e.target.value)}
                  placeholder="e.g., Restaurant, Retail, Construction"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="business_description">Business Description *</Label>
                <Textarea
                  id="business_description"
                  value={formData.business_description}
                  onChange={(e) => updateFormData('business_description', e.target.value)}
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="average_monthly_deposits">Average Monthly Deposits *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The average amount of money deposited into your business bank account each month. Check your bank statements for the past 3-6 months and calculate the average.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="average_monthly_deposits"
                  type="number"
                  min="0"
                  value={formData.average_monthly_deposits}
                  onChange={(e) => updateFormData('average_monthly_deposits', e.target.value)}
                  placeholder="$0"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthly_rent_mortgage">Monthly Rent/Mortgage *</Label>
                <Input
                  id="monthly_rent_mortgage"
                  type="number"
                  min="0"
                  value={formData.monthly_rent_mortgage}
                  onChange={(e) => updateFormData('monthly_rent_mortgage', e.target.value)}
                  placeholder="$0"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Banking & Processing Information</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name *</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => updateFormData('bank_name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bank_account_type">Account Type *</Label>
                <Select value={formData.bank_account_type} onValueChange={(value) => updateFormData('bank_account_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Checking">Checking</SelectItem>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Business Checking">Business Checking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bank_routing_number">Routing Number *</Label>
                <Input
                  id="bank_routing_number"
                  value={formData.bank_routing_number}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').slice(0, 9);
                    updateFormData('bank_routing_number', formatted);
                  }}
                  placeholder="123456789"
                  maxLength={9}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number *</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').slice(0, 17);
                    updateFormData('bank_account_number', formatted);
                  }}
                  placeholder="Account number (up to 17 digits)"
                  maxLength={17}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="months_with_bank">Months with Bank *</Label>
                <Input
                  id="months_with_bank"
                  type="number"
                  min="0"
                  value={formData.months_with_bank}
                  onChange={(e) => updateFormData('months_with_bank', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Do you accept credit cards?</Label>
                <div className="space-y-2">
                  {['Visa', 'MasterCard', 'American Express', 'Discover'].map((card) => (
                    <div key={card} className="flex items-center space-x-2">
                      <Checkbox
                        id={card}
                        checked={formData.accept_cards.includes(card)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormData('accept_cards', [...formData.accept_cards, card]);
                          } else {
                            updateFormData('accept_cards', formData.accept_cards.filter(c => c !== card));
                          }
                        }}
                      />
                      <Label htmlFor={card}>{card}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current_processor">Current Processor</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The company that processes your credit card payments (e.g., Square, Stripe, PayPal, First Data, etc.). Check your credit card processing statements or contact your payment provider.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="current_processor"
                  value={formData.current_processor}
                  onChange={(e) => updateFormData('current_processor', e.target.value)}
                  placeholder="e.g., Square, Stripe, PayPal"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="mid_number">MID Number</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Merchant ID Number - a unique identifier for your business with your credit card processor. Find this on your processing statements or contact your payment processor.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="mid_number"
                  value={formData.mid_number}
                  onChange={(e) => updateFormData('mid_number', e.target.value)}
                  placeholder="Usually 10-15 digits"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthly_processing_volume">Monthly Processing Volume</Label>
                <Input
                  id="monthly_processing_volume"
                  type="number"
                  min="0"
                  value={formData.monthly_processing_volume}
                  onChange={(e) => updateFormData('monthly_processing_volume', e.target.value)}
                  placeholder="$0"
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="average_ticket">Average Ticket</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The average dollar amount of a single sale or transaction. Calculate by dividing total monthly sales by number of transactions.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="average_ticket"
                  type="number"
                  min="0"
                  value={formData.average_ticket}
                  onChange={(e) => updateFormData('average_ticket', e.target.value)}
                  placeholder="$0"
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="high_ticket">High Ticket</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The highest dollar amount of a single sale or transaction your business typically processes. This helps lenders understand your business model.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="high_ticket"
                  type="number"
                  min="0"
                  value={formData.high_ticket}
                  onChange={(e) => updateFormData('high_ticket', e.target.value)}
                  placeholder="$0"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Loan Information & Documents</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="loan_amount_requested">Loan Amount Requested *</Label>
                <Input
                  id="loan_amount_requested"
                  type="number"
                  min="1000"
                  value={formData.loan_amount_requested}
                  onChange={(e) => updateFormData('loan_amount_requested', e.target.value)}
                  placeholder="$1,000"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="use_of_funds">Use of Funds *</Label>
                <Textarea
                  id="use_of_funds"
                  value={formData.use_of_funds}
                  onChange={(e) => updateFormData('use_of_funds', e.target.value)}
                  rows={4}
                  placeholder="Please describe how you plan to use the loan funds..."
                  required
                />
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Required Documents</h3>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      📱 Mobile Upload Tips - Make it Faster:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-blue-700 dark:text-blue-300">
                      <li>Use your phone's banking app to download statements as PDFs</li>
                      <li>Take clear, well-lit photos if documents are physical</li>
                      <li>Ensure all text is readable before uploading</li>
                      <li>Upload files one by one rather than selecting multiple at once</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Bank Statements & Business Registration *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please upload the following documents:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1 mb-4">
                    <li><strong>Bank Statements:</strong> Minimum 4 months (6-12 months preferred)</li>
                    <li><strong>Business Registration:</strong> Articles of incorporation, business license, or registration certificate</li>
                    <li><strong>Additional:</strong> Any other supporting financial documents</li>
                  </ul>
                  
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors relative cursor-pointer"
                    onClick={() => document.getElementById('document_upload')?.click()}
                  >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-base font-medium">Upload Your Documents</p>
                      <p className="text-sm text-muted-foreground">
                        Click here or drag and drop your files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
                      </p>
                    </div>
                    <Input
                      id="document_upload"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        updateFormData('document_files', files);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                  
                  {formData.document_files.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Selected Files:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {formData.document_files.map((file, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {file.name} ({Math.round(file.size / 1024)}KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show resume prompt if user has existing draft
  if (showResumePrompt) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
          <Header />
          
          <div className="container mx-auto px-4 py-4 md:py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-xl border-0 md:border">
                <CardContent className="p-4 md:p-8 text-center">
                  <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4">Welcome Back!</h2>
                  <p className="text-muted-foreground mb-6">
                    We found a saved application in progress. Would you like to continue where you left off or start fresh?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={handleResumeDraft} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Resume Application
                    </Button>
                    <Button variant="outline" onClick={handleStartFresh}>
                      Start Fresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Footer />
        </div>
      </TooltipProvider>
    );
  }

  // Show authentication form if user is not authenticated and showAuth is true
  if (showAuth || (!user && !loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Business Loan Application</h1>
              <p className="text-sm md:text-base text-muted-foreground mb-6">
                Step 1 of {totalSteps}: Create Your Secure Account
              </p>
              {/* Progress */}
              <div className="max-w-md mx-auto mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs md:text-sm font-medium">Step 1 of {totalSteps}</span>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {Math.round((1 / totalSteps) * 100)}% Complete
                  </span>
                </div>
                <Progress value={(1 / totalSteps) * 100} className="h-2" />
              </div>
            </div>
            
            <ApplicationAuth
              email={searchParams.get('email') || formData.email_address}
              name={searchParams.get('name') || formData.principal_name}
              onAuthSuccess={() => setShowAuth(false)}
            />
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile-optimized header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Business Loan Application</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Complete your secure application in {totalSteps} steps
          </p>
          <div className="max-w-md mx-auto">
            <Progress value={(currentStep / totalSteps) * 100} className="h-2 md:h-3" />
            <p className="text-xs md:text-sm text-muted-foreground mt-2">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 md:border">
            <CardContent className="p-4 md:p-8">
              {renderStep()}
              
              {/* Mobile-optimized navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto order-2 sm:order-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button
                    onClick={nextStep}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
    </TooltipProvider>
  );
};

export default Application;