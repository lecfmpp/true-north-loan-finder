import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  CheckCircle, 
  Clock, 
  Shield, 
  TrendingUp, 
  Zap,
  Star,
  ArrowRight,
  DollarSign
} from "lucide-react";

// Strategic CTA Placement Component
interface StrategicCTAProps {
  variant?: "primary" | "secondary" | "urgency";
  size?: "sm" | "lg" | "xl";
  position?: "above-fold" | "mid-content" | "bottom";
  copy?: string;
  link?: string;
  context?: string;
}

export const StrategicCTA = ({ 
  variant = "primary", 
  size = "lg",
  position = "above-fold",
  copy = "Get Approved in 24 Hours",
  link = "/loan-estimator",
  context = "general"
}: StrategicCTAProps) => {
  
  const getVariantStyles = () => {
    switch (variant) {
      case "urgency":
        return "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl animate-pulse";
      case "secondary": 
        return "bg-secondary hover:bg-secondary/90 text-secondary-foreground";
      default:
        return "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl";
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case "above-fold":
        return "mb-8 transform hover:scale-105 transition-all duration-300";
      case "mid-content":
        return "my-12 border-2 border-accent/20 rounded-lg p-6 bg-accent/5";
      case "bottom":
        return "mt-8 bg-gradient-to-r from-primary to-secondary text-primary-foreground";
      default:
        return "";
    }
  };

  return (
    <div className={`text-center ${getPositionStyles()}`}>
      {position === "mid-content" && (
        <div className="mb-4">
          <Badge variant="secondary" className="mb-2">Limited Time</Badge>
          <h3 className="text-2xl font-bold text-primary mb-2">Ready to Get Started?</h3>
          <p className="text-muted-foreground">Join thousands of businesses that got funded fast</p>
        </div>
      )}
      
      <Button 
        asChild 
        variant={variant === "urgency" ? "destructive" : "default"}
        size={size}
        className={`text-lg px-8 ${getVariantStyles()}`}
      >
        <Link to={link}>
          {copy} →
        </Link>
      </Button>
      
      {position === "above-fold" && (
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-secondary" />
            <span>Secure Application</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-secondary" />
            <span>60 Second Form</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-secondary" />
            <span>No Obligation</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Trust Signals Component
export const TrustSignals = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold text-primary">10,000+</div>
        <div className="text-sm text-muted-foreground">Businesses Funded</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold text-primary">$2.5B+</div>
        <div className="text-sm text-muted-foreground">Capital Deployed</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold text-primary">4.8★</div>
        <div className="text-sm text-muted-foreground">Customer Rating</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold text-primary">24hrs</div>
        <div className="text-sm text-muted-foreground">Average Approval</div>
      </div>
    </div>
  );
};

// Social Proof Widget Enhanced
export const EnhancedSocialProof = () => {
  const recentFundings = [
    { business: "Toronto Restaurant", amount: "$125K", type: "Working Capital", time: "2 hours ago" },
    { business: "Calgary Construction", amount: "$340K", type: "Equipment Loan", time: "4 hours ago" },
    { business: "Vancouver Tech Startup", amount: "$75K", type: "Line of Credit", time: "6 hours ago" },
    { business: "Montreal Manufacturing", amount: "$250K", type: "Term Loan", time: "8 hours ago" }
  ];

  return (
    <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-primary">Recent Approvals</span>
        </div>
        <div className="space-y-3">
          {recentFundings.slice(0, 3).map((funding, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">{funding.business}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{funding.amount}</div>
                <div className="text-xs text-muted-foreground">{funding.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-secondary/20">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span>Join 10,000+ funded businesses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Urgency Creator Component
export const UrgencyMessage = ({ context = "general" }: { context?: string }) => {
  const getUrgencyMessage = () => {
    switch (context) {
      case "homepage":
        return {
          title: "🔥 Funding Rates Increasing Soon",
          message: "Lock in today's rates before they increase. Limited spots available for this week's funding batch.",
          countdown: true
        };
      case "loans":
        return {
          title: "⚡ Same Week Funding Available",
          message: "Get approved today, funded by Friday. Only 12 spots left for this week's priority processing.",
          countdown: false
        };
      default:
        return {
          title: "⏰ Limited Time Opportunity", 
          message: "Current promotion ends soon. Apply now to secure preferred rates and fast-track approval.",
          countdown: false
        };
    }
  };

  const urgency = getUrgencyMessage();

  return (
    <Card className="bg-gradient-to-r from-destructive/10 to-orange-500/10 border-destructive/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Zap className="h-6 w-6 text-destructive animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-destructive mb-1">{urgency.title}</div>
            <div className="text-sm text-muted-foreground">{urgency.message}</div>
          </div>
          <Button variant="destructive" size="sm" asChild>
            <Link to="/loan-estimator">Apply Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Risk Reversal Component
export const RiskReversal = () => {
  return (
    <div className="bg-muted/30 rounded-lg p-6 text-center">
      <h3 className="text-xl font-bold text-primary mb-4">Zero Risk Guarantee</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col items-center">
          <Shield className="h-8 w-8 text-secondary mb-2" />
          <div className="font-semibold">No Obligation</div>
          <div className="text-sm text-muted-foreground">Free quotes with no commitment</div>
        </div>
        <div className="flex flex-col items-center">
          <CheckCircle className="h-8 w-8 text-secondary mb-2" />
          <div className="font-semibold">No Hidden Fees</div>
          <div className="text-sm text-muted-foreground">Transparent pricing always</div>
        </div>
        <div className="flex flex-col items-center">
          <Clock className="h-8 w-8 text-secondary mb-2" />
          <div className="font-semibold">60 Second Form</div>
          <div className="text-sm text-muted-foreground">Quick and easy application</div>
        </div>
      </div>
      <Button variant="outline" size="lg" asChild>
        <Link to="/loan-estimator">Try Risk-Free Application</Link>
      </Button>
    </div>
  );
};

// Value Proposition Enhancer
export const ValuePropCard = ({ 
  title, 
  subtitle, 
  benefits, 
  cta = "Learn More",
  link = "/loan-estimator" 
}: {
  title: string;
  subtitle: string;
  benefits: string[];
  cta?: string;
  link?: string;
}) => {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-8">
        <h3 className="text-2xl font-bold text-primary mb-3">{title}</h3>
        <p className="text-muted-foreground mb-6 font-serif">{subtitle}</p>
        <ul className="space-y-3 mb-6">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground">
          <Link to={link} className="flex items-center justify-center gap-2">
            {cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default {
  StrategicCTA,
  TrustSignals,
  EnhancedSocialProof,
  UrgencyMessage,
  RiskReversal,
  ValuePropCard
};