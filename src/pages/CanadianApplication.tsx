import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowRight, Building2, User, CreditCard, FileText, CheckCircle, Upload, Info, MapPin, DollarSign } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationAuth } from "@/components/ApplicationAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useCanadianApplicationDraft } from "@/hooks/use-canadian-application-draft";

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
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedDraft, setSavedDraft] = useState<any>(null);
  const { user, loading } = useAuth();
  const { saveDraft, loadDraft, deleteDraft, checkQuizCompletion } = useCanadianApplicationDraft();
  const totalSteps = 4; // Updated to move submit to step 4
  
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
    document_files: [],
    quiz_response_id: null,
  });

  // Check for existing draft or quiz data on component mount
  useEffect(() => {
    const initializeApplication = async () => {
      if (!user || loading) return;

      try {
        // First, check URL parameters for quiz data
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const phone = searchParams.get('phone');
        const loanAmount = searchParams.get('loanAmount');
        const monthlyRevenue = searchParams.get('monthlyRevenue');
        const useOfFunds = searchParams.get('useOfFunds');
        const quizResponseId = searchParams.get('quizResponseId');

        // Check for existing draft
        const draft = await loadDraft();
        
        if (draft && !quizResponseId) {
          // User has a saved draft and didn't come from quiz
          setSavedDraft(draft);
          setShowResumeDialog(true);
          return;
        }

        // Pre-fill form if quiz data is available from URL
        if (name || email || phone || loanAmount || quizResponseId) {
          console.log('Pre-filling Canadian application with quiz data:', {
            name, email, phone, loanAmount, monthlyRevenue, useOfFunds, quizResponseId
          });

          setFormData(prev => ({
            ...prev,
            principal_owner_name: name || prev.principal_owner_name,
            email_address: email || user.email || prev.email_address,
            cell_phone: phone || prev.cell_phone,
            amount_requested: loanAmount || prev.amount_requested,
            annual_gross_sales: monthlyRevenue ? (parseInt(monthlyRevenue) * 12).toString() : prev.annual_gross_sales,
            use_of_funds: useOfFunds || prev.use_of_funds,
            quiz_response_id: quizResponseId || prev.quiz_response_id,
          }));
        } else if (draft) {
          // Load draft data if no quiz data in URL
          setFormData(draft.form_data);
          setCurrentStep(draft.current_step);
        } else {
          // No quiz data and no draft - just pre-fill email from auth
          setFormData(prev => ({
            ...prev,
            email_address: user.email || prev.email_address,
          }));
        }
      } catch (error) {
        console.error('Error initializing application:', error);
      }
    };

    initializeApplication();
  }, [user, loading, searchParams, loadDraft]);

  const updateFormData = (field: keyof CanadianApplicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-save draft when form data changes (debounced)
  useEffect(() => {
    if (!user || currentStep === 1) return; // Don't auto-save on first step or if not logged in
    
    const timeoutId = setTimeout(() => {
      saveDraft(formData, currentStep, formData.quiz_response_id || undefined);
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, user, saveDraft]);

  // Save draft when step changes
  useEffect(() => {
    if (!user || currentStep === 1) return;
    saveDraft(formData, currentStep, formData.quiz_response_id || undefined);
  }, [currentStep, user, saveDraft, formData]);

  const getStepRequiredFields = (step: number): string[] => {
    switch (step) {
      case 1:
        const step1Fields = [];
        if (!formData.legal_business_name) step1Fields.push("Legal Business Name");
        if (!formData.physical_address) step1Fields.push("Physical Address");
        if (!formData.city) step1Fields.push("City");
        if (!formData.state) step1Fields.push("Province");
        if (!formData.zip) step1Fields.push("Postal Code");
        if (!formData.business_phone) step1Fields.push("Business Phone");
        return step1Fields;
      case 2:
        const step2Fields = [];
        if (!formData.type_of_entity) step2Fields.push("Type of Entity");
        if (!formData.federal_tax_id) step2Fields.push("Federal Tax ID");
        if (!formData.business_start_date) step2Fields.push("Business Start Date");
        if (!formData.number_of_locations) step2Fields.push("Number of Locations");
        if (!formData.business_property_type) step2Fields.push("Business Property Type");
        return step2Fields;
      case 3:
        const step3Fields = [];
        if (!formData.annual_gross_sales) step3Fields.push("Annual Gross Sales");
        if (!formData.amount_requested) step3Fields.push("Amount Requested");
        if (!formData.use_of_funds) step3Fields.push("Use of Funds");
        return step3Fields;
      case 4:
        const step4Fields = [];
        if (!formData.principal_owner_name) step4Fields.push("Principal Owner Name");
        if (!formData.ownership_percentage) step4Fields.push("Ownership Percentage");
        if (!formData.ssn) step4Fields.push("SIN");
        if (!formData.dob) step4Fields.push("Date of Birth");
        if (!formData.home_address) step4Fields.push("Home Address");
        if (!formData.city_owner) step4Fields.push("City");
        if (!formData.state_owner) step4Fields.push("Province");
        if (!formData.zip_owner) step4Fields.push("Postal Code");
        if (!formData.email_address) step4Fields.push("Email Address");
        return step4Fields;
      default:
        return [];
    }
  };

  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const getFieldValidationClass = (fieldName: keyof CanadianApplicationData, step: number): string => {
    // Only show validation errors when user tries to proceed and there are errors
    if (!showValidationErrors) return "";
    
    const requiredFields = getRequiredFieldsForStep(step);
    const isRequired = requiredFields.includes(fieldName);
    const isEmpty = !formData[fieldName] || (Array.isArray(formData[fieldName]) && (formData[fieldName] as any[]).length === 0);
    
    return isRequired && isEmpty ? "border-red-500 focus:border-red-500" : "";
  };

  const getRequiredFieldsForStep = (step: number): (keyof CanadianApplicationData)[] => {
    switch (step) {
      case 1:
        return ['legal_business_name', 'physical_address', 'city', 'state', 'zip', 'business_phone'];
      case 2:
        return ['type_of_entity', 'federal_tax_id', 'business_start_date', 'number_of_locations', 'business_property_type'];
      case 3:
        return ['annual_gross_sales', 'amount_requested', 'use_of_funds'];
      case 4:
        return ['principal_owner_name', 'ownership_percentage', 'ssn', 'dob', 'home_address', 'city_owner', 'state_owner', 'zip_owner', 'email_address'];
      default:
        return [];
    }
  };

  const validateStep = (step: number): boolean => {
    return getStepRequiredFields(step).length === 0;
  };

  const nextStep = () => {
    const missingFields = getStepRequiredFields(currentStep);
    if (missingFields.length > 0) {
      setShowValidationErrors(true);
      toast.error(`Please fill in the following required fields: ${missingFields.join(", ")}`);
      return;
    }
    
    setShowValidationErrors(false); // Reset validation errors when moving forward
    
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
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" is not a supported format. Please use PDF, images (JPG, PNG, GIF, WebP, BMP, TIFF), or document files (DOC, DOCX).`;
    }
    
    return null;
  };

  const handleFileUpload = async (files: File[]): Promise<string[]> => {
    const uploadedFiles: string[] = [];
    
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }
      
      // Create a safe filename by removing special characters and ensuring unique naming
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user?.id || 'anonymous'}/canadian_${Date.now()}-${safeName}`;
      
      const { error } = await supabase.storage
        .from('application-documents')
        .upload(fileName, file, {
          upsert: false, // Don't overwrite existing files
          cacheControl: '3600'
        });
      
      if (error) {
        console.error('Error uploading file:', error);
        if (error.message.includes('duplicate')) {
          throw new Error(`File "${file.name}" already exists. Please rename it and try again.`);
        }
        throw new Error(`Failed to upload "${file.name}": ${error.message}`);
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
      // Use quiz response ID from form data (pre-filled from URL params)
      const quizResponseId = formData.quiz_response_id || null;
      
      // Upload documents first
      let uploadedFileNames: string[] = [];
      if (formData.document_files.length > 0) {
        uploadedFileNames = await handleFileUpload(formData.document_files);
      }

      const applicationData = {
        legal_business_name: formData.legal_business_name || 'Not Provided',
        dba_name: formData.dba_name || null,
        physical_address: formData.physical_address || 'Not Provided',
        mailing_address: formData.mailing_address || null,
        city: formData.city || 'Not Provided',
        state: formData.state || 'Not Provided',
        zip: formData.zip || 'A0A 0A0',
        business_phone: formData.business_phone || '0000000000',
        business_fax: formData.business_fax || null,
        type_of_entity: formData.type_of_entity || 'Corporation',
        federal_tax_id: formData.federal_tax_id || '000000000',
        business_start_date: formData.business_start_date || '2020-01-01',
        number_of_locations: parseInt(formData.number_of_locations) || 1,
        business_property_type: formData.business_property_type || 'Lease',
        monthly_rent_or_mortgage: formData.monthly_rent_or_mortgage ? parseInt(formData.monthly_rent_or_mortgage) : null,
        landlord_or_bank_company_name: formData.landlord_or_bank_company_name || null,
        landlord_or_bank_phone: formData.landlord_or_bank_phone || null,
        annual_gross_sales: parseInt(formData.annual_gross_sales) || 1000,
        amount_requested: parseInt(formData.amount_requested) || 1000,
        use_of_funds: formData.use_of_funds || 'working-capital',
        existing_advance: formData.existing_advance,
        if_so_with_who: formData.if_so_with_who || null,
        outstanding_balance: formData.outstanding_balance ? parseInt(formData.outstanding_balance) : null,
        principal_owner_name: formData.principal_owner_name || 'Not Provided',
        ownership_percentage: parseInt(formData.ownership_percentage) || 100,
        ssn: formData.ssn || '000000000',
        dob: formData.dob || '1980-01-01',
        home_address: formData.home_address || 'Not Provided',
        city_owner: formData.city_owner || 'Not Provided',
        state_owner: formData.state_owner || 'Not Provided',
        zip_owner: formData.zip_owner || 'A0A 0A0',
        home_phone: formData.home_phone || null,
        cell_phone: formData.cell_phone || null,
        email_address: formData.email_address || user?.email || 'no-email@example.com',
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
        document_files: uploadedFileNames,
        // Add required status field and tracking fields
        status: 'applicant', // Must be one of: applicant, in_review, approved, rejected
        quiz_response_id: quizResponseId,
        lead_source: quizResponseId ? 'quiz' : 'direct',
        conversion_stage: 'application',
        // Associate with authenticated user
        user_id: user?.id,
      };

      const { data, error } = await supabase
        .from('canadian_applications')
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
            type: 'canadian_application',
            data: applicationData,
            submissionId: data.application_reference_number
          }
        });
      } catch (adminNotificationError) {
        console.error('Failed to send admin notification:', adminNotificationError);
        // Don't fail the whole submission if admin notification fails
      }

      // Delete draft upon successful submission
      try {
        await deleteDraft();
      } catch (error) {
        console.error('Error deleting draft:', error);
        // Don't fail submission if draft deletion fails
      }

      // Track conversion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-16458367327/ads_conversion_SUBMIT_CANADIAN_APPLICATION_1'
        });
      }

      toast.success("Application submitted successfully!");
      navigate("/application-success");
    } catch (error) {
      console.error('Error submitting application:', error);
      console.error('Form data that failed:', formData);
      
      // More specific error messages based on the error type
      let errorMessage = "Failed to submit application. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('violates not-null constraint')) {
          errorMessage = "Please fill in all required fields before submitting.";
        } else if (error.message.includes('invalid input')) {
          errorMessage = "Please check your input values and try again.";
        } else if (error.message.includes('duplicate')) {
          errorMessage = "This application has already been submitted.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeDraft = () => {
    if (savedDraft) {
      setFormData(savedDraft.form_data);
      setCurrentStep(savedDraft.current_step);
      setShowResumeDialog(false);
      toast.success('Resumed from your saved application');
    }
  };

  const handleStartFresh = () => {
    setShowResumeDialog(false);
    if (savedDraft) {
      deleteDraft();
    }
    toast.success('Starting fresh application');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Business Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="legal_business_name" className="text-sm font-medium">Legal Business Name *</Label>
                <Input
                  id="legal_business_name"
                  value={formData.legal_business_name}
                  onChange={(e) => updateFormData('legal_business_name', e.target.value)}
                  className={`mt-1 ${getFieldValidationClass('legal_business_name', currentStep)}`}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="dba_name" className="text-sm font-medium">DBA Name</Label>
                <Input
                  id="dba_name"
                  value={formData.dba_name}
                  onChange={(e) => updateFormData('dba_name', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="physical_address" className="text-sm font-medium">Physical Address *</Label>
                <Input
                  id="physical_address"
                  value={formData.physical_address}
                  onChange={(e) => updateFormData('physical_address', e.target.value)}
                  className={`mt-1 ${getFieldValidationClass('physical_address', currentStep)}`}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="mailing_address" className="text-sm font-medium">Mailing Address (if different)</Label>
                <Input
                  id="mailing_address"
                  value={formData.mailing_address}
                  onChange={(e) => updateFormData('mailing_address', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={`mt-1 ${getFieldValidationClass('city', currentStep)}`}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-medium">Province *</Label>
                  <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)}>
                    <SelectTrigger className={`mt-1 ${getFieldValidationClass('state', currentStep)}`}>
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
                <Label htmlFor="zip" className="text-sm font-medium">Postal Code *</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => {
                    const formatted = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(\w{3})(\w{3})/, '$1 $2');
                    updateFormData('zip', formatted);
                  }}
                  className={`mt-1 ${getFieldValidationClass('zip', currentStep)}`}
                  placeholder="A1A 1A1"
                  maxLength={7}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <Label htmlFor="business_phone" className="text-sm font-medium">Business Phone *</Label>
                    <Input
                      id="business_phone"
                      type="tel"
                      value={formData.business_phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                          updateFormData('business_phone', formatted);
                        }
                      }}
                      className={`mt-1 ${getFieldValidationClass('business_phone', currentStep)}`}
                      placeholder="(555) 123-4567"
                      maxLength={14}
                      required
                    />
                 </div>
                 <div>
                   <Label htmlFor="business_fax" className="text-sm font-medium">Business Fax</Label>
                   <Input
                     id="business_fax"
                     type="tel"
                     value={formData.business_fax}
                     onChange={(e) => {
                       const value = e.target.value.replace(/\D/g, '');
                       if (value.length <= 10) {
                         const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                         updateFormData('business_fax', formatted);
                       }
                     }}
                     className="mt-1"
                     placeholder="(555) 123-4567"
                     maxLength={14}
                   />
                 </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Business Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="type_of_entity" className="text-sm font-medium">Type of Entity *</Label>
                <Select value={formData.type_of_entity} onValueChange={(value) => updateFormData('type_of_entity', value)}>
                  <SelectTrigger className={`mt-1 ${getFieldValidationClass('type_of_entity', currentStep)}`}>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="Limited Partnership">Limited Partnership</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
               <div>
                 <Label htmlFor="federal_tax_id" className="text-sm font-medium">Federal Tax ID (Business Number) *</Label>
                  <Input
                    id="federal_tax_id"
                    value={formData.federal_tax_id}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 15) {
                        const formatted = value.replace(/(\d{9})(\d{2})(\d{4})/, '$1 $2 $3');
                        updateFormData('federal_tax_id', formatted);
                      }
                    }}
                    className={`mt-1 ${getFieldValidationClass('federal_tax_id', currentStep)}`}
                    placeholder="123456789 RT 0001"
                    maxLength={17}
                    required
                  />
               </div>
              
              <div>
                <Label htmlFor="business_start_date" className="text-sm font-medium">Business Start Date *</Label>
                <Input
                  id="business_start_date"
                  type="date"
                  value={formData.business_start_date}
                  onChange={(e) => updateFormData('business_start_date', e.target.value)}
                  className={`mt-1 ${getFieldValidationClass('business_start_date', currentStep)}`}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="number_of_locations" className="text-sm font-medium"># of Locations *</Label>
                <Input
                  id="number_of_locations"
                  type="number"
                  min="1"
                  value={formData.number_of_locations}
                  onChange={(e) => updateFormData('number_of_locations', e.target.value)}
                  className={`mt-1 ${getFieldValidationClass('number_of_locations', currentStep)}`}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="business_property_type" className="text-sm font-medium">Business Property Type *</Label>
                <div className="flex gap-2 mt-1">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.business_property_type === 'Own'}
                      onCheckedChange={(checked) => updateFormData('business_property_type', checked ? 'Own' : '')}
                    />
                    <span className="text-sm">Own</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.business_property_type === 'Rent'}
                      onCheckedChange={(checked) => updateFormData('business_property_type', checked ? 'Rent' : '')}
                    />
                    <span className="text-sm">Rent</span>
                  </label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="monthly_rent_or_mortgage" className="text-sm font-medium">Monthly Rent/Mortgage</Label>
                <Input
                  id="monthly_rent_or_mortgage"
                  type="number"
                  value={formData.monthly_rent_or_mortgage}
                  onChange={(e) => updateFormData('monthly_rent_or_mortgage', e.target.value)}
                  className="mt-1"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in CAD</p>
              </div>
              
              <div>
                <Label htmlFor="landlord_or_bank_company_name" className="text-sm font-medium">Landlord/Bank Company Name</Label>
                <Input
                  id="landlord_or_bank_company_name"
                  value={formData.landlord_or_bank_company_name}
                  onChange={(e) => updateFormData('landlord_or_bank_company_name', e.target.value)}
                  className="mt-1"
                />
              </div>
              
               <div>
                 <Label htmlFor="landlord_or_bank_phone" className="text-sm font-medium">Landlord/Bank Phone</Label>
                 <Input
                   id="landlord_or_bank_phone"
                   type="tel"
                   value={formData.landlord_or_bank_phone}
                   onChange={(e) => {
                     const value = e.target.value.replace(/\D/g, '');
                     if (value.length <= 10) {
                       const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                       updateFormData('landlord_or_bank_phone', formatted);
                     }
                   }}
                   className="mt-1"
                   placeholder="(555) 123-4567"
                   maxLength={14}
                 />
               </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Financial Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="annual_gross_sales" className="text-sm font-medium">Annual Gross Sales *</Label>
                <Input
                  id="annual_gross_sales"
                  type="number"
                  value={formData.annual_gross_sales}
                  onChange={(e) => updateFormData('annual_gross_sales', e.target.value)}
                  className={`mt-1 ${getFieldValidationClass('annual_gross_sales', currentStep)}`}
                  placeholder="0"
                  min="0"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in CAD</p>
              </div>
              
              <div>
                <Label htmlFor="amount_requested" className="text-sm font-medium">Amount Requested *</Label>
                <Input
                  id="amount_requested"
                  type="number"
                  value={formData.amount_requested}
                  onChange={(e) => updateFormData('amount_requested', e.target.value)}
                  className={`mt-1 ${getFieldValidationClass('amount_requested', currentStep)}`}
                  placeholder="0"
                  min="0"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Amount in CAD</p>
              </div>
              
              <div>
                <Label htmlFor="use_of_funds" className="text-sm font-medium">Use of Funds *</Label>
                <Textarea
                  id="use_of_funds"
                  value={formData.use_of_funds}
                  onChange={(e) => updateFormData('use_of_funds', e.target.value)}
                  className={`mt-1 ${getFieldValidationClass('use_of_funds', currentStep)}`}
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Existing Advance? *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.existing_advance === true}
                      onCheckedChange={(checked) => updateFormData('existing_advance', checked)}
                    />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.existing_advance === false}
                      onCheckedChange={(checked) => updateFormData('existing_advance', !checked)}
                    />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>
              
              {formData.existing_advance && (
                <>
                  <div>
                    <Label htmlFor="if_so_with_who" className="text-sm font-medium">If so, with who?</Label>
                    <Input
                      id="if_so_with_who"
                      value={formData.if_so_with_who}
                      onChange={(e) => updateFormData('if_so_with_who', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="outstanding_balance" className="text-sm font-medium">Outstanding Balance</Label>
                    <Input
                      id="outstanding_balance"
                      type="number"
                      value={formData.outstanding_balance}
                      onChange={(e) => updateFormData('outstanding_balance', e.target.value)}
                      className="mt-1"
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Amount in CAD</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Ownership Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Principal Owner</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="principal_owner_name" className="text-sm font-medium">Name *</Label>
                    <Input
                      id="principal_owner_name"
                      value={formData.principal_owner_name}
                      onChange={(e) => updateFormData('principal_owner_name', e.target.value)}
                      className={`mt-1 ${getFieldValidationClass('principal_owner_name', currentStep)}`}
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
                           className={`mt-1 ${getFieldValidationClass('ownership_percentage', currentStep)}`}
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
                           className={`mt-1 ${getFieldValidationClass('ssn', currentStep)}`}
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
                        className={`mt-1 ${getFieldValidationClass('dob', currentStep)}`}
                        required
                      />
                  </div>
                  
                    <div>
                      <Label htmlFor="home_address" className="text-sm font-medium">Home Address *</Label>
                      <Input
                        id="home_address"
                        value={formData.home_address}
                        onChange={(e) => updateFormData('home_address', e.target.value)}
                        className={`mt-1 ${getFieldValidationClass('home_address', currentStep)}`}
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
                          className={`mt-1 ${getFieldValidationClass('city_owner', currentStep)}`}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state_owner" className="text-sm font-medium">Province *</Label>
                        <Select value={formData.state_owner} onValueChange={(value) => updateFormData('state_owner', value)}>
                          <SelectTrigger className={`mt-1 ${getFieldValidationClass('state_owner', currentStep)}`}>
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
                        onChange={(e) => {
                          const formatted = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(\w{3})(\w{3})/, '$1 $2');
                          updateFormData('zip_owner', formatted);
                        }}
                        className={`mt-1 ${getFieldValidationClass('zip_owner', currentStep)}`}
                        placeholder="A1A 1A1"
                        maxLength={7}
                        required
                      />
                    </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <Label htmlFor="home_phone" className="text-sm font-medium">Home Phone</Label>
                       <Input
                         id="home_phone"
                         type="tel"
                         value={formData.home_phone}
                         onChange={(e) => {
                           const value = e.target.value.replace(/\D/g, '');
                           if (value.length <= 10) {
                             const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                             updateFormData('home_phone', formatted);
                           }
                         }}
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
                         onChange={(e) => {
                           const value = e.target.value.replace(/\D/g, '');
                           if (value.length <= 10) {
                             const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                             updateFormData('cell_phone', formatted);
                           }
                         }}
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
                       className={`mt-1 ${getFieldValidationClass('email_address', currentStep)}`}
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
                       onChange={(e) => {
                         const formatted = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(\w{3})(\w{3})/, '$1 $2');
                         updateFormData('zip_owner_2', formatted);
                       }}
                       className="mt-1"
                       placeholder="A1A 1A1"
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
                         onChange={(e) => {
                           const value = e.target.value.replace(/\D/g, '');
                           if (value.length <= 10) {
                             const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                             updateFormData('home_phone_2', formatted);
                           }
                         }}
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
                         onChange={(e) => {
                           const value = e.target.value.replace(/\D/g, '');
                           if (value.length <= 10) {
                             const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                             updateFormData('cell_phone_2', formatted);
                           }
                         }}
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
             </div>
           </div>
         );

      default:
        return null;
    }
  };

  // Show authentication form if user is not authenticated (unless we explicitly don't want to show auth)
  if (!showAuth && (!user && !loading)) {
    setShowAuth(true);
  }
  
  if (showAuth) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 py-6 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MapPin className="h-6 w-6 text-red-600" />
                  <h1 className="text-2xl md:text-3xl font-bold">Canadian Business Application</h1>
                </div>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  Step 1 of {totalSteps}: Create Your Secure Account
                </p>
                {/* Progress */}
                <div className="mb-6">
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
                name={searchParams.get('name') || formData.principal_owner_name}
                onAuthSuccess={() => {
                  // Add a small delay to ensure auth state propagates
                  setTimeout(() => setShowAuth(false), 100);
                }}
              />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Show loading state
  if (loading) {
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
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MapPin className="h-6 w-6 text-red-600" />
                <h1 className="text-2xl md:text-3xl font-bold">Canadian Business Application</h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                Complete your funding application in {totalSteps} steps
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs md:text-sm font-medium">Step {currentStep} of {totalSteps}</span>
                <span className="text-xs md:text-sm text-muted-foreground">
                  {Math.round((currentStep / totalSteps) * 100)}% Complete
                </span>
              </div>
              <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
            </div>

            {/* Form Card */}
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Step {currentStep} of {totalSteps}
                </CardTitle>
                <CardDescription className="text-sm">
                  Please fill out all required fields to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStep()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
                size="sm"
              >
                <ArrowLeft className="h-3 w-3" />
                Previous
              </Button>

              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Submit Application
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  Next
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Resume Draft Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Your Application?</AlertDialogTitle>
            <AlertDialogDescription>
              We found a saved application from your previous session. Would you like to continue where you left off or start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>Start Fresh</AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeDraft}>Resume Application</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CanadianApplication;