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
import { intervalToDuration } from "date-fns";

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
  const [autoFilledBusinessAge, setAutoFilledBusinessAge] = useState(false);
  const { user, loading } = useAuth();
  const totalSteps = 6;
  
  const [formData, setFormData] = useState<ApplicationData>({
    // Company Information
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
    
    // Federal & State Information
    federal_tax_id: "",
    state_tax_id: "",
    state_of_incorporation: "",
    date_incorporated: "",
    
    // Principal Information
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
    
    // Business Information
    years_in_business: "",
    months_in_business: "",
    number_of_employees: "",
    business_type: "",
    business_description: "",
    
    // Bank Information
    bank_name: "",
    bank_account_type: "",
    bank_routing_number: "",
    bank_account_number: "",
    months_with_bank: "",
    
    // Financial Information
    average_monthly_deposits: "",
    monthly_rent_mortgage: "",
    
    // Processing Information
    accept_cards: [],
    current_processor: "",
    mid_number: "",
    monthly_processing_volume: "",
    average_ticket: "",
    high_ticket: "",
    
    // Loan Information
    loan_amount_requested: "",
    use_of_funds: "",
    
    // Document Files
    document_files: []
  });

  // Initialize form data from URL params or user account
  useEffect(() => {
    if (!loading) {
      // Pre-fill from quiz data if available
      const name = searchParams.get('name');
      const email = searchParams.get('email');
      const phone = searchParams.get('phone');
      const loanAmount = searchParams.get('loanAmount');
      const company = searchParams.get('company');

      const updates: Partial<ApplicationData> = {};
      
      if (name) updates.principal_name = name;
      if (email) updates.email_address = email;
      if (phone) updates.telephone_number = phone;
      if (loanAmount) updates.loan_amount_requested = loanAmount;
      if (company) updates.legal_corporation_name = company;
      
      // Use user email if logged in and no email from quiz
      if (user?.email && !email) {
        updates.email_address = user.email;
      }

      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [user, loading, searchParams]);

  // Prefill Years/Months in Business from quiz response and hide fields
  useEffect(() => {
    const prefillBusinessAge = async () => {
      if (autoFilledBusinessAge) return;
      try {
        const quizId = searchParams.get('quiz_id') || localStorage.getItem('quiz_response_id');
        let quiz: any = null;
        if (quizId) {
          const { data } = await supabase
            .from('quiz_responses')
            .select('founding_year, founding_month, founding_day, time_in_business')
            .eq('id', quizId)
            .maybeSingle();
          quiz = data;
        } else {
          const email = searchParams.get('email') || user?.email || null;
          if (email) {
            const { data } = await supabase
              .from('quiz_responses')
              .select('founding_year, founding_month, founding_day, time_in_business')
              .eq('email', email)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            quiz = data;
          }
        }

        if (quiz) {
          const y = quiz.founding_year as number | null;
          const m = quiz.founding_month as number | null;
          const d = quiz.founding_day as number | null;
          let years: number | null = null;
          let months: number | null = null;

          if (y && y > 0) {
            const start = new Date(y, (m && m > 0 ? m - 1 : 0), d && d > 0 ? d : 1);
            const duration = intervalToDuration({ start, end: new Date() });
            years = duration.years ?? 0;
            months = duration.months ?? 0;
          } else if (quiz.time_in_business) {
            switch (quiz.time_in_business) {
              case 'startup':
                years = 0; months = 0; break;
              case '6-12':
                years = 0; months = 9; break;
              case '1-2':
                years = 1; months = 6; break;
              case '2-5':
                years = 3; months = 0; break;
              case '+5':
              case '5+':
                years = 6; months = 0; break;
              default:
                break;
            }
          }

          if (years !== null && months !== null) {
            setFormData(prev => ({
              ...prev,
              years_in_business: String(years),
              months_in_business: String(months),
            }));
            setAutoFilledBusinessAge(true);
          }
        }
      } catch (e) {
        console.error('Error pre-filling business age:', e);
      }
    };

    prefillBusinessAge();
  }, [searchParams, user, autoFilledBusinessAge]);

  const updateFormData = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const getFieldValidationClass = (fieldName: keyof ApplicationData, requiredFields: string[]) => {
    if (!showValidationErrors) return "";
    
    const value = formData[fieldName];
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
    const isRequired = requiredFields.includes(fieldName);
    
    return isRequired && isEmpty ? "border-destructive" : "";
  };

  const validateStep = (step: number): boolean => {
    const requiredFields = getStepRequiredFields(step);
    
    for (const field of requiredFields) {
      const value = formData[field as keyof ApplicationData];
      if (Array.isArray(value)) {
        if (value.length === 0) return false;
      } else {
        if (!value || value.toString().trim() === "") return false;
      }
    }
    
    return true;
  };

  const getStepRequiredFields = (step: number): string[] => {
    switch (step) {
      case 1: // Company + EIN + Loan Info
        return ['legal_corporation_name', 'physical_address', 'city', 'state', 'zip', 'entity_type', 'telephone_number', 'email_address', 'federal_tax_id', 'loan_amount_requested', 'use_of_funds'];
      case 2: // Principal + Submit
        return ['principal_name', 'principal_title', 'principal_ssn', 'principal_date_of_birth', 'principal_home_address', 'principal_city', 'principal_state', 'principal_zip', 'principal_email', 'principal_ownership_percentage'];
      default:
        return [];
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      setShowValidationErrors(true);
      toast.error("Please fill in all required fields before proceeding.");
      return;
    }
    
    setShowValidationErrors(false);
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload PDF, Word, Excel, or image files only';
    }

    return null;
  };

  const handleFileUpload = async (files: FileList) => {
    const validFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return [];

    const uploadedFiles: string[] = [];

    try {
      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `applications/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        uploadedFiles.push(publicUrl);
      }

      if (uploadedFiles.length > 0) {
        toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
      }

      return uploadedFiles;
    } catch (error) {
      console.error('Error in file upload process:', error);
      toast.error('An error occurred during file upload');
      return [];
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setShowValidationErrors(true);
      toast.error("Please fill in all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload documents if any
      const documentUrls = formData.document_files.length > 0 
        ? await handleFileUpload(formData.document_files as any) 
        : [];

      // Prepare data for submission
      const submissionData = {
        user_id: user?.id || null,
        // Company
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
        // Federal & State
        federal_tax_id: formData.federal_tax_id,
        state_tax_id: formData.state_tax_id || null,
        state_of_incorporation: formData.state_of_incorporation || null,
        date_incorporated: formData.date_incorporated || null,
        // Principal
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
        // Loan
        loan_amount_requested: parseInt(formData.loan_amount_requested),
        use_of_funds: formData.use_of_funds,
        // Documents & tracking
        document_files: documentUrls,
        quiz_response_id: searchParams.get('quiz_id') || localStorage.getItem('quiz_response_id') || null
      };

      // Submit to database
      const { data, error } = await supabase
        .from('usa_applications_simplified')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Send notifications
      try {
        await supabase.functions.invoke('send-application-email', {
          body: { 
            applicationData: submissionData,
            applicationId: data.id,
            applicationType: 'usa'
          }
        });
      } catch (emailError) {
        console.error('Error sending application email:', emailError);
      }

      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: { 
            type: 'new_application',
            data: {
              applicant_name: formData.principal_name,
              applicant_email: formData.email_address,
              loan_amount: formData.loan_amount_requested,
              application_type: 'USA Application',
              application_id: data.id
            }
          }
        });
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
      }

      // Track conversion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-16458367327/ads_conversion_SUBMIT_APPLICATION_1'
        });
      }

      toast.success("Application submitted successfully!");
      navigate("/application-success");
    } catch (error) {
      console.error('Error submitting application:', error);
      console.error('Form data that failed:', formData);
      
      toast.error("There was an error submitting your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company basics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legal_corporation_name">Legal Corporation Name *</Label>
                  <Input
                    id="legal_corporation_name"
                    value={formData.legal_corporation_name}
                    onChange={(e) => updateFormData('legal_corporation_name', e.target.value)}
                    className={getFieldValidationClass('legal_corporation_name', getStepRequiredFields(1))}
                    placeholder="ABC Corp, LLC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dba_name">DBA Name (if applicable)</Label>
                  <Input
                    id="dba_name"
                    value={formData.dba_name}
                    onChange={(e) => updateFormData('dba_name', e.target.value)}
                    placeholder="Doing Business As"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="physical_address">Physical Address *</Label>
                <Input
                  id="physical_address"
                  value={formData.physical_address}
                  onChange={(e) => updateFormData('physical_address', e.target.value)}
                  className={getFieldValidationClass('physical_address', getStepRequiredFields(1))}
                  placeholder="123 Business St"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={getFieldValidationClass('city', getStepRequiredFields(1))}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)}>
                    <SelectTrigger className={getFieldValidationClass('state', getStepRequiredFields(1))}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
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
                    onChange={(e) => updateFormData('zip', e.target.value)}
                    className={getFieldValidationClass('zip', getStepRequiredFields(1))}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity_type">Type of Entity *</Label>
                  <Select value={formData.entity_type} onValueChange={(value) => updateFormData('entity_type', value)}>
                    <SelectTrigger className={getFieldValidationClass('entity_type', getStepRequiredFields(1))}>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="s_corp">S-Corporation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone_number">Business Phone *</Label>
                  <Input
                    id="telephone_number"
                    value={formData.telephone_number}
                    onChange={(e) => updateFormData('telephone_number', e.target.value)}
                    className={getFieldValidationClass('telephone_number', getStepRequiredFields(1))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fax_number">Fax Number</Label>
                  <Input
                    id="fax_number"
                    value={formData.fax_number}
                    onChange={(e) => updateFormData('fax_number', e.target.value)}
                    placeholder="(555) 123-4568"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_address">Email Address *</Label>
                <Input
                  id="email_address"
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => updateFormData('email_address', e.target.value)}
                  className={getFieldValidationClass('email_address', getStepRequiredFields(1))}
                  placeholder="business@example.com"
                />
              </div>

              {/* EIN and Incorporation */}
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
                    className={getFieldValidationClass('federal_tax_id', getStepRequiredFields(1))}
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

              {/* Loan Information */}
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
                    className={getFieldValidationClass('loan_amount_requested', getStepRequiredFields(1))}
                  />
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
                    className={getFieldValidationClass('use_of_funds', getStepRequiredFields(1))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
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
                  className={getFieldValidationClass('federal_tax_id', getStepRequiredFields(2))}
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
                  className={getFieldValidationClass('principal_name', getStepRequiredFields(3))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_title">Principal Title *</Label>
                <Input
                  id="principal_title"
                  value={formData.principal_title}
                  onChange={(e) => updateFormData('principal_title', e.target.value)}
                  required
                  className={getFieldValidationClass('principal_title', getStepRequiredFields(3))}
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
                  className={getFieldValidationClass('principal_ssn', getStepRequiredFields(3))}
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
                  className={getFieldValidationClass('principal_date_of_birth', getStepRequiredFields(3))}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="principal_home_address">Principal Home Address *</Label>
                <Input
                  id="principal_home_address"
                  value={formData.principal_home_address}
                  onChange={(e) => updateFormData('principal_home_address', e.target.value)}
                  required
                  className={getFieldValidationClass('principal_home_address', getStepRequiredFields(3))}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="same_as_company_address"
                    checked={formData.principal_home_address === formData.physical_address && 
                             formData.principal_city === formData.city && 
                             formData.principal_state === formData.state && 
                             formData.principal_zip === formData.zip}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData('principal_home_address', formData.physical_address);
                        updateFormData('principal_city', formData.city);
                        updateFormData('principal_state', formData.state);
                        updateFormData('principal_zip', formData.zip);
                      }
                    }}
                  />
                  <Label htmlFor="same_as_company_address" className="text-sm font-medium">Same as Company Address</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_city">City *</Label>
                <Input
                  id="principal_city"
                  value={formData.principal_city}
                  onChange={(e) => updateFormData('principal_city', e.target.value)}
                  required
                  className={getFieldValidationClass('principal_city', getStepRequiredFields(3))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="principal_state">State *</Label>
                <Select value={formData.principal_state} onValueChange={(value) => updateFormData('principal_state', value)}>
                  <SelectTrigger className={getFieldValidationClass('principal_state', getStepRequiredFields(3))}>
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
                  className={getFieldValidationClass('principal_zip', getStepRequiredFields(3))}
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
                  className={getFieldValidationClass('principal_email', getStepRequiredFields(3))}
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
                  className={getFieldValidationClass('principal_ownership_percentage', getStepRequiredFields(3))}
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
              {autoFilledBusinessAge ? (
                <div className="space-y-2 md:col-span-2">
                  <Label>Business Age</Label>
                  <div className="text-sm text-muted-foreground">
                    {`${formData.years_in_business || '0'} years, ${formData.months_in_business || '0'} months (from your quiz)`}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="years_in_business">Years in Business *</Label>
                    <Input
                      id="years_in_business"
                      type="number"
                      min="0"
                      value={formData.years_in_business}
                      onChange={(e) => updateFormData('years_in_business', e.target.value)}
                      required
                      className={getFieldValidationClass('years_in_business', getStepRequiredFields(4))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="months_in_business">Months in Business *</Label>
                    <Input
                      id="months_in_business"
                      type="number"
                      min="0"
                      max="11"
                      value={formData.months_in_business}
                      onChange={(e) => updateFormData('months_in_business', e.target.value)}
                      required
                      className={getFieldValidationClass('months_in_business', getStepRequiredFields(4))}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="number_of_employees">Number of Employees *</Label>
                <Input
                  id="number_of_employees"
                  type="number"
                  min="1"
                  value={formData.number_of_employees}
                  onChange={(e) => updateFormData('number_of_employees', e.target.value)}
                  required
                  className={getFieldValidationClass('number_of_employees', getStepRequiredFields(4))}
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
                  className={getFieldValidationClass('business_type', getStepRequiredFields(4))}
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
                  className={getFieldValidationClass('business_description', getStepRequiredFields(4))}
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
                  className={getFieldValidationClass('average_monthly_deposits', getStepRequiredFields(4))}
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthly_rent_mortgage">Monthly Rent/Mortgage</Label>
                <Input
                  id="monthly_rent_mortgage"
                  type="number"
                  min="0"
                  value={formData.monthly_rent_mortgage}
                  onChange={(e) => updateFormData('monthly_rent_mortgage', e.target.value)}
                  placeholder="$0"
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
                  className={getFieldValidationClass('bank_name', getStepRequiredFields(5))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bank_account_type">Account Type *</Label>
                <Select value={formData.bank_account_type} onValueChange={(value) => updateFormData('bank_account_type', value)}>
                  <SelectTrigger className={getFieldValidationClass('bank_account_type', getStepRequiredFields(5))}>
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
                  className={getFieldValidationClass('bank_routing_number', getStepRequiredFields(5))}
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
                  className={getFieldValidationClass('bank_account_number', getStepRequiredFields(5))}
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
                  className={getFieldValidationClass('months_with_bank', getStepRequiredFields(5))}
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
                  className={getFieldValidationClass('loan_amount_requested', getStepRequiredFields(6))}
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
                  className={getFieldValidationClass('use_of_funds', getStepRequiredFields(6))}
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
                         Supported formats: PDF, Images (JPG, PNG, GIF, WebP, BMP, TIFF), DOC, DOCX (Max 10MB each)
                       </p>
                    </div>
                    <Input
                      id="document_upload"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.doc,.docx,application/pdf,image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                       onChange={(e) => {
                         const files = Array.from(e.target.files || []);
                         if (files.length > 0) {
                           // Validate files before adding
                           const validFiles: File[] = [];
                           const errors: string[] = [];
                           
                           files.forEach(file => {
                             const validationError = validateFile(file);
                             if (validationError) {
                               errors.push(validationError);
                             } else {
                               validFiles.push(file);
                             }
                           });
                           
                           if (errors.length > 0) {
                             toast.error(errors.join('\n'));
                           }
                           
                           if (validFiles.length > 0) {
                             updateFormData('document_files', [...formData.document_files, ...validFiles]);
                           }
                         }
                         // Reset the input value to allow re-selecting the same file
                         e.target.value = '';
                       }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                  
                  {formData.document_files.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Selected Files:</p>
                      <ul className="text-sm space-y-1">
                        {formData.document_files.map((file, index) => (
                          <li key={index} className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground">({Math.round(file.size / 1024)}KB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFiles = formData.document_files.filter((_, i) => i !== index);
                                updateFormData('document_files', newFiles);
                              }}
                              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              ×
                            </Button>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Business Loan Application</h1>
              <p className="text-muted-foreground">Fast, secure, and simple application process</p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
                <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
              </div>
              <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
            </div>

            {renderStep()}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <Footer />

        {showAuth && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <ApplicationAuth 
              email={formData.email_address}
              name={formData.principal_name}
              onAuthSuccess={() => setShowAuth(false)}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Application;
