import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ConfirmPartner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [token] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setVerifying(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      setVerifying(true);
      
      // Check if token exists and is valid
      const { data: tokenData, error: tokenError } = await supabase
        .from('partner_confirmation_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        setTokenValid(false);
        toast({
          title: "Invalid Token",
          description: "This confirmation link is invalid or has expired.",
          variant: "destructive"
        });
        return;
      }

      // Get partner information from unified partners table
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('email', tokenData.email)
        .single();

      if (partnerError || !partnerData) {
        setTokenValid(false);
        toast({
          title: "Partner Not Found",
          description: "No partner found for this email.",
          variant: "destructive"
        });
        return;
      }

      setTokenValid(true);
      setPartnerInfo(partnerData);
      
    } catch (error: any) {
      console.error('Error verifying token:', error);
      setTokenValid(false);
      toast({
        title: "Error",
        description: "Failed to verify confirmation token.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create user account with the partner email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: partnerInfo.email,
        password: password,
        options: {
          emailRedirectTo: `https://truenorthbusinessloan.ca/admin`,
          data: {
            display_name: partnerInfo.name,
            company_name: partnerInfo.company_name,
            application_type: partnerInfo.application_type
          }
        }
      });

      if (authError) {
        // If user already exists, try to update their password
        if (authError.message.includes('already registered')) {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            partnerInfo.email,
            {
              redirectTo: `https://truenorthbusinessloan.ca/auth?mode=reset`
            }
          );
          
          if (resetError) throw resetError;
          
          toast({
            title: "Account Already Exists",
            description: "A password reset link has been sent to your email.",
          });
        } else {
          throw authError;
        }
      } else {
        // Update partner status to pending (awaiting admin approval)
        const { error: updateError } = await supabase
          .from('partners')
          .update({
            status: 'pending',
            user_id: authData.user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', partnerInfo.id);

        if (updateError) {
          console.error('Error updating partner status:', updateError);
        }

        // Mark token as used
        await supabase
          .from('partner_confirmation_tokens')
          .update({ used: true })
          .eq('token', token);

        toast({
          title: "Account Confirmed!",
          description: "Your partner account has been activated. You can now log in.",
        });

        // Redirect to login page
        setTimeout(() => {
          navigate('/auth?message=account-confirmed');
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error confirming account:', error);
      toast({
        title: "Error",
        description: "Failed to confirm account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Verifying confirmation link...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invalid Confirmation Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              This confirmation link is invalid, expired, or has already been used.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Confirm Your Account</CardTitle>
          <p className="text-muted-foreground">
            Welcome {partnerInfo?.name}! Set up your password to access the partner portal.
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Account Details</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {partnerInfo?.name}</p>
              <p><strong>Company:</strong> {partnerInfo?.company_name}</p>
              <p><strong>Type:</strong> {partnerInfo?.application_type === 'broker' ? 'Broker' : 'Lender'}</p>
              <p><strong>Email:</strong> {partnerInfo?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming Account...
                </>
              ) : (
                'Confirm Account & Set Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}