import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Building2, User, CreditCard, FileText, CheckCircle, Upload, Info, MapPin, DollarSign, Shield } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationAuth } from "@/components/ApplicationAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";

// Reuse the Canadian application UI/flow but submit to the USA table with US-specific IDs

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

interface USApplicationData {
  // Business Information (mirrors Canadian structure for UI consistency)
  legal_business_name: string;
  dba_name: string;
  physical_address: string;
  mailing_address: string;
  city: string;
  state: string;
  zip: string;
  business_phone: string;
  business_fax: string;
  type_of_entity: string;
  federal_tax_id: string; // EIN
  business_start_date: string; // Date Incorporated
  number_of_locations: string;
  business_property_type: string;
  monthly_rent_or_mortgage: string;
  landlord_or_bank_company_name: string;
  landlord_or_bank_phone: string;
  annual_gross_sales: string;
  amount_requested: string;
  use_of_funds: string;
  existing_advance: boolean;
  if_so_with_who: string;
  outstanding_balance: string;

  // Primary Owner Information
  principal_owner_name: string;
  principal_title: string;
  ownership_percentage: string;
  ssn: string; // US personal ID
  dob: string;
  home_address: string;
  city_owner: string;
  state_owner: string;
  zip_owner: string;
  home_phone: string;
  cell_phone: string;
  email_address: string;

  // Secondary Owner Information (optional - not mapped to USA simplified table)
  principal_owner_name_2: string;
  ownership_percentage_2: string;
  ssn_2: string;
  dob_2: string;
  home_address_2: string;
  city_owner_2: string;
  state_owner_2: string;
  zip_owner_2: string;
  home_phone_2: string;
  cell_phone_2: string;
  email_address_2: string;

  // Credit Card Processing
  current_credit_card_processor: string;
  annual_credit_card_sales: string;
  average_monthly_cc_volume: string;
  additional_information: string;

  // Documents
  document_files: File[];

  // Tracking fields
  quiz_response_id: string | null;
}

const ApplicationUS = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState({ startDate: false, amount: false, annualSales: false });
  const { user, loading } = useAuth();
  const totalSteps = 2;

  const [formData, setFormData] = useState<USApplicationData>({
    legal_business_name: "",
    dba_name: "",
    physical_address: "",
    mailing_address: "",
    city: "",
    state: "",
    zip: "",
    business_phone: "",
    business_fax: "",
    type_of_entity: "",
    federal_tax_id: "",
    business_start_date: "",
    number_of_locations: "1",
    business_property_type: "",
    monthly_rent_or_mortgage: "",
    landlord_or_bank_company_name: "",
    landlord_or_bank_phone: "",
    annual_gross_sales: "",
    amount_requested: "",
    use_of_funds: "",
    existing_advance: false,
    if_so_with_who: "",
    outstanding_balance: "",

    principal_owner_name: "",
    principal_title: "",
    ownership_percentage: "",
    ssn: "",
    dob: "",
    home_address: "",
    city_owner: "",
    state_owner: "",
    zip_owner: "",
    home_phone: "",
    cell_phone: "",
    email_address: "",

    principal_owner_name_2: "",
    ownership_percentage_2: "",
    ssn_2: "",
    dob_2: "",
    home_address_2: "",
    city_owner_2: "",
    state_owner_2: "",
    zip_owner_2: "",
    home_phone_2: "",
    cell_phone_2: "",
    email_address_2: "",

    current_credit_card_processor: "",
    annual_credit_card_sales: "",
    average_monthly_cc_volume: "",
    additional_information: "",

    document_files: [],

    quiz_response_id: null,
  });

  // Initialize form data from URL params or user account (authenticated users only)
  useEffect(() => {
    if (!loading && user) {
      const name = searchParams.get('name');
      const phone = searchParams.get('phone');
      const loanAmount = searchParams.get('loanAmount');
      const company = searchParams.get('company');
      const quizId = searchParams.get('quizResponseId') || searchParams.get('quiz_id');

      const updates: Partial<USApplicationData> = {};
      if (name) updates.principal_owner_name = name;
      if (phone) updates.business_phone = phone;
      if (loanAmount) updates.amount_requested = loanAmount;
      if (company) updates.legal_business_name = company;
      if (quizId) updates.quiz_response_id = quizId;

      // Always use authenticated user's email (security measure)
      updates.email_address = user.email || '';

      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [user, loading, searchParams]);

  // Prefill business start/incorporation date and key financials from quiz response
  useEffect(() => {
    const run = async () => {
      const quizId = searchParams.get('quizResponseId') || searchParams.get('quiz_id') || formData.quiz_response_id || localStorage.getItem('quiz_response_id');
      try {
        let quiz: any = null;
        if (quizId) {
          const { data, error } = await supabase
            .from('quiz_responses')
            .select('founding_year, founding_month, founding_day, loan_amount, monthly_revenue, use_of_funds')
            .eq('id', quizId)
            .maybeSingle();
          if (error) console.error('Error fetching quiz:', error);
          quiz = data;
        } else {
          const email = searchParams.get('email') || user?.email || null;
          if (email) {
            const { data, error } = await supabase
              .from('quiz_responses')
              .select('founding_year, founding_month, founding_day, loan_amount, monthly_revenue, use_of_funds')
              .eq('email', email)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (error) console.error('Error fetching quiz by email:', error);
            quiz = data;
          }
        }

        if (!quiz) return;

        const updates: Partial<USApplicationData> = {};
        const flags: any = { ...prefilled };

        if (!formData.business_start_date && quiz.founding_year) {
          const y = quiz.founding_year as number;
          const m = (quiz.founding_month as number) || 1;
          const d = (quiz.founding_day as number) || 1;
          updates.business_start_date = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          flags.startDate = true;
        }
        if (!formData.amount_requested && quiz.loan_amount) {
          updates.amount_requested = String(quiz.loan_amount);
          flags.amount = true;
        }
        if (!formData.annual_gross_sales && quiz.monthly_revenue) {
          const annual = Number(quiz.monthly_revenue) * 12;
          updates.annual_gross_sales = String(annual);
          flags.annualSales = true;
        }
        if (!formData.use_of_funds && quiz.use_of_funds) {
          updates.use_of_funds = quiz.use_of_funds;
        }

        if (Object.keys(updates).length) {
          setFormData(prev => ({ ...prev, ...updates }));
          setPrefilled(flags);
        }
      } catch (e) {
        console.error('Error pre-filling from quiz:', e);
      }
    };
    run();
  }, [searchParams, formData.quiz_response_id, user]);

  // Format functions for input fields
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const formatSSN = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`;
  };

  const formatEIN = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 9)}`;
  };

  const formatZip = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}`;
  };

  const updateFormData = (field: keyof USApplicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const getStepRequiredFields = (step: number): string[] => {
    switch (step) {
      case 1:
        return ['legal_business_name', 'physical_address', 'city', 'state', 'zip', 'business_phone', 'type_of_entity', 'federal_tax_id', 'business_start_date', 'annual_gross_sales', 'amount_requested', 'use_of_funds'];
      case 2:
        return ['principal_owner_name', 'principal_title', 'ownership_percentage', 'ssn', 'dob', 'home_address', 'city_owner', 'state_owner', 'zip_owner', 'email_address'];
      default:
        return [];
    }
  };

  const getFieldValidationClass = (fieldName: keyof USApplicationData, requiredFields: string[]) => {
    if (!showValidationErrors) return "";
    const value = formData[fieldName];
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
    const isRequired = requiredFields.includes(fieldName);
    return isRequired && isEmpty ? "border-destructive" : "";
  };

  const validateStep = (step: number): boolean => {
    const requiredFields = getStepRequiredFields(step);
    console.log(`Validating step ${step}, required fields:`, requiredFields);
    
    for (const field of requiredFields) {
      const value = formData[field as keyof USApplicationData];
      console.log(`Field ${field}:`, value);
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          console.log(`Validation failed: ${field} is empty array`);
          return false;
        }
      } else {
        if (!value || value.toString().trim() === "") {
          console.log(`Validation failed: ${field} is empty or null`);
          return false;
        }
      }
    }
    console.log(`Step ${step} validation passed`);
    return true;
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

    if (file.size > maxSize) return 'File size must be less than 10MB';
    if (!allowedTypes.includes(file.type)) return 'Please upload PDF, Word, Excel, or image files only';
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
        const { error: uploadError } = await supabase.storage
          .from('application-documents')
          .upload(filePath, file);
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        const { data: { publicUrl } } = supabase.storage
          .from('application-documents')
          .getPublicUrl(filePath);
        uploadedFiles.push(publicUrl);
      }
      if (uploadedFiles.length > 0) toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
      return uploadedFiles;
    } catch (error) {
      console.error('Error in file upload process:', error);
      toast.error('An error occurred during file upload');
      return [];
    }
  };

  const handleSubmit = async () => {
    // Validate ALL required fields from all steps before submitting
    const allRequiredFields = [
      ...getStepRequiredFields(1),
      ...getStepRequiredFields(2)
    ];
    
    const missingFields: string[] = [];
    for (const field of allRequiredFields) {
      const value = formData[field as keyof USApplicationData];
      if (Array.isArray(value)) {
        if (value.length === 0) missingFields.push(field);
      } else {
        if (!value || value.toString().trim() === "") missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      toast.error(`Please complete the following required fields: ${missingFields.join(', ')}`);
      // Go back to step 1 if step 1 fields are missing
      if (getStepRequiredFields(1).some(field => missingFields.includes(field))) {
        setCurrentStep(1);
        setShowValidationErrors(true);
      }
      return;
    }

    // User must be authenticated to submit (enforced by page guard)
    if (!user) return;

    setIsSubmitting(true);
    try {
      const documentUrls = formData.document_files.length > 0 
        ? await handleFileUpload(formData.document_files as any) 
        : [];

      // Map the Canadian-style form data to USA simplified schema
      const submissionData = {
        user_id: user.id,
        // Business
        legal_corporation_name: formData.legal_business_name,
        dba_name: formData.dba_name || null,
        physical_address: formData.physical_address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        entity_type: formData.type_of_entity,
        telephone_number: formData.business_phone,
        fax_number: formData.business_fax || null,
        website: null,
        email_address: formData.email_address,
        federal_tax_id: formData.federal_tax_id,
        state_tax_id: null,
        state_of_incorporation: formData.state || null,
        date_incorporated: formData.business_start_date || null,
        // Principal
        principal_name: formData.principal_owner_name,
        principal_title: formData.principal_title,
        principal_ssn: formData.ssn,
        principal_home_address: formData.home_address,
        principal_city: formData.city_owner,
        principal_state: formData.state_owner,
        principal_zip: formData.zip_owner,
        principal_home_phone: formData.home_phone || null,
        principal_cell_phone: formData.cell_phone || null,
        principal_email: formData.email_address,
        principal_date_of_birth: formData.dob,
        principal_ownership_percentage: parseInt(formData.ownership_percentage),
        // Loan
        loan_amount_requested: parseInt(formData.amount_requested),
        use_of_funds: formData.use_of_funds,
        // Documents & tracking
        document_files: documentUrls,
        quiz_response_id: formData.quiz_response_id
      };

      const { data, error } = await supabase
        .from('usa_applications_simplified')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Notifications
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
              applicant_name: formData.principal_owner_name,
              applicant_email: formData.email_address,
              loan_amount: formData.amount_requested,
              application_type: 'USA Application',
              application_id: data.id
            }
          }
        });
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
      }

      toast.success("Application submitted successfully!");
      if (data?.application_reference_number) {
        try { localStorage.setItem('application_reference_number', data.application_reference_number); } catch {}
      }
      navigate("/application-success");
    } catch (error) {
      console.error('Error submitting application:', error);
      console.error('Form data that failed:', formData);
      let errorMessage = "There was an error submitting your application. Please try again.";
      if (error && typeof error === 'object' && 'message' in (error as any)) {
        errorMessage = `Error: ${(error as any).message}`;
      }
      toast.error(errorMessage);
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
                Business Information (USA)
              </CardTitle>
              <CardDescription>Tell us about your US business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legal_business_name">Legal Business Name *</Label>
                  <Input
                    id="legal_business_name"
                    value={formData.legal_business_name}
                    onChange={(e) => updateFormData('legal_business_name', e.target.value)}
                    className={getFieldValidationClass('legal_business_name', getStepRequiredFields(1))}
                    placeholder="ABC Corp Inc."
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

              <div className="space-y-2">
                <Label htmlFor="mailing_address">Mailing Address (if different)</Label>
                <Input
                  id="mailing_address"
                  value={formData.mailing_address}
                  onChange={(e) => updateFormData('mailing_address', e.target.value)}
                  placeholder="PO Box 123"
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
                      {US_STATES.map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
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
                      const formatted = formatZip(e.target.value);
                      if (formatted.length <= 10) updateFormData('zip', formatted);
                    }}
                    className={getFieldValidationClass('zip', getStepRequiredFields(1))}
                    placeholder="12345 or 12345-6789"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_phone">Business Phone *</Label>
                  <Input
                    id="business_phone"
                    value={formData.business_phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      updateFormData('business_phone', formatted);
                    }}
                    className={getFieldValidationClass('business_phone', getStepRequiredFields(1))}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_fax">Business Fax</Label>
                  <Input
                    id="business_fax"
                    value={formData.business_fax}
                    onChange={(e) => updateFormData('business_fax', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type_of_entity">Type of Entity *</Label>
                  <Select value={formData.type_of_entity} onValueChange={(value) => updateFormData('type_of_entity', value)}>
                    <SelectTrigger className={getFieldValidationClass('type_of_entity', getStepRequiredFields(1))}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="limited_liability">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="non_profit">Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="federal_tax_id">Federal Tax ID (EIN) *</Label>
                  <Input
                    id="federal_tax_id"
                    value={formData.federal_tax_id}
                    onChange={(e) => {
                      const formatted = formatEIN(e.target.value);
                      if (formatted.length <= 10) updateFormData('federal_tax_id', formatted);
                    }}
                    className={getFieldValidationClass('federal_tax_id', getStepRequiredFields(1))}
                    placeholder="12-3456789"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_start_date">Date Incorporated *</Label>
                  <Input
                    id="business_start_date"
                    type="date"
                    value={formData.business_start_date}
                    onChange={(e) => updateFormData('business_start_date', e.target.value)}
                    className={getFieldValidationClass('business_start_date', getStepRequiredFields(1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual_gross_sales">Annual Gross Sales *</Label>
                  <Input
                    id="annual_gross_sales"
                    type="number"
                    value={formData.annual_gross_sales}
                    onChange={(e) => updateFormData('annual_gross_sales', e.target.value)}
                    className={getFieldValidationClass('annual_gross_sales', getStepRequiredFields(1))}
                    placeholder="e.g. 500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_requested">Amount Requested *</Label>
                  <Input
                    id="amount_requested"
                    type="number"
                    value={formData.amount_requested}
                    onChange={(e) => updateFormData('amount_requested', e.target.value)}
                    className={getFieldValidationClass('amount_requested', getStepRequiredFields(1))}
                    placeholder="e.g. 100000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="use_of_funds">Use of Funds *</Label>
                <Textarea
                  id="use_of_funds"
                  value={formData.use_of_funds}
                  onChange={(e) => updateFormData('use_of_funds', e.target.value)}
                  className={getFieldValidationClass('use_of_funds', getStepRequiredFields(1))}
                  placeholder="Tell us how you'll use the funds"
                />
              </div>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Ownership Information (Primary)
              </CardTitle>
              <CardDescription>Provide details of the principal owner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal_owner_name">Owner Full Name *</Label>
                  <Input
                    id="principal_owner_name"
                    value={formData.principal_owner_name}
                    onChange={(e) => updateFormData('principal_owner_name', e.target.value)}
                    className={getFieldValidationClass('principal_owner_name', getStepRequiredFields(2))}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principal_title">Title *</Label>
                  <Input
                    id="principal_title"
                    value={formData.principal_title}
                    onChange={(e) => updateFormData('principal_title', e.target.value)}
                    className={getFieldValidationClass('principal_title', getStepRequiredFields(2))}
                    placeholder="Owner, CEO, President"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownership_percentage">Ownership Percentage *</Label>
                  <Input
                    id="ownership_percentage"
                    type="number"
                    value={formData.ownership_percentage}
                    onChange={(e) => updateFormData('ownership_percentage', e.target.value)}
                    className={getFieldValidationClass('ownership_percentage', getStepRequiredFields(2))}
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ssn">SSN *</Label>
                  <Input
                    id="ssn"
                    value={formData.ssn}
                    onChange={(e) => {
                      const formatted = formatSSN(e.target.value);
                      updateFormData('ssn', formatted);
                    }}
                    className={getFieldValidationClass('ssn', getStepRequiredFields(2))}
                    placeholder="123-45-6789"
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => updateFormData('dob', e.target.value)}
                    className={getFieldValidationClass('dob', getStepRequiredFields(2))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="home_address">Home Address *</Label>
                <Input
                  id="home_address"
                  value={formData.home_address}
                  onChange={(e) => updateFormData('home_address', e.target.value)}
                  className={getFieldValidationClass('home_address', getStepRequiredFields(2))}
                  placeholder="456 Main St"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="same_as_business_address"
                  checked={formData.home_address === formData.physical_address &&
                           formData.city_owner === formData.city &&
                           formData.state_owner === formData.state &&
                           formData.zip_owner === formData.zip}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFormData('home_address', formData.physical_address);
                      updateFormData('city_owner', formData.city);
                      updateFormData('state_owner', formData.state);
                      updateFormData('zip_owner', formData.zip);
                    }
                  }}
                />
                <Label htmlFor="same_as_business_address" className="text-sm font-medium">Same as Business Address</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city_owner">City *</Label>
                  <Input
                    id="city_owner"
                    value={formData.city_owner}
                    onChange={(e) => updateFormData('city_owner', e.target.value)}
                    className={getFieldValidationClass('city_owner', getStepRequiredFields(2))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_owner">State *</Label>
                  <Select value={formData.state_owner} onValueChange={(value) => updateFormData('state_owner', value)}>
                    <SelectTrigger className={getFieldValidationClass('state_owner', getStepRequiredFields(2))}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_owner">ZIP Code *</Label>
                  <Input
                    id="zip_owner"
                    value={formData.zip_owner}
                    onChange={(e) => {
                      const formatted = formatZip(e.target.value);
                      if (formatted.length <= 10) updateFormData('zip_owner', formatted);
                    }}
                    className={getFieldValidationClass('zip_owner', getStepRequiredFields(2))}
                    placeholder="12345 or 12345-6789"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="home_phone">Home Phone</Label>
                  <Input
                    id="home_phone"
                    value={formData.home_phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      updateFormData('home_phone', formatted);
                    }}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cell_phone">Cell Phone</Label>
                  <Input
                    id="cell_phone"
                    value={formData.cell_phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      updateFormData('cell_phone', formatted);
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
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    placeholder="Your authenticated email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This email is locked to your account for security
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Secondary Owner (Optional)</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="principal_owner_name_2" className="text-sm font-medium">Name</Label>
                    <Input
                      id="principal_owner_name_2"
                      value={formData.principal_owner_name_2}
                      onChange={(e) => updateFormData('principal_owner_name_2', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="ownership_percentage_2" className="text-sm font-medium">Ownership %</Label>
                      <Input
                        id="ownership_percentage_2"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.ownership_percentage_2}
                        onChange={(e) => updateFormData('ownership_percentage_2', e.target.value)}
                        className="mt-1"
                        placeholder="%"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ssn_2" className="text-sm font-medium">SSN</Label>
                      <Input
                        id="ssn_2"
                        value={formData.ssn_2}
                        onChange={(e) => {
                          const formatted = formatSSN(e.target.value);
                          updateFormData('ssn_2', formatted);
                        }}
                        className="mt-1"
                        placeholder="123-45-6789"
                        maxLength={11}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="dob_2" className="text-sm font-medium">Date of Birth</Label>
                      <Input
                        id="dob_2"
                        type="date"
                        value={formData.dob_2}
                        onChange={(e) => updateFormData('dob_2', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="home_address_2" className="text-sm font-medium">Home Address</Label>
                      <Input
                        id="home_address_2"
                        value={formData.home_address_2}
                        onChange={(e) => updateFormData('home_address_2', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city_owner_2" className="text-sm font-medium">City</Label>
                      <Input
                        id="city_owner_2"
                        value={formData.city_owner_2}
                        onChange={(e) => updateFormData('city_owner_2', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state_owner_2" className="text-sm font-medium">State</Label>
                      <Select value={formData.state_owner_2} onValueChange={(value) => updateFormData('state_owner_2', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((st) => (
                            <SelectItem key={st} value={st}>{st}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="zip_owner_2" className="text-sm font-medium">ZIP Code</Label>
                      <Input
                        id="zip_owner_2"
                        value={formData.zip_owner_2}
                        onChange={(e) => {
                          const formatted = formatZip(e.target.value);
                          if (formatted.length <= 10) updateFormData('zip_owner_2', formatted);
                        }}
                        className="mt-1"
                        placeholder="12345 or 12345-6789"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <Label htmlFor="home_phone_2" className="text-sm font-medium">Home Phone</Label>
                      <Input
                        id="home_phone_2"
                        value={formData.home_phone_2}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          updateFormData('home_phone_2', formatted);
                        }}
                        className="mt-1"
                        placeholder="(555) 123-4567"
                        maxLength={14}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="cell_phone_2" className="text-sm font-medium">Cell Phone</Label>
                      <Input
                        id="cell_phone_2"
                        value={formData.cell_phone_2}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          updateFormData('cell_phone_2', formatted);
                        }}
                        className="mt-1"
                        placeholder="(555) 123-4567"
                        maxLength={14}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email_address_2" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email_address_2"
                        type="email"
                        value={formData.email_address_2}
                        onChange={(e) => updateFormData('email_address_2', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing & Documents Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">Processing & Documents</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current_credit_card_processor" className="text-sm font-medium">Current Credit Card Processor</Label>
                    <Input
                      id="current_credit_card_processor"
                      value={formData.current_credit_card_processor}
                      onChange={(e) => updateFormData('current_credit_card_processor', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="annual_credit_card_sales" className="text-sm font-medium">Annual Credit Card Sales</Label>
                      <Input
                        id="annual_credit_card_sales"
                        type="number"
                        value={formData.annual_credit_card_sales}
                        onChange={(e) => updateFormData('annual_credit_card_sales', e.target.value)}
                        className="mt-1"
                        placeholder="0"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
                    </div>
                    <div>
                      <Label htmlFor="average_monthly_cc_volume" className="text-sm font-medium">Average Monthly Credit Card Volume</Label>
                      <Input
                        id="average_monthly_cc_volume"
                        type="number"
                        value={formData.average_monthly_cc_volume}
                        onChange={(e) => updateFormData('average_monthly_cc_volume', e.target.value)}
                        className="mt-1"
                        placeholder="0"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Amount in USD</p>
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Required Documents</h4>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">📱 Mobile Upload Tips:</p>
                          <ul className="list-disc pl-3 space-y-1 text-blue-700 dark:text-blue-300">
                            <li>Use banking app to download statements as PDFs</li>
                            <li>Take clear photos if documents are physical</li>
                            <li>Upload files one by one for better results</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Upload Your Documents</p>
                          <p className="text-xs text-muted-foreground">Click here or drag and drop your files</p>
                          <p className="text-xs text-muted-foreground">Supported: PDF, Images (JPG, PNG, GIF, WebP, BMP, TIFF), DOC, DOCX (Max 10MB each)</p>
                        </div>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.doc,.docx,application/pdf,image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              const validFiles: File[] = [];
                              const errors: string[] = [];
                              files.forEach(file => {
                                const validationError = validateFile(file);
                                if (validationError) {
                                  errors.push(`${file.name}: ${validationError}`);
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
                            // Reset to allow re-selecting same files
                            (e.target as HTMLInputElement).value = '';
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>

                      {formData.document_files.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Selected Files:</p>
                          <ul className="text-xs space-y-1">
                            {formData.document_files.map((file, index) => (
                              <li key={index} className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-primary" />
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
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">USA Business Loan Application</h1>
            <p className="text-muted-foreground">Complete the form below to apply for funding</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>

          <div className="space-y-6">
            {renderStep()}

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              {currentStep < totalSteps ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  )}
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApplicationUS;
