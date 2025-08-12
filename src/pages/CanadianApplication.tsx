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

interface CanadianApplicationData {
  // Business Information
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
  federal_tax_id: string;
  business_start_date: string;
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
  ssn: string;
  dob: string;
  home_address: string;
  city_owner: string;
  state_owner: string;
  zip_owner: string;
  home_phone: string;
  cell_phone: string;
  email_address: string;
  
  // Secondary Owner Information (optional)
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

const CanadianApplication = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user, loading } = useAuth();
  const totalSteps = 2;
  
  const [formData, setFormData] = useState<CanadianApplicationData>({
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
    
    // Primary Owner Information
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
    
    // Secondary Owner Information
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
    
    // Credit Card Processing
    current_credit_card_processor: "",
    annual_credit_card_sales: "",
    average_monthly_cc_volume: "",
    additional_information: "",
    
    // Documents
    document_files: [],
    
    // Tracking
    quiz_response_id: null
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
      const quizId = searchParams.get('quiz_id');

      const updates: Partial<CanadianApplicationData> = {};
      
      if (name) updates.principal_owner_name = name;
      if (email) updates.email_address = email;
      if (phone) updates.business_phone = phone;
      if (loanAmount) updates.amount_requested = loanAmount;
      if (company) updates.legal_business_name = company;
      if (quizId) updates.quiz_response_id = quizId;
      
      // Use user email if logged in and no email from quiz
      if (user?.email && !email) {
        updates.email_address = user.email;
      }

      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
}, [user, loading, searchParams]);

  useEffect(() => {
    const quizId = searchParams.get('quiz_id');
    const shouldPrefill = !formData.business_start_date;
    if (!quizId || !shouldPrefill) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_responses')
          .select('founding_year, founding_month, founding_day')
          .eq('id', quizId)
          .maybeSingle();
        if (error) {
          console.error('Error fetching quiz for start date:', error);
          return;
        }
        if (data && (data as any).founding_year) {
          const y = (data as any).founding_year as number;
          const m = (data as any).founding_month as number | null;
          const d = (data as any).founding_day as number | null;
          const mm = m && m >= 1 && m <= 12 ? String(m).padStart(2, '0') : '01';
          const dd = d && d >= 1 && d <= 31 ? String(d).padStart(2, '0') : '01';
          const dateStr = `${y}-${mm}-${dd}`;
          setFormData(prev => ({ ...prev, business_start_date: dateStr }));
        }
      } catch (e) {
        console.error('Error pre-filling start date from quiz:', e);
      }
    })();
  }, [searchParams, formData.business_start_date]);

  const updateFormData = (field: keyof CanadianApplicationData, value: any) => {
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
      case 3:
        return [];
      case 4:
        return [];
      default:
        return [];
    }
  };

  const getFieldValidationClass = (fieldName: keyof CanadianApplicationData, requiredFields: string[]) => {
    if (!showValidationErrors) return "";
    
    const value = formData[fieldName];
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
    const isRequired = requiredFields.includes(fieldName);
    
    return isRequired && isEmpty ? "border-destructive" : "";
  };

  const validateStep = (step: number): boolean => {
    const requiredFields = getStepRequiredFields(step);
    
    for (const field of requiredFields) {
      const value = formData[field as keyof CanadianApplicationData];
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
    if (!user) {
      setShowAuth(true);
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
        user_id: user.id,
        legal_business_name: formData.legal_business_name,
        dba_name: formData.dba_name || null,
        physical_address: formData.physical_address,
        mailing_address: formData.mailing_address || null,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        business_phone: formData.business_phone,
        business_fax: formData.business_fax || null,
        type_of_entity: formData.type_of_entity,
        federal_tax_id: formData.federal_tax_id,
        business_start_date: formData.business_start_date,
        number_of_locations: parseInt(formData.number_of_locations),
        business_property_type: formData.business_property_type,
        monthly_rent_or_mortgage: formData.monthly_rent_or_mortgage ? parseInt(formData.monthly_rent_or_mortgage) : null,
        landlord_or_bank_company_name: formData.landlord_or_bank_company_name || null,
        landlord_or_bank_phone: formData.landlord_or_bank_phone || null,
        annual_gross_sales: parseInt(formData.annual_gross_sales),
        amount_requested: parseInt(formData.amount_requested),
        use_of_funds: formData.use_of_funds,
        existing_advance: formData.existing_advance,
        if_so_with_who: formData.if_so_with_who || null,
        outstanding_balance: formData.outstanding_balance ? parseInt(formData.outstanding_balance) : null,
        principal_owner_name: formData.principal_owner_name,
        ownership_percentage: parseInt(formData.ownership_percentage),
        ssn: formData.ssn,
        dob: formData.dob,
        home_address: formData.home_address,
        city_owner: formData.city_owner,
        state_owner: formData.state_owner,
        zip_owner: formData.zip_owner,
        home_phone: formData.home_phone || null,
        cell_phone: formData.cell_phone || null,
        email_address: formData.email_address,
        principal_owner_name_2: formData.principal_owner_name_2 || null,
        ownership_percentage_2: formData.ownership_percentage_2 ? parseInt(formData.ownership_percentage_2) : null,
        ssn_2: formData.ssn_2 || null,
        dob_2: formData.dob_2 || null,
        home_address_2: formData.home_address_2 || null,
        city_owner_2: formData.city_owner_2 || null,
        state_owner_2: formData.state_owner_2 || null,
        zip_owner_2: formData.zip_owner_2 || null,
        home_phone_2: formData.home_phone_2 || null,
        cell_phone_2: formData.cell_phone_2 || null,
        email_address_2: formData.email_address_2 || null,
        current_credit_card_processor: formData.current_credit_card_processor || null,
        annual_credit_card_sales: formData.annual_credit_card_sales ? parseInt(formData.annual_credit_card_sales) : null,
        average_monthly_cc_volume: formData.average_monthly_cc_volume ? parseInt(formData.average_monthly_cc_volume) : null,
        additional_information: formData.additional_information || null,
        document_files: documentUrls,
        quiz_response_id: formData.quiz_response_id
      };

      // Submit to database
      const { data, error } = await supabase
        .from('canadian_applications')
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
            applicationType: 'canadian'
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
              application_type: 'Canadian Application',
              application_id: data.id
            }
          }
        });
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
      }

      toast.success("Application submitted successfully!");
      navigate("/application-success");
    } catch (error) {
      console.error('Error submitting application:', error);
      console.error('Form data that failed:', formData);
      
      // Better error handling - show specific error message if available
      let errorMessage = "There was an error submitting your application. Please try again.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Error: ${error.message}`;
      } else if (error && typeof error === 'object' && 'error_description' in error) {
        errorMessage = `Error: ${(error as any).error_description}`;
      } else if (error && typeof error === 'object' && 'details' in error) {
        errorMessage = `Error: ${(error as any).details}`;
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
                Business Information
              </CardTitle>
              <CardDescription>Tell us about your Canadian business</CardDescription>
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
                    placeholder="Toronto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Province *</Label>
                  <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)}>
                    <SelectTrigger className={getFieldValidationClass('state', getStepRequiredFields(1))}>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AB">Alberta</SelectItem>
                      <SelectItem value="BC">British Columbia</SelectItem>
                      <SelectItem value="MB">Manitoba</SelectItem>
                      <SelectItem value="NB">New Brunswick</SelectItem>
                      <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                      <SelectItem value="NS">Nova Scotia</SelectItem>
                      <SelectItem value="ON">Ontario</SelectItem>
                      <SelectItem value="PE">Prince Edward Island</SelectItem>
                      <SelectItem value="QC">Quebec</SelectItem>
                      <SelectItem value="SK">Saskatchewan</SelectItem>
                      <SelectItem value="NT">Northwest Territories</SelectItem>
                      <SelectItem value="NU">Nunavut</SelectItem>
                      <SelectItem value="YT">Yukon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">Postal Code *</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => updateFormData('zip', e.target.value)}
                    className={getFieldValidationClass('zip', getStepRequiredFields(1))}
                    placeholder="M5V 3A8"
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
                    placeholder="(416) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_fax">Business Fax</Label>
                  <Input
                    id="business_fax"
                    value={formData.business_fax}
                    onChange={(e) => updateFormData('business_fax', e.target.value)}
                    placeholder="(416) 123-4568"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type_of_entity">Type of Entity *</Label>
                  <Select value={formData.type_of_entity} onValueChange={(value) => updateFormData('type_of_entity', value)}>
                    <SelectTrigger className={getFieldValidationClass('type_of_entity', getStepRequiredFields(1))}>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="limited_liability">Limited Liability Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="federal_tax_id">Business Number *</Label>
                  <Input
                    id="federal_tax_id"
                    value={formData.federal_tax_id}
                    onChange={(e) => updateFormData('federal_tax_id', e.target.value)}
                    className={getFieldValidationClass('federal_tax_id', getStepRequiredFields(1))}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_start_date">Business Start Date *</Label>
                  <Input
                    id="business_start_date"
                    type="date"
                    value={formData.business_start_date}
                    onChange={(e) => updateFormData('business_start_date', e.target.value)}
                    className={getFieldValidationClass('business_start_date', getStepRequiredFields(1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number_of_locations">Number of Locations</Label>
                  <Input
                    id="number_of_locations"
                    type="number"
                    value={formData.number_of_locations}
                    onChange={(e) => updateFormData('number_of_locations', e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annual_gross_sales">Annual Gross Sales (CAD) *</Label>
                  <Input
                    id="annual_gross_sales"
                    type="number"
                    value={formData.annual_gross_sales}
                    onChange={(e) => updateFormData('annual_gross_sales', e.target.value)}
                    className={getFieldValidationClass('annual_gross_sales', getStepRequiredFields(1))}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_requested">Amount Requested (CAD) *</Label>
                  <Input
                    id="amount_requested"
                    type="number"
                    value={formData.amount_requested}
                    onChange={(e) => updateFormData('amount_requested', e.target.value)}
                    className={getFieldValidationClass('amount_requested', getStepRequiredFields(1))}
                    placeholder="50000"
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
                  placeholder="Describe how you plan to use the funds..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="existing_advance"
                    checked={formData.existing_advance}
                    onCheckedChange={(checked) => updateFormData('existing_advance', checked)}
                  />
                  <Label htmlFor="existing_advance">
                    Do you currently have a merchant cash advance or similar product?
                  </Label>
                </div>

                {formData.existing_advance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="if_so_with_who">If so, with whom?</Label>
                      <Input
                        id="if_so_with_who"
                        value={formData.if_so_with_who}
                        onChange={(e) => updateFormData('if_so_with_who', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outstanding_balance">Outstanding Balance (CAD)</Label>
                      <Input
                        id="outstanding_balance"
                        type="number"
                        value={formData.outstanding_balance}
                        onChange={(e) => updateFormData('outstanding_balance', e.target.value)}
                        placeholder="25000"
                      />
                    </div>
                  </div>
                )}
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
                Ownership Information
              </CardTitle>
              <CardDescription>Provide details about the business owners</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Principal Owner</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="principal_owner_name" className="text-sm font-medium">Name *</Label>
                    <Input
                      id="principal_owner_name"
                      value={formData.principal_owner_name}
                      onChange={(e) => updateFormData('principal_owner_name', e.target.value)}
                      className={getFieldValidationClass('principal_owner_name', getStepRequiredFields(2))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="ownership_percentage" className="text-sm font-medium">Ownership % *</Label>
                         <Input
                           id="ownership_percentage"
                           type="number"
                           min="1"
                           max="100"
                           value={formData.ownership_percentage}
                           onChange={(e) => updateFormData('ownership_percentage', e.target.value)}
                           className={getFieldValidationClass('ownership_percentage', getStepRequiredFields(2))}
                           placeholder="%"
                           required
                         />
                    </div>
                     <div>
                       <Label htmlFor="ssn" className="text-sm font-medium">SIN *</Label>
                       <Input
                         id="ssn"
                           value={formData.ssn}
                           onChange={(e) => {
                             const value = e.target.value.replace(/\D/g, '');
                             if (value.length <= 9) {
                               const formatted = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
                               updateFormData('ssn', formatted);
                             }
                           }}
                           className={getFieldValidationClass('ssn', getStepRequiredFields(2))}
                           placeholder="123 456 789"
                           maxLength={11}
                           required
                       />
                     </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dob" className="text-sm font-medium">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => updateFormData('dob', e.target.value)}
                        className={getFieldValidationClass('dob', getStepRequiredFields(2))}
                        required
                      />
                  </div>
                  
                    <div>
                      <Label htmlFor="home_address" className="text-sm font-medium">Home Address *</Label>
                      <Input
                        id="home_address"
                        value={formData.home_address}
                        onChange={(e) => updateFormData('home_address', e.target.value)}
                        className={getFieldValidationClass('home_address', getStepRequiredFields(2))}
                        required
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
                  
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="city_owner" className="text-sm font-medium">City *</Label>
                        <Input
                          id="city_owner"
                          value={formData.city_owner}
                          onChange={(e) => updateFormData('city_owner', e.target.value)}
                          className={getFieldValidationClass('city_owner', getStepRequiredFields(2))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state_owner" className="text-sm font-medium">Province *</Label>
                        <Select value={formData.state_owner} onValueChange={(value) => updateFormData('state_owner', value)}>
                          <SelectTrigger className={getFieldValidationClass('state_owner', getStepRequiredFields(2))}>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="AB">Alberta</SelectItem>
                           <SelectItem value="BC">British Columbia</SelectItem>
                           <SelectItem value="MB">Manitoba</SelectItem>
                           <SelectItem value="NB">New Brunswick</SelectItem>
                           <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                           <SelectItem value="NT">Northwest Territories</SelectItem>
                           <SelectItem value="NS">Nova Scotia</SelectItem>
                           <SelectItem value="NU">Nunavut</SelectItem>
                           <SelectItem value="ON">Ontario</SelectItem>
                           <SelectItem value="PE">Prince Edward Island</SelectItem>
                           <SelectItem value="QC">Quebec</SelectItem>
                           <SelectItem value="SK">Saskatchewan</SelectItem>
                           <SelectItem value="YT">Yukon</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                  </div>
                  
                    <div>
                      <Label htmlFor="zip_owner" className="text-sm font-medium">Postal Code *</Label>
                      <Input
                        id="zip_owner"
                        value={formData.zip_owner}
                        onChange={(e) => updateFormData('zip_owner', e.target.value)}
                        className={getFieldValidationClass('zip_owner', getStepRequiredFields(2))}
                        placeholder="M5V 3A8"
                        maxLength={7}
                      />
                    </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <Label htmlFor="home_phone" className="text-sm font-medium">Home Phone</Label>
                       <Input
                         id="home_phone"
                         type="tel"
                         value={formData.home_phone}
                         onChange={(e) => updateFormData('home_phone', e.target.value)}
                         className="mt-1"
                         placeholder="(555) 123-4567"
                         maxLength={14}
                       />
                     </div>
                     <div>
                       <Label htmlFor="cell_phone" className="text-sm font-medium">Cell Phone</Label>
                       <Input
                         id="cell_phone"
                         type="tel"
                         value={formData.cell_phone}
                         onChange={(e) => updateFormData('cell_phone', e.target.value)}
                         className="mt-1"
                         placeholder="(555) 123-4567"
                         maxLength={14}
                       />
                     </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email_address" className="text-sm font-medium">Email Address *</Label>
                     <Input
                       id="email_address"
                       type="email"
                       value={formData.email_address}
                       onChange={(e) => updateFormData('email_address', e.target.value)}
                       className={getFieldValidationClass('email_address', getStepRequiredFields(2))}
                       required
                     />
                  </div>
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
                        <Label htmlFor="ssn_2" className="text-sm font-medium">SIN</Label>
                        <Input
                          id="ssn_2"
                          value={formData.ssn_2}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 9) {
                              const formatted = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
                              updateFormData('ssn_2', formatted);
                            }
                          }}
                          className="mt-1"
                          placeholder="123 456 789"
                          maxLength={11}
                        />
                      </div>
                   </div>
                   
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
                       <Label htmlFor="state_owner_2" className="text-sm font-medium">Province</Label>
                       <Select value={formData.state_owner_2} onValueChange={(value) => updateFormData('state_owner_2', value)}>
                         <SelectTrigger className="mt-1">
                           <SelectValue placeholder="Select province" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="AB">Alberta</SelectItem>
                           <SelectItem value="BC">British Columbia</SelectItem>
                           <SelectItem value="MB">Manitoba</SelectItem>
                           <SelectItem value="NB">New Brunswick</SelectItem>
                           <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                           <SelectItem value="NT">Northwest Territories</SelectItem>
                           <SelectItem value="NS">Nova Scotia</SelectItem>
                           <SelectItem value="NU">Nunavut</SelectItem>
                           <SelectItem value="ON">Ontario</SelectItem>
                           <SelectItem value="PE">Prince Edward Island</SelectItem>
                           <SelectItem value="QC">Quebec</SelectItem>
                           <SelectItem value="SK">Saskatchewan</SelectItem>
                           <SelectItem value="YT">Yukon</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   
                   <div>
                     <Label htmlFor="zip_owner_2" className="text-sm font-medium">Postal Code</Label>
                     <Input
                       id="zip_owner_2"
                       value={formData.zip_owner_2}
                       onChange={(e) => updateFormData('zip_owner_2', e.target.value)}
                       className="mt-1"
                       placeholder="M5V 3A8"
                       maxLength={7}
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <Label htmlFor="home_phone_2" className="text-sm font-medium">Home Phone</Label>
                       <Input
                         id="home_phone_2"
                         type="tel"
                         value={formData.home_phone_2}
                         onChange={(e) => updateFormData('home_phone_2', e.target.value)}
                         className="mt-1"
                         placeholder="(555) 123-4567"
                         maxLength={14}
                       />
                     </div>
                     <div>
                       <Label htmlFor="cell_phone_2" className="text-sm font-medium">Cell Phone</Label>
                       <Input
                         id="cell_phone_2"
                         type="tel"
                         value={formData.cell_phone_2}
                         onChange={(e) => updateFormData('cell_phone_2', e.target.value)}
                         className="mt-1"
                         placeholder="(555) 123-4567"
                         maxLength={14}
                       />
                     </div>
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
                     <p className="text-xs text-muted-foreground mt-1">Amount in CAD</p>
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
                     <p className="text-xs text-muted-foreground mt-1">Amount in CAD</p>
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
                           <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                             📱 Mobile Upload Tips:
                           </p>
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
                           <p className="text-xs text-muted-foreground">
                             Click here or drag and drop your files
                           </p>
                            <p className="text-xs text-muted-foreground">
                              Supported: PDF, Images (JPG, PNG, GIF, WebP, BMP, TIFF), DOC, DOCX (Max 10MB each)
                            </p>
                         </div>
                         <Input
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

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Additional Information
              </CardTitle>
              <CardDescription>Optional details to help with your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="additional_information">Additional Information</Label>
                <Textarea
                  id="additional_information"
                  value={formData.additional_information}
                  onChange={(e) => updateFormData('additional_information', e.target.value)}
                  placeholder="Share any extra details that might help us evaluate your application (e.g., seasonality, recent growth, special circumstances)..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">Optional. This will be saved with your quiz answers.</p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Review & Submit
              </CardTitle>
              <CardDescription>Review your information and submit your application</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Please review all your information before submitting. You can go back to previous steps to make changes.</p>
              {/* Optionally, display a summary or confirmation here */}
            </CardContent>
          </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Canadian Business Loan Application</h1>
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
            name={formData.principal_owner_name}
            onAuthSuccess={() => setShowAuth(false)}
          />
        </div>
      )}
    </div>
  );
};

export default CanadianApplication;
