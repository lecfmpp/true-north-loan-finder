import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Building2, User, CreditCard, FileText, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationData {
  // Business Information
  legalCorporationName: string;
  dbaName: string;
  physicalAddress: string;
  city: string;
  state: string;
  zip: string;
  entityType: string;
  telephoneNumber: string;
  taxId: string;
  email: string;
  website: string;
  businessStartDate: string;
  natureOfBusiness: string;
  numberOfLocations: string;
  productsSold: string;
  seasonalBusiness: string;
  taxLiens: string;
  isBusinessForSale: string;
  currentlyInBankruptcy: string;
  dischargedBankruptcy: string;
  cashAdvanceNow: string;
  withWhatLenders: string;
  notes: string;
  
  // Funding Information
  requestedFundingAmount: string;
  fundingUse: string;
  numberOfEmployees: string;
  ownRentLocation: string;
  timeRemainingOnLease: string;
  businessLandlord: string;
  phone: string;
  pendingLegalActions: string;
  monthlyBankAmount: string;
  
  // Owner Information
  ownerName: string;
  ownerTitle: string;
  ownershipPercentage: string;
  ownerHomeAddress: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
  ownerSSN: string;
  ownerDOB: string;
  ownerHomePhone: string;
  ownerCell: string;
  ownerOwnRent: string;
  ownerDriversLicense: string;
  ownerStateIssued: string;
  
  // Partner Information (if applicable)
  partnerName: string;
  partnerTitle: string;
  partnerOwnershipPercentage: string;
  partnerHomeAddress: string;
  partnerCity: string;
  partnerState: string;
  partnerZip: string;
  partnerSSN: string;
  partnerDOB: string;
  partnerHomePhone: string;
  partnerCell: string;
  partnerOwnRent: string;
  partnerDriversLicense: string;
  partnerStateIssued: string;
  
  // Processing Information
  acceptCards: string[];
  monthlyCardVolume: string;
  numberOfTerminals: string;
  posVersion: string;
  highTicket: string;
}

