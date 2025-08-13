import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Building2, User, CreditCard, FileText, CheckCircle, Upload, Info, MapPin, DollarSign } from "lucide-react";
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
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false);
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

  // Initialize form data from URL params or user account
  useEffect(() => {
    if (!loading) {
      const name = searchParams.get('name');
      const email = searchParams.get('email');
      const phone = searchParams.get('phone');
      const loanAmount = searchParams.get('loanAmount');
      const company = searchParams.get('company');
      const quizId = searchParams.get('quizResponseId') || searchParams.get('quiz_id');

      const updates: Partial<USApplicationData> = {};
      if (name) updates.principal_owner_name = name;
      if (email) updates.email_address = email;
      if (phone) updates.business_phone = phone;
      if (loanAmount) updates.amount_requested = loanAmount;
      if (company) updates.legal_business_name = company;
      if (quizId) updates.quiz_response_id = quizId;

      if (user?.email && !email) {
        updates.email_address = user.email;
      }

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
        return ['principal_owner_name', 'ownership_percentage', 'ssn', 'dob', 'home_address', 'city_owner', 'state_owner', 'zip_owner', 'email_address'];
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
    for (const field of requiredFields) {
      const value = formData[field as keyof USApplicationData];
      if (Array.isArray(value)) {
        if (value.length === 0) return false;
      } else {
        if (!value || value.toString().trim() === "") return false;
      }
    }
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
    if (!user) {
      setShowAuth(true);
      setPendingAutoSubmit(true);
      return;
    }

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
        principal_title: null,
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
                    onChange={(e) => updateFormData('zip', e.target.value)}
                    className={getFieldValidationClass('zip', getStepRequiredFields(1))}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_phone">Business Phone *</Label>
                  <Input
                    id="business_phone"
                    value={formData.business_phone}
                    onChange={(e) => updateFormData('business_phone', e.target.value)}
                    className={getFieldValidationClass('business_phone', getStepRequiredFields(1))}
                    placeholder="(555) 123-4567"
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
                    onChange={(e) => updateFormData('federal_tax_id', e.target.value)}
                    className={getFieldValidationClass('federal_tax_id', getStepRequiredFields(1))}
                    placeholder="12-3456789"
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={(e) => updateFormData('ssn', e.target.value)}
                    className={getFieldValidationClass('ssn', getStepRequiredFields(2))}
                    placeholder="123-45-6789"
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
                    onChange={(e) => updateFormData('zip_owner', e.target.value)}
                    className={getFieldValidationClass('zip_owner', getStepRequiredFields(2))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="home_phone">Home Phone</Label>
                  <Input
                    id="home_phone"
                    value={formData.home_phone}
                    onChange={(e) => updateFormData('home_phone', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cell_phone">Cell Phone</Label>
                  <Input
                    id="cell_phone"
                    value={formData.cell_phone}
                    onChange={(e) => updateFormData('cell_phone', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_address">Email Address *</Label>
                  <Input
                    id="email_address"
                    type="email"
                    value={formData.email_address}
                    onChange={(e) => updateFormData('email_address', e.target.value)}
                    className={getFieldValidationClass('email_address', getStepRequiredFields(2))}
                  />
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <Label>Upload Documents</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drag and drop files here or click to upload</p>
                    <Input
                      id="documents"
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) updateFormData('document_files', Array.from(e.target.files));
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Accepted: PDF, DOCX, XLSX, JPG, PNG (max 10MB each)</p>
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

          <div className="mb-6">
            <Progress value={(currentStep / totalSteps) * 100} />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Business Info</span>
              <span>Owner Info</span>
            </div>
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

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ApplicationAuth 
            email={formData.email_address}
            name={formData.principal_owner_name}
            onAuthSuccess={() => {
              setShowAuth(false);
              setPendingAutoSubmit(true);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ApplicationUS;
