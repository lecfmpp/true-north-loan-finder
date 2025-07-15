import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type SocialProofNotification = Tables<"social_proof_notifications">;

const SocialProofWidget = () => {
  const [notifications, setNotifications] = useState<SocialProofNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && isEnabled) {
      // Show first notification after 3 seconds
      const initialDelay = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(initialDelay);
    }
  }, [notifications, isEnabled]);

  useEffect(() => {
    if (notifications.length > 0 && isVisible && isEnabled) {
      // Auto-hide current notification and show next one
      const interval = setInterval(() => {
        setIsVisible(false);
        
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % notifications.length);
          setIsVisible(true);
        }, 500); // Brief pause between notifications
      }, 8000); // Show each notification for 8 seconds

      return () => clearInterval(interval);
    }
  }, [notifications.length, isVisible, currentIndex, isEnabled]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('social_proof_notifications')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching social proof notifications:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Disable for this session
    setIsEnabled(false);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isEnabled || notifications.length === 0 || !isVisible) {
    return null;
  }

  const currentNotification = notifications[currentIndex];

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-slide-in-left">
      <div 
        className="rounded-lg p-4 text-white shadow-2xl max-w-sm relative transform transition-all duration-300 hover:scale-105"
        style={{ backgroundColor: currentNotification.background_color }}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-center space-x-3 pr-6">
          {currentNotification.profile_picture_url ? (
            <img 
              src={currentNotification.profile_picture_url} 
              alt={currentNotification.client_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl border-2 border-white/20">
              {currentNotification.emoji}
            </div>
          )}
          
          <div className="flex-1">
            <div className="font-medium text-sm leading-tight">
              <span className="font-semibold">{currentNotification.client_name}</span> from{" "}
              <span className="font-semibold">{currentNotification.client_company}</span>
            </div>
            <div className="text-xs opacity-95 mt-1">
              just got <span className="font-bold">{formatAmount(currentNotification.amount_funded)}</span> with{" "}
              <span className="font-semibold">{currentNotification.lender}</span> {currentNotification.emoji}
            </div>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
          <div 
            className="h-full bg-white/60 animate-[progress_8s_linear_forwards]"
            style={{
              animation: isVisible ? 'progress 8s linear forwards' : 'none'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SocialProofWidget;