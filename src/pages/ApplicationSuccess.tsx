import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Mail, Phone, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const ApplicationSuccess = () => {
  const navigate = useNavigate();
  const [referenceNumber, setReferenceNumber] = useState<string>("");

  useEffect(() => {
    // Get reference number from localStorage
    const storedRef = localStorage.getItem('application_reference_number');
    if (storedRef) {
      setReferenceNumber(storedRef);
      // Clear it from localStorage after displaying
      localStorage.removeItem('application_reference_number');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Application Submitted Successfully!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your business loan application. We've received your information and will review it promptly.
            </p>
          </div>

          {/* Reference Number Card */}
          {referenceNumber && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Application Reference Number</p>
                    <p className="text-xl font-bold font-mono text-primary">{referenceNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please save this number for future reference
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                What Happens Next?
              </CardTitle>
              <CardDescription>
                Here's what you can expect from us
              </CardDescription>
            </CardHeader>
            <CardContent className="text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Initial Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Our team will review your application within 24 hours and may contact you for additional information.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    We may request additional documents such as bank statements, tax returns, or financial statements.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Decision & Funding</h3>
                  <p className="text-sm text-muted-foreground">
                    Once approved, we'll work with you to finalize terms and get you funded quickly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Our team is here to assist you with any questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm">info@truenorthbusinessloan.ca</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <Button 
              onClick={() => navigate("/")}
              className="w-full sm:w-auto"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccess;