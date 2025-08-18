import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Shield, UserPlus, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnhancedApplicationAuthProps {
  email?: string;
  name?: string;
  onAuthSuccess: () => void;
}

interface AuthRef {
  validateAndSubmit: () => Promise<boolean>;
  formData: any;
  errors: Record<string, string>;
  isLoading: boolean;
}

export const EnhancedApplicationAuth = forwardRef<AuthRef, EnhancedApplicationAuthProps>(
  ({ email = "", name = "", onAuthSuccess }, ref) => {
    const [formData, setFormData] = useState({
      email: email,
      password: "",
      confirmPassword: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("at least 8 characters");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("one number");
    }
    return errors;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const passwordErrors = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (passwordErrors.length > 0) {
      newErrors.password = `Password must contain ${passwordErrors.join(", ")}`;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    validateAndSubmit: handleSubmit,
    formData,
    errors,
    isLoading
  }));

  const handleSubmit = async (e?: React.FormEvent): Promise<boolean> => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return false;

    setIsLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.href,
          data: {
            display_name: name
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
            return false;
          } else {
            toast.success("Successfully signed in!");
            onAuthSuccess();
            return true;
          }
        }
        
        // Handle specific Supabase auth errors
        if (authError.message.includes("Password should be at least")) {
          setErrors({ password: "Password must be at least 8 characters with uppercase, lowercase, and number" });
          return false;
        }
        
        if (authError.message.includes("weak")) {
          setErrors({ password: "Please choose a stronger password with mixed case letters, numbers, and special characters" });
          return false;
        }
        
        if (authError.message.includes("Invalid email")) {
          setErrors({ email: "Please enter a valid email address" });
          return false;
        }
        
        throw authError;
      }

      if (authData.user) {
        toast.success("Account created successfully! You can now submit your application.");
        onAuthSuccess();
        return true;
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Provide specific error messages
      const errorMessage = error?.message || "Failed to create account. Please try again.";
      
      if (errorMessage.includes("email")) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes("password")) {
        setErrors({ password: errorMessage });
      } else {
        toast.error(errorMessage);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!formData.password) return "border-green-500 focus-visible:border-green-600";
    const errors = validatePassword(formData.password);
    if (errors.length === 0) return "border-green-500 focus-visible:border-green-600";
    if (errors.length <= 2) return "border-yellow-500 focus-visible:border-yellow-600";
    return "border-red-500 focus-visible:border-red-600";
  };

  const getConfirmPasswordColor = () => {
    if (!formData.confirmPassword) return "border-green-500 focus-visible:border-green-600";
    if (formData.password === formData.confirmPassword) return "border-green-500 focus-visible:border-green-600";
    return "border-red-500 focus-visible:border-red-600";
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email" className="text-lg font-medium">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
            className={`h-16 text-lg border-2 ${errors.email ? "border-red-500" : "border-green-500 focus-visible:border-green-600"}`}
            disabled
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="text-lg font-medium">Create Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Create a secure password"
              className={`h-16 text-lg border-2 pr-12 ${getPasswordStrengthColor()}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Eye className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Must be at least 8 characters with uppercase, lowercase, and number
          </p>
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-lg font-medium">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm your password"
              className={`h-16 text-lg border-2 pr-12 ${getConfirmPasswordColor()}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Eye className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
          )}
        </div>
      </form>
    </div>
  );
});