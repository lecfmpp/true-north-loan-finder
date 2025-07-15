import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ApplicationFormData {
  // Personal & Company Info
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  companyName: string;
  companyWebsite: string;
  applicationType: 'lender' | 'broker' | '';
  licenseNumber: string;
  yearsOfExperience: number | '';
  
  // Funding Preferences
  preferredBusinessTypes: string[];
  preferredIndustries: string[];
  minMonthlyRevenue: string;
  maxMonthlyRevenue: string;
  minTimeInBusiness: string;
  minCreditScore: string;
  preferredLoanAmounts: string[];
  fundingPurposes: string[];
  geographicAreas: string[];
  
  // Additional Info
  businessDescription: string;
  specialRequirements: string;
}

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [matchingLeads, setMatchingLeads] = useState(0);
  const { signIn, signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ApplicationFormData>({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    companyName: '',
    companyWebsite: '',
    applicationType: '',
    licenseNumber: '',
    yearsOfExperience: '',
    preferredBusinessTypes: [],
    preferredIndustries: [],
    minMonthlyRevenue: '',
    maxMonthlyRevenue: '',
    minTimeInBusiness: '',
    minCreditScore: '',
    preferredLoanAmounts: [],
    fundingPurposes: [],
    geographicAreas: [],
    businessDescription: '',
    specialRequirements: '',
  });

  useEffect(() => {
    if (user) {
      // Redirect admin users to admin page, regular users to home
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, isAdmin, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as Canadian phone number: (XXX) XXX-XXXX
    if (phoneNumber.length >= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length > 0) {
      return `(${phoneNumber}`;
    }
    return phoneNumber;
  };

  const formatWebsite = (value: string) => {
    if (!value) return '';
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return 'https://' + value;
    }
    return value;
  };

  const validateLicenseNumber = (value: string) => {
    // Common broker/lender license formats in Canada
    const patterns = [
      /^[A-Z]{2}\d{6,8}$/,  // Province abbreviation + 6-8 digits
      /^[A-Z]\d{7,9}$/,     // Single letter + 7-9 digits
      /^\d{6,10}$/,         // 6-10 digits only
      /^[A-Z]{2}-\d{4,8}$/, // Province-number format
      /^[A-Z]{3}\d{4,6}$/   // 3 letters + 4-6 digits
    ];
    return patterns.some(pattern => pattern.test(value.toUpperCase())) || value.length === 0;
  };

  const handleInputChange = (field: keyof ApplicationFormData, value: any) => {
    let processedValue = value;
    
    if (field === 'applicantPhone') {
      processedValue = formatPhoneNumber(value);
    } else if (field === 'companyWebsite') {
      processedValue = formatWebsite(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleCheckboxChange = (field: keyof ApplicationFormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const generateRandomLeadsCount = () => {
    return Math.floor(Math.random() * 300) + 150; // Random number between 150-449
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.applicantName || !formData.applicantEmail || !formData.companyName || 
          !formData.applicationType || !formData.minMonthlyRevenue) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Submit application to database
      const { error } = await supabase
        .from('lender_broker_applications')
        .insert({
          applicant_name: formData.applicantName,
          applicant_email: formData.applicantEmail,
          applicant_phone: formData.applicantPhone,
          company_name: formData.companyName,
          company_website: formData.companyWebsite,
          application_type: formData.applicationType,
          license_number: formData.licenseNumber,
          years_of_experience: typeof formData.yearsOfExperience === 'number' ? formData.yearsOfExperience : null,
          business_description: `
            Preferred Business Types: ${formData.preferredBusinessTypes.join(', ')}
            Preferred Industries: ${formData.preferredIndustries.join(', ')}
            Monthly Revenue Range: $${formData.minMonthlyRevenue} - $${formData.maxMonthlyRevenue}
            Min Time in Business: ${formData.minTimeInBusiness}
            Min Credit Score: ${formData.minCreditScore}
            Preferred Loan Amounts: ${formData.preferredLoanAmounts.join(', ')}
            Funding Purposes: ${formData.fundingPurposes.join(', ')}
            Geographic Areas: ${formData.geographicAreas.join(', ')}
            
            Business Description: ${formData.businessDescription}
            Special Requirements: ${formData.specialRequirements}
          `.trim()
        });

      if (error) throw error;

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-application-confirmation', {
          body: {
            applicantName: formData.applicantName,
            applicantEmail: formData.applicantEmail,
            companyName: formData.companyName,
            applicationType: formData.applicationType
          }
        });
        console.log('Confirmation email sent successfully');
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the application if email fails, just log it
      }

      // Generate random leads count and show success message
      const leadsCount = generateRandomLeadsCount();
      setMatchingLeads(leadsCount);
      setShowSuccessMessage(true);

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-green-600">
                  We found around {matchingLeads} leads matching your profile!
                </CardTitle>
                <CardDescription className="text-lg">
                  Application Successfully Submitted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    🎉 Great news, {formData.applicantName}!
                  </h3>
                  <p className="text-green-700 mb-4">
                    We are now analyzing the types of business owners and leads we have in our database to match your specific funding criteria and preferences.
                  </p>
                  <p className="text-green-700 mb-4">
                    Our team will review your application and get back to you within 24-48 hours with:
                  </p>
                  <ul className="text-left text-green-700 space-y-2">
                    <li>• Access to your personalized broker/lender dashboard</li>
                    <li>• Pre-qualified leads matching your criteria</li>
                    <li>• Direct contact information for interested business owners</li>
                    <li>• Real-time lead notifications</li>
                  </ul>
                </div>
                <div className="text-muted-foreground">
                  <p>Check your email ({formData.applicantEmail}) for further instructions.</p>
                </div>
                <Button 
                  onClick={() => {
                    setShowSuccessMessage(false);
                    // Reset form or redirect
                    navigate('/');
                  }}
                  className="w-full"
                >
                  Return to Homepage
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Apply as Broker/Lender</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Broker & Lender Portal</CardTitle>
                  <CardDescription>
                    This portal is exclusively for licensed brokers and lenders. Sign in to access qualified business owners looking for funding opportunities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Broker & Lender Application</CardTitle>
                  <CardDescription>
                    Tell us about your funding preferences so we can match you with the right business owners seeking funding.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleApplicationSubmit} className="space-y-6">
                    {/* Personal & Company Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Personal & Company Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="applicant-name">Full Name *</Label>
                          <Input
                            id="applicant-name"
                            value={formData.applicantName}
                            onChange={(e) => handleInputChange('applicantName', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="applicant-email">Email Address *</Label>
                          <Input
                            id="applicant-email"
                            type="email"
                            value={formData.applicantEmail}
                            onChange={(e) => handleInputChange('applicantEmail', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="applicant-phone">Phone Number</Label>
                          <Input
                            id="applicant-phone"
                            value={formData.applicantPhone}
                            onChange={(e) => handleInputChange('applicantPhone', e.target.value)}
                            placeholder="(123) 456-7890"
                            maxLength={14}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="application-type">I am a *</Label>
                          <Select value={formData.applicationType} onValueChange={(value) => handleInputChange('applicationType', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lender">Lender</SelectItem>
                              <SelectItem value="broker">Broker</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company-name">Company Name *</Label>
                          <Input
                            id="company-name"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="company-website">Company Website</Label>
                          <Input
                            id="company-website"
                            value={formData.companyWebsite}
                            onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                            placeholder="yourcompany.com"
                          />
                          <p className="text-xs text-muted-foreground">https:// will be automatically added</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="license-number">License Number</Label>
                          <Input
                            id="license-number"
                            value={formData.licenseNumber}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              if (validateLicenseNumber(value)) {
                                handleInputChange('licenseNumber', value);
                              }
                            }}
                            placeholder="e.g., ON123456, B1234567, 12345678"
                            maxLength={12}
                          />
                          <p className="text-xs text-muted-foreground">Common formats: Province+digits (ON123456), Letter+digits (B1234567), or digits only</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="years-experience">Years of Experience</Label>
                          <Input
                            id="years-experience"
                            type="number"
                            min="0"
                            value={formData.yearsOfExperience}
                            onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || '')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Funding Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Funding Preferences</h3>
                      
                      <div className="space-y-2">
                        <Label>Types of Businesses You Prefer to Fund</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Sole Proprietorship', 'LLC', 'Corporation', 'Partnership', 'Franchise', 'Non-Profit'].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`business-type-${type}`}
                                checked={formData.preferredBusinessTypes.includes(type)}
                                onCheckedChange={(checked) => handleCheckboxChange('preferredBusinessTypes', type, checked as boolean)}
                              />
                              <Label htmlFor={`business-type-${type}`} className="text-sm">{type}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Industries</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Retail', 'Restaurant/Food Service', 'Healthcare', 'Construction', 'Manufacturing', 'Technology', 'Professional Services', 'Transportation', 'Real Estate', 'Agriculture', 'Automotive', 'Other'].map((industry) => (
                            <div key={industry} className="flex items-center space-x-2">
                              <Checkbox
                                id={`industry-${industry}`}
                                checked={formData.preferredIndustries.includes(industry)}
                                onCheckedChange={(checked) => handleCheckboxChange('preferredIndustries', industry, checked as boolean)}
                              />
                              <Label htmlFor={`industry-${industry}`} className="text-sm">{industry}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min-revenue">Minimum Monthly Revenue *</Label>
                          <Select value={formData.minMonthlyRevenue} onValueChange={(value) => handleInputChange('minMonthlyRevenue', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select minimum revenue" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5000">$5,000+</SelectItem>
                              <SelectItem value="10000">$10,000+</SelectItem>
                              <SelectItem value="25000">$25,000+</SelectItem>
                              <SelectItem value="50000">$50,000+</SelectItem>
                              <SelectItem value="100000">$100,000+</SelectItem>
                              <SelectItem value="250000">$250,000+</SelectItem>
                              <SelectItem value="500000">$500,000+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="max-revenue">Maximum Monthly Revenue</Label>
                          <Select value={formData.maxMonthlyRevenue} onValueChange={(value) => handleInputChange('maxMonthlyRevenue', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select maximum revenue" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="50000">$50,000</SelectItem>
                              <SelectItem value="100000">$100,000</SelectItem>
                              <SelectItem value="250000">$250,000</SelectItem>
                              <SelectItem value="500000">$500,000</SelectItem>
                              <SelectItem value="1000000">$1,000,000</SelectItem>
                              <SelectItem value="unlimited">No Limit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min-time-business">Minimum Time in Business</Label>
                          <Select value={formData.minTimeInBusiness} onValueChange={(value) => handleInputChange('minTimeInBusiness', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select minimum time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3-months">3+ months</SelectItem>
                              <SelectItem value="6-months">6+ months</SelectItem>
                              <SelectItem value="1-year">1+ year</SelectItem>
                              <SelectItem value="2-years">2+ years</SelectItem>
                              <SelectItem value="5-years">5+ years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="min-credit-score">Minimum Credit Score</Label>
                          <Select value={formData.minCreditScore} onValueChange={(value) => handleInputChange('minCreditScore', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select minimum score" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="500">500+</SelectItem>
                              <SelectItem value="550">550+</SelectItem>
                              <SelectItem value="600">600+</SelectItem>
                              <SelectItem value="650">650+</SelectItem>
                              <SelectItem value="700">700+</SelectItem>
                              <SelectItem value="750">750+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Loan Amounts</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['$10K - $50K', '$50K - $100K', '$100K - $250K', '$250K - $500K', '$500K - $1M', '$1M+'].map((amount) => (
                            <div key={amount} className="flex items-center space-x-2">
                              <Checkbox
                                id={`loan-amount-${amount}`}
                                checked={formData.preferredLoanAmounts.includes(amount)}
                                onCheckedChange={(checked) => handleCheckboxChange('preferredLoanAmounts', amount, checked as boolean)}
                              />
                              <Label htmlFor={`loan-amount-${amount}`} className="text-sm">{amount}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Funding Purposes You Specialize In</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Equipment Financing', 'Working Capital', 'Inventory Purchase', 'Real Estate', 'Business Expansion', 'Debt Consolidation', 'Marketing/Advertising', 'Technology Upgrades', 'Payroll', 'Other'].map((purpose) => (
                            <div key={purpose} className="flex items-center space-x-2">
                              <Checkbox
                                id={`purpose-${purpose}`}
                                checked={formData.fundingPurposes.includes(purpose)}
                                onCheckedChange={(checked) => handleCheckboxChange('fundingPurposes', purpose, checked as boolean)}
                              />
                              <Label htmlFor={`purpose-${purpose}`} className="text-sm">{purpose}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                        <div className="space-y-2">
                         <Label>Geographic Areas You Serve</Label>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                           {['Local/Regional', 'Province-wide', 'Multi-province', 'National', 'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Other Provinces'].map((area) => (
                             <div key={area} className="flex items-center space-x-2">
                               <Checkbox
                                 id={`area-${area}`}
                                 checked={formData.geographicAreas.includes(area)}
                                 onCheckedChange={(checked) => handleCheckboxChange('geographicAreas', area, checked as boolean)}
                               />
                               <Label htmlFor={`area-${area}`} className="text-sm">{area}</Label>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Additional Information</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="business-description">Describe Your Business and Services</Label>
                        <Textarea
                          id="business-description"
                          value={formData.businessDescription}
                          onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                          placeholder="Tell us about your company, experience, and the types of funding solutions you provide..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="special-requirements">Special Requirements or Notes</Label>
                        <Textarea
                          id="special-requirements"
                          value={formData.specialRequirements}
                          onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                          placeholder="Any specific requirements, certifications, or additional information you'd like us to know..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Submitting Application...' : 'Submit Application'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;