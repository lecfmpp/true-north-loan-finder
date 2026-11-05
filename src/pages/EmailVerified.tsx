import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, AlertTriangle, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

type Status = "success" | "invalid" | "expired" | "error";

const COPY: Record<
  Status,
  { icon: JSX.Element; iconWrap: string; title: string; message: string }
> = {
  success: {
    icon: <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />,
    iconWrap: "bg-green-100 dark:bg-green-900/20",
    title: "Email Verified Successfully!",
    message:
      "Thank you for verifying your email address. Your submission is now complete and verified — our team is reviewing it to connect you with the most suitable lenders from our network.",
  },
  invalid: {
    icon: <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />,
    iconWrap: "bg-red-100 dark:bg-red-900/20",
    title: "Verification Failed",
    message:
      "This verification link is invalid or has already been used. If you've already verified your email, you're all set — no further action is needed.",
  },
  expired: {
    icon: <Clock className="w-12 h-12 text-amber-600 dark:text-amber-400" />,
    iconWrap: "bg-amber-100 dark:bg-amber-900/20",
    title: "Verification Link Expired",
    message:
      "This verification link has expired for security reasons (links are valid for 24 hours). Please complete the loan estimator again to receive a fresh verification email.",
  },
  error: {
    icon: <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />,
    iconWrap: "bg-red-100 dark:bg-red-900/20",
    title: "Something Went Wrong",
    message:
      "We ran into a problem verifying your email. Please try the link again in a few minutes, or contact us and we'll sort it out right away.",
  },
};

const EmailVerified = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const raw = params.get("status") as Status | null;
  const status: Status =
    raw && ["success", "invalid", "expired", "error"].includes(raw) ? raw : "success";
  const copy = COPY[status];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Email Verification - True North Business Loan"
        description="Email verification status for your True North Business Loan submission."
        canonicalUrl="https://truenorthbusinessloan.ca/email-verified"
      />
      <Header />
      <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <div
              className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${copy.iconWrap}`}
            >
              {copy.icon}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{copy.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">{copy.message}</p>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Questions? Email us at info@truenorthbusinessloan.ca</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/")} variant="outline" className="w-full sm:w-auto">
                Return to Home
              </Button>
              {status === "expired" && (
                <Button onClick={() => navigate("/loan-estimator")} className="w-full sm:w-auto">
                  Start the Loan Estimator
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

export default EmailVerified;
