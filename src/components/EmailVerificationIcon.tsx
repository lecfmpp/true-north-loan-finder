import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EmailVerificationIconProps {
  isVerified: boolean;
  verifiedAt?: string | null;
  size?: "sm" | "md" | "lg";
}

export const EmailVerificationIcon = ({ 
  isVerified, 
  verifiedAt, 
  size = "md" 
}: EmailVerificationIconProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const getTooltipText = () => {
    if (isVerified && verifiedAt) {
      const date = new Date(verifiedAt);
      return `Email verified on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
    }
    if (isVerified) {
      return "Email verified";
    }
    return "Email not verified - verification email sent";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center cursor-help">
            {isVerified ? (
              <div className={`${sizeClasses[size]} bg-green-500 rounded-full flex items-center justify-center`}>
                <CheckCircle className={`${iconSizes[size]} text-white`} />
              </div>
            ) : (
              <div className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center`}>
                <XCircle className={`${iconSizes[size]} text-gray-600`} />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};