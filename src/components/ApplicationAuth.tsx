import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Shield, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApplicationAuthProps {
  email?: string;
  name?: string;
  onAuthSuccess: () => void;
}

export const ApplicationAuth = ({ email = "", name = "", onAuthSuccess }: ApplicationAuthProps) => {
  const [formData, setFormData] = useState({
    email: email,
    password: "",
    confirmPassword: "",
    name: name,
    agreeToTerms: false,
    subscribeToUpdates: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: formData.name,
            subscribe_to_updates: formData.subscribeToUpdates
          }
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          // Try to sign in instead
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          });

          if (signInError) {
            setErrors({ password: "Account exists but password is incorrect. Please use the correct password or contact support." });
            return;
          } else {
            toast.success("Successfully signed in!");
            onAuthSuccess();
            return;
          }
        }
        throw authError;
      }

      if (authData.user) {
        toast.success("Account created successfully! You can now submit your application.");
        onAuthSuccess();
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Create Your Secure Account</CardTitle>
        <CardDescription>
          This secure account will allow you to complete your application and track its progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Create a secure password"
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm your password"
              className={errors.confirmPassword ? "border-destructive" : ""}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                }
                className={errors.agreeToTerms ? "border-destructive" : ""}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="agreeToTerms"
                  className="text-sm font-normal leading-relaxed cursor-pointer"
                >
                  I agree to the{" "}
                  <a href="/terms" className="text-primary hover:underline" target="_blank">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-primary hover:underline" target="_blank">
                    Privacy Policy
                  </a>. My information will be used solely for application processing and will not be shared with third parties.
                </Label>
              </div>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-destructive">{errors.agreeToTerms}</p>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="subscribeToUpdates"
                checked={formData.subscribeToUpdates}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, subscribeToUpdates: checked as boolean }))
                }
              />
              <Label
                htmlFor="subscribeToUpdates"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                Subscribe to application updates and funding opportunities (optional)
              </Label>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Why create an account?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Secure storage of your application data</li>
                  <li>• Track your application status in real-time</li>
                  <li>• Receive important updates about your application</li>
                  <li>• Access to your funding dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              "Creating Account..."
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account & Continue
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};