const Application = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 5;
  
  const [formData, setFormData] = useState<ApplicationData>({
    legalCorporationName: "",
    dbaName: "",
    physicalAddress: "",
    city: "",
    state: "",
    zip: "",
    entityType: "",
    telephoneNumber: "",
    taxId: "",
    email: "",
    website: "",
    businessStartDate: "",
    natureOfBusiness: "",
    numberOfLocations: "",
    productsSold: "",
    seasonalBusiness: "",
    taxLiens: "",
    isBusinessForSale: "",
    currentlyInBankruptcy: "",
    dischargedBankruptcy: "",
    cashAdvanceNow: "",
    withWhatLenders: "",
    notes: "",
    requestedFundingAmount: "",
    fundingUse: "",
    numberOfEmployees: "",
    ownRentLocation: "",
    timeRemainingOnLease: "",
    businessLandlord: "",
    phone: "",
    pendingLegalActions: "",
    monthlyBankAmount: "",
    ownerName: "",
    ownerTitle: "",
    ownershipPercentage: "",
    ownerHomeAddress: "",
    ownerCity: "",
    ownerState: "",
    ownerZip: "",
    ownerSSN: "",
    ownerDOB: "",
    ownerHomePhone: "",
    ownerCell: "",
    ownerOwnRent: "",
    ownerDriversLicense: "",
    ownerStateIssued: "",
    partnerName: "",
    partnerTitle: "",
    partnerOwnershipPercentage: "",
    partnerHomeAddress: "",
    partnerCity: "",
    partnerState: "",
    partnerZip: "",
    partnerSSN: "",
    partnerDOB: "",
    partnerHomePhone: "",
    partnerCell: "",
    partnerOwnRent: "",
    partnerDriversLicense: "",
    partnerStateIssued: "",
    acceptCards: [],
    monthlyCardVolume: "",
    numberOfTerminals: "",
    posVersion: "",
    highTicket: "",
  });

  const updateFormData = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('business_applications')
        .insert([{
          ...formData,
          accept_cards: formData.acceptCards,
          submitted_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Track conversion
      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
          'send_to': 'AW-16458367327/ads_conversion_SUBMIT_APPLICATION_1'
        });
      }

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
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Business Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalCorporationName">Legal Corporation Name *</Label>
                <Input
                  id="legalCorporationName"
                  value={formData.legalCorporationName}
                  onChange={(e) => updateFormData('legalCorporationName', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dbaName">DBA Name</Label>
                <Input
                  id="dbaName"
                  value={formData.dbaName}
                  onChange={(e) => updateFormData('dbaName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="physicalAddress">Physical Address *</Label>
                <Input
                  id="physicalAddress"
                  value={formData.physicalAddress}
                  onChange={(e) => updateFormData('physicalAddress', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State/Zip *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Zip"
                    value={formData.zip}
                    onChange={(e) => updateFormData('zip', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entityType">Entity Type</Label>
                <Select value={formData.entityType} onValueChange={(value) => updateFormData('entityType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telephoneNumber">Telephone Number *</Label>
                <Input
                  id="telephoneNumber"
                  type="tel"
                  value={formData.telephoneNumber}
                  onChange={(e) => updateFormData('telephoneNumber', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID *</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => updateFormData('taxId', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
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
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessStartDate">Business Start Date *</Label>
                <Input
                  id="businessStartDate"
                  type="date"
                  value={formData.businessStartDate}
                  onChange={(e) => updateFormData('businessStartDate', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="natureOfBusiness">Nature of Business *</Label>
                <Input
                  id="natureOfBusiness"
                  value={formData.natureOfBusiness}
                  onChange={(e) => updateFormData('natureOfBusiness', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfLocations"># of Locations</Label>
                <Input
                  id="numberOfLocations"
                  type="number"
                  value={formData.numberOfLocations}
                  onChange={(e) => updateFormData('numberOfLocations', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Business Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="productsSold">Products/Services Sold</Label>
                <Textarea
                  id="productsSold"
                  value={formData.productsSold}
                  onChange={(e) => updateFormData('productsSold', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Seasonal Business?</Label>
                <Select value={formData.seasonalBusiness} onValueChange={(value) => updateFormData('seasonalBusiness', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yes/No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tax Liens?</Label>
                <Select value={formData.taxLiens} onValueChange={(value) => updateFormData('taxLiens', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yes/No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Is the Business for Sale?</Label>
                <Select value={formData.isBusinessForSale} onValueChange={(value) => updateFormData('isBusinessForSale', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yes/No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Currently in Bankruptcy?</Label>
                <Select value={formData.currentlyInBankruptcy} onValueChange={(value) => updateFormData('currentlyInBankruptcy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yes/No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Discharged Bankruptcy in Last 7 years?</Label>
                <Select value={formData.dischargedBankruptcy} onValueChange={(value) => updateFormData('dischargedBankruptcy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yes/No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Are you in a Cash Advance Now?</Label>
                <Select value={formData.cashAdvanceNow} onValueChange={(value) => updateFormData('cashAdvanceNow', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yes/No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="withWhatLenders">With What Lenders?</Label>
                <Input
                  id="withWhatLenders"
                  value={formData.withWhatLenders}
                  onChange={(e) => updateFormData('withWhatLenders', e.target.value)}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Funding Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestedFundingAmount">Requested Funding Amount *</Label>
                <Input
                  id="requestedFundingAmount"
                  value={formData.requestedFundingAmount}
                  onChange={(e) => updateFormData('requestedFundingAmount', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fundingUse">What Will Funds be Used For? *</Label>
                <Input
                  id="fundingUse"
                  value={formData.fundingUse}
                  onChange={(e) => updateFormData('fundingUse', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                <Input
                  id="numberOfEmployees"
                  type="number"
                  value={formData.numberOfEmployees}
                  onChange={(e) => updateFormData('numberOfEmployees', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Own / Rent Business Location</Label>
                <Select value={formData.ownRentLocation} onValueChange={(value) => updateFormData('ownRentLocation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Own/Rent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeRemainingOnLease">Time Remaining on Lease</Label>
                <Input
                  id="timeRemainingOnLease"
                  value={formData.timeRemainingOnLease}
                  onChange={(e) => updateFormData('timeRemainingOnLease', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessLandlord">Business Landlord</Label>
                <Input
                  id="businessLandlord"
                  value={formData.businessLandlord}
                  onChange={(e) => updateFormData('businessLandlord', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Any Pending Legal Actions or Claims?</Label>
                <Select value={formData.pendingLegalActions} onValueChange={(value) => updateFormData('pendingLegalActions', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yes/No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlyBankAmount">Monthly Bank Amount</Label>
                <Input
                  id="monthlyBankAmount"
                  value={formData.monthlyBankAmount}
                  onChange={(e) => updateFormData('monthlyBankAmount', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Owner Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => updateFormData('ownerName', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerTitle">Title</Label>
                <Input
                  id="ownerTitle"
                  value={formData.ownerTitle}
                  onChange={(e) => updateFormData('ownerTitle', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownershipPercentage">Ownership %</Label>
                <Input
                  id="ownershipPercentage"
                  type="number"
                  max="100"
                  value={formData.ownershipPercentage}
                  onChange={(e) => updateFormData('ownershipPercentage', e.target.value)}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ownerHomeAddress">Home Address *</Label>
                <Input
                  id="ownerHomeAddress"
                  value={formData.ownerHomeAddress}
                  onChange={(e) => updateFormData('ownerHomeAddress', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerCity">City *</Label>
                <Input
                  id="ownerCity"
                  value={formData.ownerCity}
                  onChange={(e) => updateFormData('ownerCity', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerState">State/Zip *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="State"
                    value={formData.ownerState}
                    onChange={(e) => updateFormData('ownerState', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Zip"
                    value={formData.ownerZip}
                    onChange={(e) => updateFormData('ownerZip', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerSSN">SSN *</Label>
                <Input
                  id="ownerSSN"
                  value={formData.ownerSSN}
                  onChange={(e) => updateFormData('ownerSSN', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerDOB">DOB *</Label>
                <Input
                  id="ownerDOB"
                  type="date"
                  value={formData.ownerDOB}
                  onChange={(e) => updateFormData('ownerDOB', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerHomePhone">Home Phone</Label>
                <Input
                  id="ownerHomePhone"
                  type="tel"
                  value={formData.ownerHomePhone}
                  onChange={(e) => updateFormData('ownerHomePhone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerCell">Cell</Label>
                <Input
                  id="ownerCell"
                  type="tel"
                  value={formData.ownerCell}
                  onChange={(e) => updateFormData('ownerCell', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Do you own or rent your residence?</Label>
                <Select value={formData.ownerOwnRent} onValueChange={(value) => updateFormData('ownerOwnRent', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Own/Rent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerDriversLicense">Drivers License #</Label>
                <Input
                  id="ownerDriversLicense"
                  value={formData.ownerDriversLicense}
                  onChange={(e) => updateFormData('ownerDriversLicense', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerStateIssued">State Issued</Label>
                <Input
                  id="ownerStateIssued"
                  value={formData.ownerStateIssued}
                  onChange={(e) => updateFormData('ownerStateIssued', e.target.value)}
                />
              </div>
            </div>
            
            {/* Partner Information Section */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-xl font-semibold mb-4">Owner/Partner Information (if applicable)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partnerName">Partner Name</Label>
                  <Input
                    id="partnerName"
                    value={formData.partnerName}
                    onChange={(e) => updateFormData('partnerName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="partnerTitle">Title</Label>
                  <Input
                    id="partnerTitle"
                    value={formData.partnerTitle}
                    onChange={(e) => updateFormData('partnerTitle', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="partnerOwnershipPercentage">Ownership %</Label>
                  <Input
                    id="partnerOwnershipPercentage"
                    type="number"
                    max="100"
                    value={formData.partnerOwnershipPercentage}
                    onChange={(e) => updateFormData('partnerOwnershipPercentage', e.target.value)}
                  />
                </div>
                
                {formData.partnerName && (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="partnerHomeAddress">Home Address</Label>
                      <Input
                        id="partnerHomeAddress"
                        value={formData.partnerHomeAddress}
                        onChange={(e) => updateFormData('partnerHomeAddress', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="partnerCity">City</Label>
                      <Input
                        id="partnerCity"
                        value={formData.partnerCity}
                        onChange={(e) => updateFormData('partnerCity', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="partnerState">State/Zip</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="State"
                          value={formData.partnerState}
                          onChange={(e) => updateFormData('partnerState', e.target.value)}
                        />
                        <Input
                          placeholder="Zip"
                          value={formData.partnerZip}
                          onChange={(e) => updateFormData('partnerZip', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="partnerSSN">SSN</Label>
                      <Input
                        id="partnerSSN"
                        value={formData.partnerSSN}
                        onChange={(e) => updateFormData('partnerSSN', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="partnerDOB">DOB</Label>
                      <Input
                        id="partnerDOB"
                        type="date"
                        value={formData.partnerDOB}
                        onChange={(e) => updateFormData('partnerDOB', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Processing Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 md:col-span-2">
                <Label>Do you Accept Cards:</Label>
                <div className="flex flex-wrap gap-4">
                  {['Visa', 'Visa Debit', 'Mastercard', 'Discover', 'AMEX', 'Pinpad Debit'].map((card) => (
                    <div key={card} className="flex items-center space-x-2">
                      <Checkbox
                        id={card}
                        checked={formData.acceptCards.includes(card)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormData('acceptCards', [...formData.acceptCards, card]);
                          } else {
                            updateFormData('acceptCards', formData.acceptCards.filter(c => c !== card));
                          }
                        }}
                      />
                      <Label htmlFor={card}>{card}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlyCardVolume">Monthly Card Volume</Label>
                <Input
                  id="monthlyCardVolume"
                  value={formData.monthlyCardVolume}
                  onChange={(e) => updateFormData('monthlyCardVolume', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfTerminals">Number of Terminals</Label>
                <Input
                  id="numberOfTerminals"
                  type="number"
                  value={formData.numberOfTerminals}
                  onChange={(e) => updateFormData('numberOfTerminals', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="posVersion">POS Version</Label>
                <Input
                  id="posVersion"
                  value={formData.posVersion}
                  onChange={(e) => updateFormData('posVersion', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="highTicket">High Ticket</Label>
                <Input
                  id="highTicket"
                  value={formData.highTicket}
                  onChange={(e) => updateFormData('highTicket', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Review Your Application
              </h3>
              <p className="text-muted-foreground mb-4">
                Please review all the information you've provided before submitting your application. 
                Our team will review your application and contact you within 1-2 business days.
              </p>
              <div className="text-sm space-y-2">
                <p><strong>Business:</strong> {formData.legalCorporationName}</p>
                <p><strong>Contact:</strong> {formData.email} | {formData.telephoneNumber}</p>
                <p><strong>Funding Amount:</strong> {formData.requestedFundingAmount}</p>
                <p><strong>Owner:</strong> {formData.ownerName}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Business Loan Application</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Complete your full application in {totalSteps} easy steps
            </CardDescription>
            <div className="mt-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {renderStep()}

            <div className="flex justify-between mt-8 pt-8 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
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
  );
};

export default Application;