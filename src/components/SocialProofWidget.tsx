import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, User } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";

type SocialProofNotification = Tables<"social_proof_notifications">;
type WidgetConfig = Tables<"social_proof_widget_config">;

const SocialProofWidget = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<SocialProofNotification[]>([]);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNotifications();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && config && isEnabled && sessionCount < config.max_notifications_per_session) {
      // Show first notification after configured delay
      const initialDelay = setTimeout(() => {
        setIsVisible(true);
        setSessionCount(1);
      }, config.initial_delay_seconds * 1000);

      return () => clearTimeout(initialDelay);
    }
  }, [notifications, config, isEnabled]);

  useEffect(() => {
    if (notifications.length > 0 && config && isVisible && isEnabled && sessionCount < config.max_notifications_per_session) {
      // Auto-hide current notification and show next one
      const notificationTimer = setTimeout(() => {
        setIsVisible(false);
        
        setTimeout(() => {
          if (sessionCount < config.max_notifications_per_session) {
            setCurrentIndex((prev) => (prev + 1) % notifications.length);
            setIsVisible(true);
            setSessionCount(prev => prev + 1);
          }
        }, 500); // Brief pause between notifications
      }, config.notification_duration_seconds * 1000);

      return () => clearTimeout(notificationTimer);
    }
  }, [notifications.length, config, isVisible, currentIndex, isEnabled, sessionCount]);

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

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('social_proof_widget_config')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setConfig(data);
      setIsEnabled(data.is_enabled);
    } catch (error) {
      console.error('Error fetching widget config:', error);
      // Use default config if none exists
      setConfig({
        id: '',
        interval_seconds: 8,
        max_notifications_per_session: 5,
        notification_duration_seconds: 8,
        initial_delay_seconds: 3,
        is_enabled: true,
        created_at: '',
        updated_at: ''
      });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Disable for this session
    setIsEnabled(false);
  };

  const handleImageError = (notificationId: string) => {
    setImageErrors(prev => new Set(prev).add(notificationId));
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Hide on mobile for loan estimator page
  if (isMobile && location.pathname === '/loan-estimator') {
    return null;
  }

  if (!config || !config.is_enabled || !isEnabled || notifications.length === 0 || !isVisible || sessionCount > config.max_notifications_per_session) {
    return null;
  }

  const currentNotification = notifications[currentIndex];
  const hasImageError = imageErrors.has(currentNotification.id);

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
          {currentNotification.profile_picture_url && !hasImageError ? (
            <img 
              src={currentNotification.profile_picture_url} 
              alt={currentNotification.client_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
              onError={() => handleImageError(currentNotification.id)}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20">
              {hasImageError || !currentNotification.profile_picture_url ? (
                <User className="w-6 h-6 text-white" />
              ) : (
                <span className="text-xl">{currentNotification.emoji}</span>
              )}
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
            className="h-full bg-white/60"
            style={{
              animation: isVisible ? `progress ${config.notification_duration_seconds}s linear forwards` : 'none'
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